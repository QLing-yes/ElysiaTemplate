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
    logger.info(`[request] ${request.method} ${request.url}`, body !== undefined ? { body } : body);
  })
  // .onAfterResponse(({ set, request, responseValue }) => {
  // 	logger.info(`[response] ${request.method} ${request.url} ${set.status}`, {
  // 		responseValue,
  // 	});
  // })
  .onError(({ error: errObj, code, request, set }) => {
    const err = errObj instanceof Error ? errObj : new Error(String(errObj));

    try {
      if (code === "VALIDATION") {
        set.status = 400;
        const parsed = JSON.parse(err.message);
        err.message = parsed.summary;
      }
    } catch (error) {
      logger.error((error as Error).message, (error as Error));
    }

    logger.error(`${request.method} ${new URL(request.url).pathname}`, { code, msg: err.message, stack: err.stack });

    if (typeof set.status !== "number") set.status = 500;

    set.headers["content-type"] = "application/json";
    return $c.error(err.message, set.status);
  });
