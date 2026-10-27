import { t } from "elysia";
import type { Static, TNull, TSchema } from "elysia/type";
import * as m from "@/app/common/schemas";

/** 响应模型(类型) */
export type ResType<T> = Static<typeof m.ResSchema> & {
  data: T;
};

/** 响应模型(函数)
 * @template T payload 的 TypeBox 模型，缺省为 TNull
 * @param payload 业务数据模型(TSchema)，缺省时 data 为 null
 * @returns 标准响应模型: { msg, code, data }，data 类型由 payload 推导为 payload|null
 */
export function ResSchemaFun<T extends TSchema = TNull>(payload?: T) {
  return t.Intersect([
    t.Omit(m.ResSchema, ["data"]),
    t.Object({
      data: t.Union([payload ?? t.Null(), t.Null()]),
    }),
  ]);
}
