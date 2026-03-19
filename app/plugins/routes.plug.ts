import { Elysia } from "elysia";

const getTime = () => new Date().toLocaleString("zh-CN", { hour12: false });
/** 路由插件 */
export default new Elysia({ name: __filename })
	.onBeforeHandle(({ request, body }) => {
		console.log(`[${getTime()}] [请求] ${request.method} ${request.url}`, { body });
	})
	.onAfterResponse(({ set }) => {
		console.log(`[${getTime()}] [结束] ${set.status}`);
	})
	.onError(({ error: errObj, code, request, set }) => {
		const err = errObj as Error;
		console.error(`[${getTime()}] [错误] ${request.method} ${new URL(request.url).pathname}`, {
			code,
			message: err.message,
			stack: err.stack,
		});
		set.status = 500;
		set.headers["content-type"] = "application/json";
		return $.res.error(err.message, 500);
	});
