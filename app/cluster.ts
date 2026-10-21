import { spawn } from "bun";
import os from "node:os";

const port = process.env.PORT;

if (!port) {
  console.error("[cluster] Missing environment variable PORT, shutting down...");
  process.exit(1);
}

(async () => {
  // 集群模式未启用，直接加载应用入口（单进程）
  if (process.env.CLUSTER_ENABLED !== "true") {
    console.info(
      `server ${process.pid} http://localhost:${port}/openapi`,
    );
    await import("./index");
    return;
  }

  // 单机多进程集群模式 (Linux 下利用 SO_REUSEPORT)
  // https://elysiajs.com/patterns/deploy.html#cluster-mode
  // https://bun.sh/guides/http/cluster

  const workersCount = Math.max(
    1,
    Math.min(
      Number(process.env.CLUSTER_WORKERS) || os.availableParallelism(),
      os.availableParallelism(),
    ),
  );

  console.info(`[cluster] Starting ${workersCount} workers on port reuse mode...`);

  const workers = new Array(workersCount);
  let isShuttingDown = false;

  const startWorker = (index: number) => {
    const worker = spawn({
      cmd: ["bun", `${import.meta.dir}/index.ts`],
      stdout: "inherit",
      stderr: "inherit",
      stdin: "ignore"
    });

    workers[index] = worker;

    worker.exited.then((code: number) => {
      // 避免在主进程正在退出，或者子进程正常退出时触发重启
      if (!isShuttingDown && code !== 0) {
        console.error(`[cluster] worker ${index} exited with code ${code}, restarting...`);
        // 延迟一秒重启，防止崩溃死循环
        setTimeout(() => {
          startWorker(index);
        }, 1000);
      }
    });
  };

  for (let i = 0; i < workersCount; i++) {
    startWorker(i);
  }

  const shutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.info(`[cluster] ${signal} received, shutting down…`);
    for (const worker of workers) {
      if (worker) worker.kill();
    }
    process.exitCode = 0;
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("exit", () => shutdown("exit"));
})();
