import Elysia from "elysia";

const logger = new Elysia({ name: "logger" })
	.onRequest(({ request }) => {
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
	.onAfterResponse({ as: "scoped" }, ({ responseValue, set }) => {
		console.log(`[响应]`, {
			status: set.status,
			headers: set.headers,
			body: responseValue,
		});
	})
	.onError({ as: "scoped" }, ({ error, code, request, set }) => {
		const err = error as Error;
		console.error(`[错误] ${request.method} ${new URL(request.url).pathname}`, {
			code,
			message: err.message,
			stack: err.stack,
		});
		set.status = 500;
		return "Internal Server Error";
	});

export default logger;
