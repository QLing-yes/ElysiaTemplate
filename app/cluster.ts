import cluster from "node:cluster";
import os from "node:os";
import { logger } from "@/app/lib/logger";

// 单机多进程集群模式, 利用服务器所有CPU核心
// https://elysiajs.com/patterns/deploy.html#cluster-mode

const config = {
  /** 是否启用集群模式 */
  enabled: process.env.CLUSTER_ENABLED === "true",
  /** worker 进程数量，默认 CPU 核心数，至少 1 */
  workers: Math.max(1, Math.min(Number(process.env.CLUSTER_WORKERS) || os.availableParallelism(), os.availableParallelism())),
  /** worker 崩溃后重启延迟（毫秒） */
  restartDelay:  Number(process.env.CLUSTER_RESTART_DELAY)  || 1000,
  /** 时间窗口内允许的最大重启次数，超过则熔断 */
  maxRestarts:   Number(process.env.CLUSTER_MAX_RESTARTS)   || 5,
  /** 重启计数的统计时间窗口（毫秒） */
  restartWindow: Number(process.env.CLUSTER_RESTART_WINDOW) || 60000,
} as const;

const port = process.env.PORT;

if (!config.enabled) {
  // 集群模式未启用，直接加载应用入口
  logger.info(`[cluster] disabled | http://localhost:${port} | http://localhost:${port}/openapi`);
  await import("./index");
} else if (cluster.isPrimary) {
  let restartCount = 0;          // 当前窗口内的重启次数
  let windowStart = Date.now();  // 当前统计窗口的起始时间
  let isShuttingDown = false;    // 关闭标志，防止熔断触发 exit 事件重入

  // 启动指定数量的 worker 进程
  for (let i = 0; i < config.workers; i++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    logger.error(`[cluster] worker ${worker.process.pid} exited (${signal ?? `code ${code}`})`);

    // 主动关闭或已在关闭中，不重启
    if (isShuttingDown || worker.exitedAfterDisconnect) return;

    // 滑动窗口：超出统计窗口则重置计数
    const now = Date.now();
    if (now - windowStart > config.restartWindow) { restartCount = 0; windowStart = now; }

    // 熔断：窗口内重启次数超限，关闭全部 worker 避免集群半死
    if (++restartCount > config.maxRestarts) {
      logger.error(`[cluster] circuit breaker tripped (${restartCount} restarts), shutting down`);
      isShuttingDown = true;
      Object.values(cluster.workers!).forEach(w => w?.kill("SIGTERM"));
      return;
    }

    // 延迟重启，避免崩溃风暴
    setTimeout(() => {
      const worker = cluster.fork();
      logger.info(`[cluster] worker restarted, pid: ${worker.process.pid}`);
    }, config.restartDelay);
  });

  // 收到退出信号时，通知所有 worker 优雅退出，让事件循环自然结束
  const shutdown = (signal: NodeJS.Signals) => {
    logger.info(`[cluster] ${signal} received, shutting down…`);
    isShuttingDown = true;
    Object.values(cluster.workers!).forEach(w => w?.kill("SIGTERM"));
    process.exitCode = 0;
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  logger.info(`[cluster] workers: ${config.workers} | http://localhost:${port} | http://localhost:${port}/openapi`);
} else {
  // worker 进程：加载应用入口
  await import("./index");
}