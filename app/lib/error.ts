import { Logger } from "./logger";

const logger = new Logger({ sync: true, stdout: false });

/**
 * 捕获未捕获的同步错误
 * 当同步代码抛出异常且没有任何 try/catch 捕获时触发
 */
process.on("uncaughtException", (error) => {
  logger.error("uncaughtException", {
    message: error.message,
    stack: error.stack,
  });
  console.error(error);
});

/**
 * 捕获未处理的 Promise 拒绝
 * 当 Promise 被 reject 但没有任何 .catch() 或 await 捕获时触发
 */
process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { reason });
  console.error(reason);
});

/**
 * 捕获延迟处理的 Promise 拒绝
 * 当 Promise rejection 最终被 .catch() 捕获时触发（已在下一个 tick 之前处理）
 */
process.on("rejectionHandled", (promise) => {
  logger.warn("rejectionHandled", { promise: String(promise) });
  console.warn(promise);
});

/**
 * 进程退出前最后一个 tick
 * 此时事件循环已空，可执行异步清理操作
 * 注意：若在此回调中继续添加异步操作，进程不会等待
 */
process.on("beforeExit", (code) => {
  logger.warn("beforeExit", { code });
});

/**
 * 进程实际退出
 * 只能同步操作，异步操作不会被执行
 */
process.on("exit", (code) => {
  logger.error("exit", { code });
});

/**
 * SIGINT 信号处理 (Ctrl+C)
 * 优雅关闭信号，触发后进程会同时收到退事件
 */
process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
});

/**
 * SIGTERM 信号处理 (kill 命令默认发送)
 * 优雅关闭信号，容器/云平台重启时通常发送此信号
 */
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
});

/**
 * 通常由某些已废弃或有问题的 API 使用导致
 * 不影响进程运行，但建议关注并修复
 */
process.on("warning", (warning) => {
  logger.warn("process warning", {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  });
  console.warn(warning);
});
