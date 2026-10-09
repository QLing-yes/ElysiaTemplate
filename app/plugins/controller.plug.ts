import { Elysia, ElysiaError, ValidationError } from "elysia";
import * as $c from "@/app/common";
import { logger } from "@/app/lib/logger";
import plug_macro from "./macro.plug";
import plug_schemas from "./schemas.plug";

/** 控制器插件 */
export default new Elysia({ name: __filename })
  .use(plug_schemas)
  .use(plug_macro)
  .beforeHandle(({ request, body }) => {
    logger.info(
      `[request] ${request.method} ${request.url}`,
      body !== undefined ? { body } : body,
    );
  })
  // .afterResponse(({ set, request }) => {
  // 	logger.info(`[response] ${request.method} ${request.url} ${set.status}`);
  // })
  // global 作用域：连未匹配路由的 NotFound 也统一走本处理器（v2 默认 plugin 作用域不含 404）
  .error("global", ({ error: errObj, request, set }) => {
    const err = errObj instanceof Error ? errObj : new Error(String(errObj));
    /** v2 稳定错误标识，替代 1.x 上下文中被移除的 code 字段 */
    const errCode = errObj instanceof ElysiaError ? errObj.code : err.name;

    // 校验错误：v2 默认 422，保留项目原有 400 约定；message 已是纯文本摘要
    if (errObj instanceof ValidationError) {
      logger.info("[validation] validation failed", {
        path: new URL(request.url).pathname,
      });
      set.status = 400;
    }

    logger.error(`${request.method} ${new URL(request.url).pathname}`, {
      code: errCode,
      msg: err.message,
      stack: err.stack,
    });

    if (typeof set.status !== "number") set.status = 500;

    set.headers["content-type"] = "application/json";
    return $c.error(err.message, set.status);
  });
