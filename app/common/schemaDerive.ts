import { t } from "elysia";
import type { Static, TSchema } from "elysia/type";
import * as m from "./schemas";

/** 响应模型(类型) */
export type ResType<T> = Static<typeof m.ResSchema> & {
  data: T;
};

/** 响应模型(函数)
 * @param payload 业务数据模型(TSchema)，缺省时 data 为 null
 * @returns 标准响应模型: { msg, code, data }，data 类型由 payload 推导
 */
export function ResSchemaFun<T extends TSchema>(payload?: T) {
  return t.Intersect([
    // 取 ResSchema{msg, code, data} 去掉 data 字段 -> { msg, code }
    t.Omit(m.ResSchema, ["data"]),
    // 新增 data 字段: 传入了 payload 则为 payload|null，否则为 null
    t.Object({
      data: (payload ? t.Union([payload, t.Null()]) : t.Null()) as unknown as T,
    }),
  ]);
}
