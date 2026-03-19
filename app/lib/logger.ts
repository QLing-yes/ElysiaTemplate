/**
 * @file logger.ts
 * @description Bun 时间段分文件日志库，支持按小时 / 天 / 月轮转
 *
 * 文件命名规则：
 *   hour  → logs/2026-03-19_14.log
 *   day   → logs/2026-03-19.log
 *   month → logs/2026-03.log
 */

import { mkdirSync, appendFileSync } from "node:fs";

// ─── 类型 ────────────────────────────────────────────────────────────────────

/** 日志级别 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** 文件轮转粒度 */
export type RotateBy = "hour" | "day" | "month";

/** Logger 构造选项 */
export interface LoggerOptions {
  /** 日志输出目录，默认 `./logs` */
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
   * 缓冲上限字节数，超出时立即同步落盘，默认 `8MB`
   * 防止高吞吐下内存无限增长（漏记 3 背压保护）
   */
  maxBufferBytes?: number;
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
 * 两位数字补零，比 padStart 少一次字符串分配
 * @param n 0–59 的整数
 * @returns 补零后的字符串
 */
function pad2(n: number): string {
  return n < 10 ? "0" + n : "" + n;
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
 * 用于缓存 segment，避免每条日志都重算
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
 * 手动拼接，避免 toISOString + replace + slice 的三次字符串分配
 * @param ts Unix 毫秒时间戳
 * @returns 格式化后的时间字符串
 */
function formatTime(ts: number): string {
  const d  = new Date(ts);
  const ms = d.getMilliseconds().toString().padStart(3, "0");

  return (
    d.getFullYear()          + "-" +
    pad2(d.getMonth() + 1)   + "-" +
    pad2(d.getDate())        + " " +
    pad2(d.getHours())       + ":" +
    pad2(d.getMinutes())     + ":" +
    pad2(d.getSeconds())     + "." +
    ms
  );
}

// ─── 模块级 signal 注册 ───────────────────────────────────────────────────────

/** 所有存活的 Logger 实例，用于进程退出时统一落盘 */
const instances = new Set<Logger>();

/** 是否已开始退出流程，防止重入 */
let exiting         = false;
let hooksRegistered = false;

/**
 * 同步刷写所有实例，供进程退出时调用
 * 幂等：多次触发（SIGINT → exit）只执行一次
 */
function flushAllSync(): void {
  if (exiting) return;
  exiting = true;
  for (const inst of instances) inst.flushSync();
}

/**
 * 注册进程退出钩子，模块级仅执行一次
 * fix(漏记2): 改用 on + exiting 幂等标志，防止 once 消费后新缓冲无人处理
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
 * 核心设计：全路径同步写入 + 内存缓冲批量落盘
 * - 写入：日志先进内存缓冲，定时或超限时批量 appendFileSync
 * - 保证：同步 IO 消除 async/exit 裂缝，缓冲批量写保证性能
 *
 * @example
 * const log = new Logger({ rotateBy: "hour", dir: "./logs" });
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

  /** 最低级别权重，低于此值的日志将被丢弃 */
  private readonly minLevel: number;

  /**
   * 缓冲上限字节数
   * 超限时立即同步落盘，防止高吞吐下内存无限增长
   */
  private readonly maxBufferBytes: number;

  /** 当前活跃的文件段标识，如 `"2026-03-19"` */
  private currentSegment = "";

  /**
   * 当前 segment 的过期边界（ms）
   * fix(性能1): ts < segmentExpiry 时直接复用 currentSegment，跳过重算
   */
  private segmentExpiry = 0;

  /**
   * 日志行累积缓冲
   * fix(性能5): 改为 string 直接追加，消除 string[] + join() 的 O(n) 分配
   */
  private buffer      = "";
  private bufferBytes = 0;

  /**
   * 时间戳格式化缓存
   * fix(性能2): 同毫秒内多条日志复用同一格式化结果
   */
  private cachedTs   = -1;
  private cachedTime = "";

  /** 定时刷新句柄 */
  private timer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param options 构造选项，全部字段可选
   */
  constructor(options: LoggerOptions = {}) {
    this.dir            = options.dir            ?? "./logs";
    this.rotateBy       = options.rotateBy       ?? "day";
    this.toStdout       = options.stdout         ?? true;
    this.minLevel       = LEVEL_RANK[options.level ?? "debug"];
    this.maxBufferBytes = options.maxBufferBytes  ?? 8 * 1024 * 1024;

    const interval = options.flushInterval ?? 1000;

    mkdirSync(this.dir, { recursive: true });

    instances.add(this);
    if (!hooksRegistered) { registerSignalHooks(); hooksRegistered = true; }

    this.timer = setInterval(() => this.flushSync(), interval);
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
   * 同步将缓冲内容落盘
   *
   * fix(漏记1): 全路径改为同步 IO，彻底消除 async writeChain 与 exit 事件的时序裂缝
   * 缓冲批量写入保证性能，同步保证零漏记
   */
  flushSync(): void {
    if (!this.buffer) return;

    const content  = this.buffer;
    const filePath = `${this.dir}/${this.currentSegment}.log`;
    this.buffer      = "";
    this.bufferBytes = 0;

    appendFileSync(filePath, content);
  }

  /**
   * 关闭 Logger：先停定时器，再落盘剩余缓冲，最后从实例集合移除
   */
  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.flushSync();
    instances.delete(this);
  }

  // ── 私有实现 ───────────────────────────────────────────────────────────────

  /**
   * 核心写入：级别过滤 → segment 检查 → 轮转检测 → 序列化 → 入缓冲 → 背压检查 → stdout
   * @param level 日志级别
   * @param msg   消息文本
   * @param meta  附加元数据
   */
  private write(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < this.minLevel) return;

    const ts      = Date.now();
    const time    = this.getCachedTime(ts);
    const segment = this.getSegment(ts);

    this.rotateIfNeeded(segment);

    // fix(性能3/4): meta 不存在走快速路径，存在时序列化一次后文件与 stdout 共用
    const metaJson = meta !== undefined ? JSON.stringify(meta) : null;
    const line     = this.buildLine(level, msg, time, metaJson);

    this.buffer      += line;
    this.bufferBytes += line.length;

    // fix(漏记3): 背压保护，缓冲超限立即同步落盘，防止 OOM 后日志全丢
    if (this.bufferBytes >= this.maxBufferBytes) this.flushSync();

    if (this.toStdout) this.printStdout(level, msg, metaJson, time);
  }

  /**
   * 返回当前时间段标识，仅在跨越边界时重算
   * fix(性能1): 消除每条日志都调用 buildSegment 的重复计算
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
   * fix(性能2): 消除同毫秒内多条日志的重复格式化分配
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
   * 构造单行 JSON 日志字符串
   * fix(性能3): meta 为 null 时直接拼接，跳过对象展开与二次 stringify
   * @param level    日志级别
   * @param msg      消息文本
   * @param time     预格式化时间字符串
   * @param metaJson 预序列化的 meta JSON 字符串，无 meta 时为 null
   * @returns 以换行符结尾的完整 JSON 行
   */
  private buildLine(
    level:    LogLevel,
    msg:      string,
    time:     string,
    metaJson: string | null,
  ): string {
    const base = `{"time":"${time}","level":"${level}","msg":${JSON.stringify(msg)}`;
    return metaJson
      ? base + "," + metaJson.slice(1) + "\n"   // slice(1) 去掉 metaJson 的开头 "{"
      : base + "}\n";
  }

  /**
   * 若文件段已切换，将旧缓冲同步落盘并更新段标识
   * @param segment 当前时间段标识
   */
  private rotateIfNeeded(segment: string): void {
    if (segment === this.currentSegment) return;

    if (this.buffer) {
      const content  = this.buffer;
      const filePath = `${this.dir}/${this.currentSegment}.log`;
      this.buffer      = "";
      this.bufferBytes = 0;
      appendFileSync(filePath, content);
    }

    this.currentSegment = segment;
  }

  /**
   * 向 stdout 输出带 ANSI 颜色的可读日志行
   * fix(性能4): 直接复用已序列化的 metaJson，不重复 JSON.stringify
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
    const metaStr = metaJson ? "  " + metaJson : "";

    process.stdout.write(
      `${color}[${label}]${RESET} ${time}  ${msg}${metaStr}\n`
    );
  }
}

// ─── 默认单例 ─────────────────────────────────────────────────────────────────

/** 全局默认 Logger，按天轮转，输出到 `./logs/` */
export const logger = new Logger();