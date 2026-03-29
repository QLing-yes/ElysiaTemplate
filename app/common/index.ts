import { logger } from "@/app/lib/logger";
import { prisma } from "@/app/lib/prisma";
import redis from "@/app/lib/redis";
import { ResSchemaFun, type ResType } from "./schemas";

export { logger, prisma, redis, ResSchemaFun };

/** 成功响应 */
export function success<T>(data: T, msg = ""): ResType<T> {
  return { msg, code: 1, data };
}

/** 错误响应 */
export function error(msg: string, code = 0): ResType {
  return { msg, code, data: null };
}
