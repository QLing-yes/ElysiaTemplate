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

/** 成功响应 */
function success<T>(data: T, msg = ""): ResponseData<T> {
    return { msg, code: 1, data };
}

/** 错误响应 */
function error(msg: string, code = 0): ResponseData {
    return { msg, code, data: null };
}

export default new Elysia({ name: __filename })
    .decorate("res", { success, error })
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
    // .as("scoped");
