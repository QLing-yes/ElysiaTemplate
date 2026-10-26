import { Elysia, ElysiaError, ValidationError } from "elysia";
import * as $c from "@/app/common";
import { logger } from "@/app/lib/logger";
import plug_macro from "./macro.plug";
import plug_schemas from "./schemas.plug";

/** 控制器插件 */
export default new Elysia({ name: String($g.counter.n) })
  .use(plug_schemas)
  .use(plug_macro)
  .beforeHandle((p) => {
    const mate = Object.fromEntries(
      Object.entries({
        rid: p.rid,
        params: p.params,
        query: p.query,
        body: p.body,
        cookie: p.cookie,
      })
        /** 剔除空属性，避免日志出现无意义的空对象 */
        .filter(
          ([, v]) => !v || typeof v !== "object" || Object.keys(v).length > 0,
        ),
    );
    logger.info(`[request] ${p.request.method} ${p.route || p.path}`, mate);
  })
  // .afterResponse(({ set, request, ...p }) => {
  // 	logger.info(`[response] ${request.method} ${p.route || p.path} ${set.status}`);
  // })
  .error("global", ({ error, request, set, ...p }) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const errCode = error instanceof ElysiaError ? error.code : err.name;
    // 人性化验证器错误信息
    if (error instanceof ValidationError) {
      const property = error.all[0].path.replace(/^\//, "");
      err.message = `[${error.type}] ${property} : ${err.message}`;
    }
    // 记录错误日志
    logger.error(`${request.method} ${p.route || p.path}`, {
      rid: p.rid,
      code: errCode,
      msg: err.message,
      stack: err.stack,
    });
    // 统一错误响应
    set.headers["content-type"] = "application/json";
    return $c.error(err.message);
  });
