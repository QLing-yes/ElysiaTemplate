import { prisma } from "@/app/lib/prisma";
import redis from "@/app/lib/redis";

export { prisma, redis };
export const res = { success, error };

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
