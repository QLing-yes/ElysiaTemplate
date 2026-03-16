import { Elysia } from "elysia";

/** 响应统一格式 */
interface ResponseData<T = unknown> {
	/** 响应信息 */
	msg: string;
	/** 状态码 */
	code: number;
	/** 响应数据 */
	data: T;
}

/** 成功响应 1=成功 */
function success<T>(data: T, msg = "success"): ResponseData<T> {
	return { msg, code: 1, data };
}

/** 错误响应 其他=失败 */
function error(msg: string, code = 500): ResponseData {
	return { msg, code, data: null };
}

/** 格式化响应 */
function formatResponse(response: unknown, status: number): ResponseData {
	const isSuccess = status >= 200 && status < 400;
	return isSuccess ? success(response) : error(String(response), status);
}

/** 是否为文件类型 */
function isFileResponse(contentType: string): boolean {
	return /^(image|audio|video|application\/(?!json)).*$/i.test(contentType);
}

const logger = new Elysia({ name: "logger" })
	.decorate("res", { success, error, formatResponse, isFileResponse })
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
	.mapResponse(({ set, res: { isFileResponse, formatResponse }, responseValue }) => {
		const contentType = set.headers["content-type"] ?? "";
		if (isFileResponse(contentType)) return;

		const status = typeof set.status === "number" ? set.status : 200;
		const formatted = formatResponse(responseValue, status);
		console.log(`[响应] ${status}`, formatted);
		set.headers["content-type"] = "application/json";
		const headers: Record<string, string> = {};
		for (const [key, value] of Object.entries(set.headers)) {
			if (typeof value === "string") headers[key] = value;
			else if (typeof value === "number") headers[key] = value.toString();
		}
		return new Response(JSON.stringify(formatted), {
			status,
			headers,
		});
	})
	.onAfterResponse(({ set }) => {
		console.log(`[响应结束] ${set.status}`);
	})
	.onError(({ error: errObj, code, request, set, res: { error } }) => {
		const err = errObj as Error;
		console.error(`[错误] ${request.method} ${new URL(request.url).pathname}`, {
			code,
			message: err.message,
			stack: err.stack,
		});
		set.status = 500;
		set.headers["content-type"] = "application/json";
		return error(err.message, 500);
	})
	.as("scoped");

export default logger;
export type { ResponseData };
