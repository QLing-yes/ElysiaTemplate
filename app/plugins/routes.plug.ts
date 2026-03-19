import { Elysia } from "elysia";
import * as $ from "@/app/common";

export default new Elysia({ name: __filename })
	.decorate("$", $)
	.onBeforeHandle(({ request }) => {
		const { method, url, headers } = request;
		request
			.clone()
			.text()
			.then((body) => {
				console.log(`[请求] ${method} ${url}`, {
					headers: Object.fromEntries(headers.entries()),
					body: body || undefined,
				});
			});
	})
	.onAfterResponse(({ set }) => {
		console.log(`[响应结束] ${set.status}`);
	})
	.onError(({ error: errObj, code, request, set, $ }) => {
		const err = errObj as Error;
		console.error(`[错误] ${request.method} ${new URL(request.url).pathname}`, {
			code,
			message: err.message,
			stack: err.stack,
		});
		set.status = 500;
		set.headers["content-type"] = "application/json";
		return $.res.error(err.message, 500);
	})
