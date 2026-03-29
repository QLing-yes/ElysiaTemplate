import { Elysia } from "elysia";
import * as $c from "@/app/common";
import { logger } from "@/app/lib/logger";
import plug_macro from "./macro.plug";
import plug_schemas from "./schemas.plug";

/** 路由插件 */
export default new Elysia({ name: __filename })
  .use(plug_schemas)
  .use(plug_macro)
  .onBeforeHandle(({ request, body }) => {
    logger.info(`[请求] ${request.method} ${request.url}`, { body });
  })
  // .onAfterResponse(({ set, request, responseValue }) => {
  // 	logger.info(`[结束] ${request.method} ${request.url} ${set.status}`, {
  // 		responseValue,
  // 	});
  // })
  .onError(({ error: errObj, code, request, set }) => {
    const err = errObj as Error;
    logger.error(`[错误] ${request.method} ${new URL(request.url).pathname}`, {
      code,
      msg: err.message,
      stack: err.stack,
    });
    set.status = 500;
    set.headers["content-type"] = "application/json";
    return $c.error(err.message, 500);
  });
