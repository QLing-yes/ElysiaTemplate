import { Elysia, ElysiaError, ValidationError } from "elysia";
import * as $c from "@/app/common";
import { logger } from "@/app/lib/logger";
import plug_macro from "./macro.plug";
import plug_schemas from "./schemas.plug";

/** 控制器插件 */
export default new Elysia({ name: String($g.counter.n) })
  .use(plug_schemas)
  .use(plug_macro)
  .beforeHandle(({ request, body }) => {
    logger.info(
      `[request] ${request.method} ${new URL(request.url).pathname}`,
      body !== undefined ? { body } : body,
    );
  })
  // .afterResponse(({ set, request }) => {
  // 	logger.info(`[response] ${request.method} ${new URL(request.url).pathname} ${set.status}`);
  // })
  .error("global", ({ error, request, set }) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const errCode = error instanceof ElysiaError ? error.code : err.name;

    if (error instanceof ValidationError) {
      const property = error.all[0].path.replace(/^\//, "");
      err.message = `[${error.type}] ${property} : ${err.message}`;
    }

    logger.error(`${request.method} ${new URL(request.url).pathname}`, {
      code: errCode,
      msg: err.message,
      stack: err.stack,
    });

    set.headers["content-type"] = "application/json";
    return $c.error(err.message);
  });
