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
    const errCode = errObj instanceof ElysiaError ? errObj.code : err.name;

    if (errObj instanceof ValidationError) {
      const on = errObj.type ?? "unknown";
      const path = "property" in errObj.payload ? errObj.payload.property : "root";
      /** 将 JSON Pointer 转为点路径：/data/a/b -> data.a.b */
      const property = path.replace(/^\//, "").replace(/\//g, ".");
      err.message = `[${on}] ${property} : ${err.message}`;
    }

    logger.error(`${request.method} ${new URL(request.url).pathname}`, {
      code: errCode,
      msg: err.message,
      stack: err.stack,
    });

    set.headers["content-type"] = "application/json";
    return $c.error(err.message);
  });
