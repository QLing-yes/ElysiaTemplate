export { drizzle as db } from "@/app/lib/drizzle";
export { logger } from "@/app/lib/logger";
export { redis } from "@/app/lib/redis";
export { ResSchemaFun } from "./schemaDerive";

import type controller from "@/app/plugins/controller.plug";
import type { ResType } from "./schemaDerive";

/** 控制器工厂 */
export const ctrl = <T>(fun: (app: typeof controller) => T) => fun;

/** 成功响应 */
export function success<T>(data: T, msg = ""): ResType<T> {
  return { msg, code: 1, data };
}

/** 错误响应 */
export function error<T = null>(
  msg = "",
  code = 0,
  data: T = null as T,
): ResType<T> {
  return { msg, code, data };
}
