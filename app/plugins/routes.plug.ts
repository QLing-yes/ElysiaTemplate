import { Elysia } from "elysia";
import { logger } from "@/app/lib/logger";

/** 路由插件 */
export default new Elysia({ name: __filename })
	.onBeforeHandle(({ request, body }) => {
		logger.info(`[请求] ${request.method} ${request.url}`, { body });
	})
	.onAfterResponse(({ set }) => {
		logger.info(`[结束] ${set.status}`);
	})
	.onError(({ error: errObj, code, request, set }) => {
		const err = errObj as Error;
		logger.error(`[错误] ${request.method} ${new URL(request.url).pathname}`, {
			code,
			message: err.message,
			stack: err.stack,
		});
		set.status = 500;
		set.headers["content-type"] = "application/json";
		return $.res.error(err.message, 500);
	});
