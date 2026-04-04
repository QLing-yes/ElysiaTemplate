import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { logger } from "@/app/lib/logger";
import { PrismaClient } from "@/support/generated/prisma";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});
/** prisma客户端 */
const prisma = new PrismaClient({ adapter });

async function isAlive() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("[prisma] connected successfully");
  } catch (err) {
    logger.error(`[prisma] connection failed:${err}`);
  }
}
isAlive()

export default prisma;
