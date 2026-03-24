/**
 * @file logger.ts
 * @description Bun 时间段分文件日志库，支持按小时 / 天 / 月轮转
 *
 * 文件命名规则：
 *   hour  → logs/2026-03-19_14.log
 *   day   → logs/2026-03-19.log
 *   month → logs/2026-03.log
 */

import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

// ─── 类型 ────────────────────────────────────────────────────────────────────

/** 日志级别 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** 文件轮转粒度 */
export type RotateBy = "hour" | "day" | "month";

/** Logger 构造选项 */
export interface LoggerOptions {
  /** 日志输出目录，默认项目根目录的 `logs` 文件夹 */
  dir?: string;
  /** 文件轮转粒度，默认 `day` */
  rotateBy?: RotateBy;
  /** 是否同时输出到 stdout，默认 `true` */
  stdout?: boolean;
  /** 最低记录级别，默认 `debug` */
  level?: LogLevel;
  /** 缓冲刷新间隔（ms），默认 `1000` */
  flushInterval?: number;
  /**
   * FileSink 高水位线（字节），达到后 Bun 自动落盘，默认 `1MB`
   * 替代原有手动 maxBufferBytes + 背压计数逻辑
   */
  highWaterMark?: number;
  /** 保留归档文件的最大数量，超出后删除最旧的归档 */
  maxFiles?: number;
  /**
   * 同步写入模式，默认 `false`（使用 FileSink 异步缓冲）
   * 开启后每次 write 直接刷盘，完全避免缓冲丢失但影响性能
   */
  sync?: boolean;
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

/** 级别权重映射，用于过滤低级别日志 */
const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
};

/** stdout 输出的 ANSI 颜色映射 */
const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info:  "\x1b[32m",
  warn:  "\x1b[33m",
  error: "\x1b[31m",
};

/** ANSI 重置码 */
const RESET = "\x1b[0m";

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/**
 * 两位数字补零，避免 padStart 的字符串分配
 * @param n 非负整数（月/日/时/分/秒传入 0–59，年份直接透传）
 * @returns 个位数前补零，两位以上原样返回
 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * 根据轮转粒度生成文件段标识
 * @param date     目标时间
 * @param rotateBy 轮转粒度
 * @returns 段标识，如 `"2026-03-19"` / `"2026-03-19_14"` / `"2026-03"`
 */
function buildSegment(date: Date, rotateBy: RotateBy): string {
  const y  = date.getFullYear();
  const mo = pad2(date.getMonth() + 1);
  const d  = pad2(date.getDate());
  const h  = pad2(date.getHours());

  switch (rotateBy) {
    case "hour":  return `${y}-${mo}-${d}_${h}`;
    case "day":   return `${y}-${mo}-${d}`;
    case "month": return `${y}-${mo}`;
    default:      throw new Error(`Unknown rotateBy: ${rotateBy}`);
  }
}

/**
 * 计算当前 segment 在给定粒度下的下一个边界时间戳（ms）
 * @param date     当前时间
 * @param rotateBy 轮转粒度
 * @returns 下一边界的 Unix 毫秒时间戳
 */
function nextBoundary(date: Date, rotateBy: RotateBy): number {
  const t = new Date(date);

  switch (rotateBy) {
    case "hour":
      t.setHours(t.getHours() + 1, 0, 0, 0);
      break;
    case "day":
      t.setDate(t.getDate() + 1);
      t.setHours(0, 0, 0, 0);
      break;
    case "month":
      t.setMonth(t.getMonth() + 1, 1);
      t.setHours(0, 0, 0, 0);
      break;
  }

  return t.getTime();
}

/**
 * 将 Unix 毫秒时间戳格式化为 `"YYYY-MM-DD HH:mm:ss.SSS"`
 * 手动拼接，避免 toISOString + replace + slice 的多次字符串分配
 * @param ts Unix 毫秒时间戳
 * @returns 格式化后的时间字符串
 */
function formatTime(ts: number): string {
  const d  = new Date(ts);
  const ms = d.getMilliseconds().toString().padStart(3, "0");

  return (
    d.getFullYear()        + "-" +
    pad2(d.getMonth() + 1) + "-" +
    pad2(d.getDate())      + " " +
    pad2(d.getHours())     + ":" +
    pad2(d.getMinutes())   + ":" +
    pad2(d.getSeconds())   + "." +
    ms
  );
}

// ─── 模块级 signal 注册 ───────────────────────────────────────────────────────

/** 所有存活的 Logger 实例 */
const instances = new Set<Logger>();

/** 是否已进入退出流程，防止重入 */
let exiting         = false;
let hooksRegistered = false;

/**
 * 同步刷写所有实例，供进程退出时调用；幂等
 */
function flushAllSync(): void {
  if (exiting) return;
  exiting = true;
  for (const inst of instances) inst.flushSync();
}

/**
 * 注册进程退出钩子，模块级仅执行一次
 * 使用 on + exiting 标志替代 once，防止信号消费后新日志无人处理
 */
function registerSignalHooks(): void {
  process.on("SIGINT",  () => { flushAllSync(); process.exit(0); });
  process.on("SIGTERM", () => { flushAllSync(); process.exit(0); });
  process.on("exit", flushAllSync);
}

// ─── Logger 类 ───────────────────────────────────────────────────────────────

/**
 * 按时间段自动轮转的文件 Logger
 *
 * 写入路径：`write()` → `FileSink.write()` → Bun 内部缓冲
 * 落盘路径：定时 `flush()` / 高水位自动 flush / 退出时 `flushSync()`
 *
 * @example
 * const log = new Logger({ rotateBy: "hour" });
 * log.info("启动", { pid: process.pid });
 * await log.close();
 */
export class Logger {
  /** 日志输出目录 */
  private readonly dir: string;

  /** 文件轮转粒度 */
  private readonly rotateBy: RotateBy;

  /** 是否同时输出到 stdout */
  private readonly toStdout: boolean;

  /** 最低级别权重 */
  private readonly minLevel: number;

  /** FileSink 高水位线（字节） */
  private readonly highWaterMark: number;

  /** 最大归档文件数量 */
  private readonly maxFiles: number;

  /** 同步写入模式 */
  private readonly sync: boolean;

  /** 当前活跃的文件段标识 */
  private currentSegment = "";

  /** 轮转锁，防止并发轮转 */
  private rotating = false;

  /** 当前活跃的文件路径（同步模式下使用） */
  private filePath = "";

  /** 当前 segment 的过期边界（ms），到期前跳过 buildSegment 重算 */
  private segmentExpiry = 0;

  /**
   * Bun 原生 FileSink：负责缓冲与落盘，替代手动 buffer 字符串
   * 懒初始化：首条日志写入时创建，轮转时替换
   */
  private sink: Bun.FileSink | null = null;

  /** 时间格式化缓存：同毫秒内复用 */
  private cachedTs   = -1;
  private cachedTime = "";

  /** 定时刷新句柄 */
  private timer: ReturnType<typeof setInterval> | null = null;

  /** 构造选项 */
  constructor(options: LoggerOptions = {}) {
    this.dir           = options.dir ?? "logs";
    this.rotateBy      = options.rotateBy ?? "day";
    this.toStdout     = options.stdout ?? true;
    this.minLevel     = LEVEL_RANK[options.level ?? "debug"];
    this.highWaterMark = options.highWaterMark ?? 1024 * 1024;
    this.maxFiles     = options.maxFiles ?? 0;
    this.sync         = options.sync ?? false;

    const interval = options.flushInterval ?? 1000;
    mkdirSync(this.dir, { recursive: true });

    instances.add(this);
    if (!hooksRegistered) { registerSignalHooks(); hooksRegistered = true; }
    if (!this.sync) {
      this.timer = setInterval(() => this.flush(), interval);
      this.timer.unref();
    }
  }

  // ── 公开日志方法 ───────────────────────────────────────────────────────────

  /**
   * 记录 DEBUG 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  debug(msg: string, meta?: Record<string, unknown>): void {
    this.write("debug", msg, meta);
  }

  /**
   * 记录 INFO 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  info(msg: string, meta?: Record<string, unknown>): void {
    this.write("info", msg, meta);
  }

  /**
   * 记录 WARN 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  warn(msg: string, meta?: Record<string, unknown>): void {
    this.write("warn", msg, meta);
  }

  /**
   * 记录 ERROR 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  error(msg: string, meta?: Record<string, unknown>): void {
    this.write("error", msg, meta);
  }

  // ── 生命周期 ───────────────────────────────────────────────────────────────

  /**
   * 主动将 FileSink 内部缓冲落盘
   * @returns flush 写入的字节数（由 FileSink 返回）
   */
  flush(): number | Promise<number> {
    if (this.sync) return 0;
    return this.sink?.flush() ?? 0;
  }

  /**
   * 同步落盘：仅用于进程退出场景
   * 同步模式下无需操作，同步写入已保证数据落盘
   */
  flushSync(): void {
    if (this.sync) return;
    if (!this.sink) return;
    try {
      const result = this.sink.flush();
      if (result instanceof Promise) {
        process.stderr.write("[logger] flushSync: async flush detected\n");
      }
    } catch (err) {
      process.stderr.write(`[logger] flushSync error: ${err}\n`);
    }
  }

  /**
   * 关闭 Logger：停定时器 → end FileSink → 从实例集合移除
   */
  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.sink) {
      await this.sink.end();
      this.sink = null;
    }

    if (this.sync) {
      this.filePath = "";
    }

    instances.delete(this);
  }

  // ── 私有实现 ───────────────────────────────────────────────────────────────

  /**
   * 核心写入：级别过滤 → segment 检查 → 轮转 → 序列化 → FileSink.write() / sync write → stdout
   * @param level 日志级别
   * @param msg   消息文本
   * @param meta  附加元数据
   */
  private write(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < this.minLevel) return;
    if (this.timer === null && this.sink === null && (!this.sync || this.filePath === "")) return;

    const ts      = Date.now();
    const time    = this.getCachedTime(ts);
    const segment = this.getSegment(ts);

    this.rotateIfNeeded(segment);

    const safe     = this.safeMeta(meta);
    const metaJson = safe ? JSON.stringify(safe) : null;
    const line     = this.buildLine(level, msg, time, metaJson);

    if (this.sync) {
      this.writeSync(line);
    } else {
      this.writeAsync(line);
    }

    if (this.toStdout) this.printStdout(level, msg, metaJson, time);
  }

  /**
   * 异步写入（使用 FileSink）
   * @param line 日志行
   */
  private writeAsync(line: string): void {
    try {
      this.sink!.write(line);
    } catch (err) {
      process.stderr.write(`[logger] write error: ${err}\n`);
    }
  }

  /**
   * 同步写入（直接落盘，完全避免缓冲丢失）
   * Bun.write() 默认追加模式，不会覆盖已有内容
   * @param line 日志行
   */
  private writeSync(line: string): void {
    try {
      Bun.write(this.filePath, line);
    } catch (err) {
      process.stderr.write(`[logger] writeSync error: ${err}\n`);
    }
  }

  /**
   * 返回当前时间段标识，仅在跨越边界时重算
   * @param ts 当前 Unix 毫秒时间戳
   * @returns 文件段标识字符串
   */
  private getSegment(ts: number): string {
    if (ts < this.segmentExpiry) return this.currentSegment;

    const now          = new Date(ts);
    this.segmentExpiry = nextBoundary(now, this.rotateBy);
    return buildSegment(now, this.rotateBy);
  }

  /**
   * 返回格式化后的时间字符串，相同毫秒内复用缓存
   * @param ts 当前 Unix 毫秒时间戳
   * @returns 格式化时间字符串
   */
  private getCachedTime(ts: number): string {
    if (ts !== this.cachedTs) {
      this.cachedTs   = ts;
      this.cachedTime = formatTime(ts);
    }
    return this.cachedTime;
  }

  /**
   * 若文件段已切换，end 旧 FileSink 并为新段创建新 sink
   * @param segment 当前时间段标识
   */
  private rotateIfNeeded(segment: string): void {
    if (segment === this.currentSegment && (this.sink || this.filePath)) return;
    if (this.rotating) return;

    this.rotating = true;

    if (this.sink) {
      const r = this.sink.flush();
      if (r instanceof Promise) {
        process.stderr.write("[logger] rotate flush async — data may lag\n");
      }
      this.sink.end();
      this.sink = null;
    }

    this.currentSegment = segment;

    if (this.sync) {
      this.filePath = join(this.dir, `${segment}.log`);
    } else {
      this.sink = Bun.file(`${this.dir}/${segment}.log`).writer({
        highWaterMark: this.highWaterMark,
      });
      this.sink.unref();
    }

    if (this.maxFiles > 0) {
      if (this.sync) {
        this.pruneArchivesSync();
      } else {
        this.pruneArchivesAsync();
      }
    }

    this.rotating = false;
  }

  /** 同步删除多余的归档文件（保留最新的 maxFiles 个） */
  private pruneArchivesSync(): void {
    try {
      const entries = readdirSync(this.dir);
      const archives = entries
        .filter((f) => f.endsWith(".log") && f !== `${this.currentSegment}.log`)
        .sort();

      if (archives.length <= this.maxFiles) return;

      const stale = archives.slice(0, archives.length - this.maxFiles);
      for (const f of stale) {
        unlinkSync(join(this.dir, f));
      }
    } catch (err) {
      process.stderr.write(`[logger] pruneArchivesSync error: ${err}\n`);
    }
  }

  /** 异步删除多余的归档文件（保留最新的 maxFiles 个） */
  private async pruneArchivesAsync(): Promise<void> {
    try {
      const entries = await readdir(this.dir);
      const archives = entries
        .filter((f) => f.endsWith(".log") && f !== `${this.currentSegment}.log`)
        .sort();

      if (archives.length <= this.maxFiles) return;

      const stale = archives.slice(0, archives.length - this.maxFiles);
      await Promise.all(stale.map((f) => unlink(join(this.dir, f))));
    } catch (err) {
      process.stderr.write(`[logger] pruneArchivesAsync error: ${err}\n`);
    }
  }

  /**
   * 构建文本格式日志行
   * @param level    日志级别
   * @param msg      消息文本
   * @param time     预格式化时间字符串
   * @param metaJson 预序列化的 meta JSON，无 meta 时为 null
   * @returns 以换行符结尾的完整日志行
   */
  private buildLine(
    level:    LogLevel,
    msg:      string,
    time:     string,
    metaJson: string | null,
  ): string {
    const label   = level.toUpperCase().padEnd(5);
    const metaStr = metaJson ? `\n${metaJson}` : "";
    return `${time} [${label}] ${msg}${metaStr}\n\n`;
  }

  /**
   * 从 meta 中剔除与核心字段（time / level / msg）冲突的 key
   * 无冲突时返回原引用，避免不必要的对象分配
   * @param meta 原始附加元数据
   * @returns 安全的 meta 对象，或 null
   */
  private safeMeta(
    meta: Record<string, unknown> | undefined,
  ): Record<string, unknown> | null {
    if (!meta) return null;

    const hasConflict = "time" in meta || "level" in meta || "msg" in meta;
    if (!hasConflict) return meta;

    const { time: _t, level: _l, msg: _m, ...rest } = meta;
    return Object.keys(rest).length ? rest : null;
  }

  /**
   * 向 stdout 输出带 ANSI 颜色的可读日志行
   * @param level    日志级别
   * @param msg      消息文本
   * @param metaJson 预序列化的 meta JSON，无 meta 时为 null
   * @param time     预格式化时间字符串
   */
  private printStdout(
    level:    LogLevel,
    msg:      string,
    metaJson: string | null,
    time:     string,
  ): void {
    const color   = LEVEL_COLOR[level];
    const label   = level.toUpperCase().padEnd(5);
    const metaStr = metaJson ? `\n${metaJson}` : "";

    process.stdout.write(
      `${color}${time} [${label}]${RESET} ${msg}${metaStr}\n\n`
    );
  }
}

// ─── 默认单例 ─────────────────────────────────────────────────────────────────

/** 全局默认 Logger，按天轮转，输出到 `./logs/` */
export const logger = new Logger();