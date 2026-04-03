/**
 * @file logger.ts
 * @description 时间段分文件日志库，支持按小时 / 天 / 月轮转
 *
 * 文件命名规则：
 *   hour  → logs/2026-03-19_14.log
 *   day   → logs/2026-03-19.log
 *   month → logs/2026-03.log
 *
 * 写入模型（async 模式）：
 *   write() → 追加到内存 buffer → 定时 / 高水位 / 轮转时 appendFile 落盘
 *   全程 append 语义，进程重启不会覆盖已有日志
 */

import { appendFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { appendFile, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

// ─── 类型 ────────────────────────────────────────────────────────────────────

/** 日志级别 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** 文件轮转粒度 */
export type RotateBy = "hour" | "day" | "month";

/** 日志元数据类型 */
export type Meta = Record<string, unknown> | Error | undefined | null;

/** Logger 构造选项 */
export interface LoggerOptions {
  /** 日志输出目录，默认 `logs` */
  dir?: string;
  /** 文件轮转粒度，默认 `day` */
  rotateBy?: RotateBy;
  /** 是否同时输出到 stdout，默认 `true` */
  stdout?: boolean;
  /** 最低记录级别，默认 `debug` */
  level?: LogLevel;
  /** 定时刷新间隔（ms），默认 `1000` */
  flushInterval?: number;
  /**
   * 内存缓冲高水位线（字节），达到后同步落盘，默认 `1MB`
   * 适用于 async 模式；sync 模式每次写入直接落盘，此选项无效
   */
  highWaterMark?: number;
  /** 保留归档文件的最大数量，0 表示不限制，默认 `0` */
  maxFiles?: number;
  /** 同步写入模式，默认 `false` */
  sync?: boolean;
  /** 格式化元数据的缩进空格数，默认 `1` */
  formatted?: number;
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

/** 级别权重映射，用于过滤低级别日志 */
const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** stdout 输出的 ANSI 颜色映射 */
const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

/** ANSI 重置码 */
const RESET = "\x1b[0m";

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/**
 * 两位数字补零
 * @param n 非负整数
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
  const y = date.getFullYear();
  const mo = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());

  switch (rotateBy) {
    case "hour":
      return `${y}-${mo}-${d}_${h}`;
    case "day":
      return `${y}-${mo}-${d}`;
    case "month":
      return `${y}-${mo}`;
    default:
      throw new Error(`Unknown rotateBy: ${rotateBy}`);
  }
}

/**
 * 计算给定粒度下的下一个边界时间戳（ms）
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
 * @param ts Unix 毫秒时间戳
 * @returns 格式化后的时间字符串
 */
function formatTime(ts: number): string {
  const d = new Date(ts);
  const ms = d.getMilliseconds().toString().padStart(3, "0");

  return (
    d.getFullYear() +
    "-" +
    pad2(d.getMonth() + 1) +
    "-" +
    pad2(d.getDate()) +
    " " +
    pad2(d.getHours()) +
    ":" +
    pad2(d.getMinutes()) +
    ":" +
    pad2(d.getSeconds()) +
    "." +
    ms
  );
}

// ─── 模块级 signal 注册 ───────────────────────────────────────────────────────

/** 所有存活的 Logger 实例 */
const instances = new Set<Logger>();

/** 是否已进入退出流程，防止重入 */
let exiting = false;
let hooksRegistered = false;

/**
 * 同步刷写所有实例，供进程退出时调用；幂等
 */
function flushAllSync(): void {
  if (exiting) return;
  exiting = true;
  for (const inst of instances) {
    inst.flushSync();
  }
}

/**
 * 注册进程退出钩子，模块级仅执行一次
 * once 保证每个信号只触发一次，exit 事件兜底
 */
function registerSignalHooks(): void {
  process.once("SIGINT", () => {
    flushAllSync();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    flushAllSync();
    process.exit(0);
  });
  process.once("exit", flushAllSync);
}

// ─── Logger 类 ───────────────────────────────────────────────────────────────

/**
 * 按时间段自动轮转的文件 Logger
 *
 * async 模式写入模型：
 *   write() → buffer（内存）→ appendFile（定时 / 高水位 / 轮转时落盘）
 *   全程 O_APPEND 语义，进程重启不会覆盖已有内容
 *
 * @example
 * const log = new Logger({ rotateBy: "hour", maxFiles: 24 });
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

  /**
   * 内存缓冲高水位线（字节）
   * 超出后同步落盘，防止内存无限增长
   */
  private readonly highWaterMark: number;

  /** 最大归档文件数量，0 表示不限制 */
  private readonly maxFiles: number;

  /** 同步写入模式 */
  private readonly sync: boolean;

  /** 当前活跃的文件段标识 */
  private currentSegment = "";

  /** 当前活跃的日志文件完整路径（两种模式共用） */
  private filePath = "";

  /** 当前 segment 的过期边界（ms），到期前跳过 buildSegment 重算 */
  private segmentExpiry = 0;

  /**
   * async 模式的内存写入缓冲
   * write() 追加至此，定时器 / 高水位 / 轮转时批量 appendFile 落盘
   */
  private buffer = "";

  /** 当前 buffer 的字节估算值，用于高水位判断 */
  private bufferSize = 0;

  /** 时间格式化缓存：同毫秒内复用 */
  private cachedTs = -1;
  private cachedTime = "";

  /** 定时刷新句柄（async 模式） */
  private timer: ReturnType<typeof setInterval> | null = null;

  /** 关闭状态标志，close() 后拒绝所有写入 */
  private closed = false;

  /** flush 锁，防止并发 flush 导致数据重复或丢失 */
  private flushing = false;

  /** 格式化元数据的缩进空格数 */
  private formatted: number = 1;

  /**
   * 创建 Logger 实例
   * @param options 构造选项
   */
  constructor(options: LoggerOptions = {}) {
    this.dir = options.dir ?? "logs";
    this.rotateBy = options.rotateBy ?? "day";
    this.toStdout = options.stdout ?? true;
    this.minLevel = LEVEL_RANK[options.level ?? "debug"];
    this.highWaterMark = options.highWaterMark ?? 1024 * 1024;
    this.maxFiles = options.maxFiles ?? 0;
    this.sync = options.sync ?? false;
    this.formatted = options.formatted ?? 1;

    mkdirSync(this.dir, { recursive: true });
    instances.add(this);

    if (!hooksRegistered) {
      registerSignalHooks();
      hooksRegistered = true;
    }

    if (!this.sync) {
      const interval = options.flushInterval ?? 1000;
      this.timer = setInterval(() => {
        this.flush().catch(() => { });
      }, interval);
      this.timer.unref();
    }
  }

  // ── 公开日志方法 ───────────────────────────────────────────────────────────

  /**
   * 记录 DEBUG 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  debug(msg: string, meta?: Meta): void {
    this.write("debug", msg, meta);
  }

  /**
   * 记录 INFO 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  info(msg: string, meta?: Meta): void {
    this.write("info", msg, meta);
  }

  /**
   * 记录 WARN 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  warn(msg: string, meta?: Meta): void {
    this.write("warn", msg, meta);
  }

  /**
   * 记录 ERROR 级日志
   * @param msg  消息文本
   * @param meta 附加元数据
   */
  error(msg: string, meta?: Meta): void {
    this.write("error", msg, meta);
  }

  // ── 生命周期 ───────────────────────────────────────────────────────────────

  /**
   * 将内存缓冲异步落盘（async 模式）
   * buffer 在 await 前已清空，落盘期间新写入安全累积到新 buffer
   * @returns 落盘操作的 Promise
   */
  async flush(): Promise<void> {
    if (this.sync || !this.buffer || this.flushing) return;
    this.flushing = true;

    const data = this.buffer;
    const path = this.filePath;
    this.buffer = "";
    this.bufferSize = 0;

    try {
      await appendFile(path, data);
    } catch (err) {
      this.buffer = data + this.buffer;
      this.bufferSize = this.buffer.length;
      process.stderr.write(`[logger] flush error: ${err}\n`);
    } finally {
      this.flushing = false;
    }
  }

  /**
   * 将内存缓冲同步落盘，专供进程退出钩子调用
   */
  flushSync(): void {
    if (this.sync || !this.buffer) return;
    this.drainBufferSync();
  }

  /**
   * 关闭 Logger：停定时器 → 最终落盘 → 从实例集合移除
   * @returns 关闭操作的 Promise
   */
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    try {
      await this.flush();
    } finally {
      instances.delete(this);
    }
  }

  // ── 私有实现 ───────────────────────────────────────────────────────────────

  /**
   * 核心写入：级别过滤 → 关闭检测 → 轮转检测 → 序列化 → 落盘 → stdout
   * @param level 日志级别
   * @param msg   消息文本
   * @param meta  附加元数据
   */
  private write(
    level: LogLevel,
    msg: string,
    meta?: Meta,
  ): void {
    if (LEVEL_RANK[level] < this.minLevel) return;
    if (this.closed) return;

    const ts = Date.now();
    const time = this.getCachedTime(ts);
    const segment = this.getSegment(ts);

    this.rotateIfNeeded(segment);

    meta = this.sanitizeMeta(meta);

    const safe = meta;
    const metaJson = safe ? JSON.stringify(safe, null, this.formatted) : null;
    const line = this.buildLine(level, msg, time, metaJson);

    if (this.sync) {
      this.writeSync(line);
    } else {
      this.writeAsync(line);
    }

    if (this.toStdout) this.printStdout(level, msg, metaJson, time);
  }

  /**
   * 规范化元数据：处理特殊类型对象
   * @param meta 元数据
   * @returns 规范化后的元数据
   */
  private sanitizeMeta(meta?: Meta) {
    if (meta instanceof Error) return { name: meta.name, msg: meta.message, stack: meta.stack };
    return meta;
  }

  /**
   * 将日志行追加到内存缓冲；超过高水位时同步落盘
   * @param line 日志行
   */
  private writeAsync(line: string): void {
    this.buffer += line;
    this.bufferSize += line.length;
    if (this.bufferSize >= this.highWaterMark) this.drainBufferSync();
  }

  /**
   * 同步追加写入（sync 模式）
   * @param line 日志行
   */
  private writeSync(line: string): void {
    try {
      appendFileSync(this.filePath, line);
    } catch (err) {
      process.stderr.write(`[logger] writeSync error: ${err}\n`);
    }
  }

  /**
   * 同步将内存缓冲落盘并清空
   * 用于：高水位自动刷写、轮转前的缓冲迁移、进程退出
   */
  private drainBufferSync(): void {
    if (!this.buffer) return;
    try {
      appendFileSync(this.filePath, this.buffer);
      // Bug2 fix: 只在写入成功后清空，失败时保留数据防止静默丢失
      this.buffer = "";
      this.bufferSize = 0;
    } catch (err) {
      process.stderr.write(`[logger] drainBufferSync error: ${err}\n`);
    }
  }

  /**
   * 返回当前时间段标识，仅在跨越边界时重算
   * @param ts 当前 Unix 毫秒时间戳
   * @returns 文件段标识字符串
   */
  private getSegment(ts: number): string {
    if (ts < this.segmentExpiry) return this.currentSegment;

    const now = new Date(ts);
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
      this.cachedTs = ts;
      this.cachedTime = formatTime(ts);
    }
    return this.cachedTime;
  }

  /**
   * 若文件段已切换，同步落盘旧缓冲并切换到新路径
   * 轮转是低频事件，此处的同步落盘不影响整体吞吐
   * @param segment 当前时间段标识
   */
  private rotateIfNeeded(segment: string): void {
    if (segment === this.currentSegment && this.filePath !== "") return;

    // 轮转前将旧 buffer 同步落盘到旧文件，确保数据不丢失
    if (!this.sync) this.drainBufferSync();

    this.currentSegment = segment;
    this.filePath = join(this.dir, `${segment}.log`);

    if (this.maxFiles > 0) {
      if (this.sync) this.pruneArchivesSync();
      else this.pruneArchivesAsync();
    }
  }

  /** 同步删除多余的归档文件（保留最新的 maxFiles 个） */
  private pruneArchivesSync(): void {
    try {
      const active = `${this.currentSegment}.log`;
      const archives = readdirSync(this.dir)
        .filter((f) => f.endsWith(".log") && f !== active)
        .sort();

      if (archives.length <= this.maxFiles) return;

      const stale = archives.slice(0, archives.length - this.maxFiles);
      for (const f of stale) unlinkSync(join(this.dir, f));
    } catch (err) {
      process.stderr.write(`[logger] pruneArchivesSync error: ${err}\n`);
    }
  }

  /** 异步删除多余的归档文件（保留最新的 maxFiles 个） */
  private async pruneArchivesAsync(): Promise<void> {
    // 立即快照，防止 readdir 挂起期间轮转导致 currentSegment 变更
    const active = `${this.currentSegment}.log`;
    try {
      const archives = (await readdir(this.dir))
        .filter((f) => f.endsWith(".log") && f !== active)
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
   * @returns 以双换行符结尾的完整日志行
   */
  private buildLine(
    level: LogLevel,
    msg: string,
    time: string,
    metaJson: string | null,
  ): string {
    const label = level.toUpperCase().padEnd(5);
    const metaStr = metaJson ? `\n${metaJson}` : "";
    return `${time} [${label}] ${msg}${metaStr}\n`;
  }

  /**
   * 向 stdout 输出带 ANSI 颜色的可读日志行
   * @param level    日志级别
   * @param msg      消息文本
   * @param metaJson 预序列化的 meta JSON，无 meta 时为 null
   * @param time     预格式化时间字符串
   */
  private printStdout(
    level: LogLevel,
    msg: string,
    metaJson: string | null,
    time: string,
  ): void {
    const color = LEVEL_COLOR[level];
    const label = level.toUpperCase().padEnd(5);
    const metaStr = metaJson ? `\n${metaJson}` : "";

    process.stdout.write(
      `${color}${time} [${label}]${RESET} ${msg}${metaStr}\n`,
    );
  }
}

// ─── 默认单例 ─────────────────────────────────────────────────────────────────

/** 全局默认 Logger，按天轮转，输出到 `./logs/` */
export const logger = new Logger();
