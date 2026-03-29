import { type TSchema, t } from "elysia";

/** 响应模型 */
export const ResSchema = t.Object({
  /** 响应信息 */
  msg: t.String(),
  /** 状态码 */
  code: t.Number(),
  /** 响应数据 */
  data: t.Unknown(),
})

/** 响应模型(类型) */
export type ResType<T = unknown> = (typeof ResSchema)["static"] & {
  data: T;
};

/** 响应模型(函数) */
export function ResSchemaFun<T extends TSchema>(payload?: T) {
  return t.Intersect([
    t.Omit(ResSchema, ["data"]),
    t.Object({ data: payload || t.Unknown() }),
  ]);
}
