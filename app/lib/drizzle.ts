import { drizzle as orm } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { logger } from "@/app/lib/logger";
import { relations } from "@/app/model/relations";
import { Manifest } from "elysia";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  waitForConnections: true,
  connectionLimit: 10,
});
registerEvent();
export const drizzle = orm({ client: pool, relations });
export default drizzle;

function registerEvent() {
  pool.pool.on("error", (err: Error) => {
    logger.error("[drizzle] error", err);
  });
  pool.on("enqueue", () => {
    logger.warn("[drizzle] connection pool is full");
  });
  // AOT 构建期 dry-run 不建立真实连接，仅运行时校验连接
  if (!Manifest.isCapturing()) {
    // 启动时验证连接是否正常
    pool
      .getConnection()
      .then((conn) => {
        logger.info("[drizzle] connected successfully");
        conn.release();
      })
      .catch((err) => {
        logger.error(`[drizzle] ${err}`);
      });
  }
}
