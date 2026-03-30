import { type TSchema, t } from "elysia";

/** 响应模型 */
export const ResSchema = t.Object({
  /** 响应信息 */
  msg: t.String(),
  /** 状态码 */
  code: t.Number(),
  /** 响应数据 */
  data: t.Unknown(),
});

/** 响应模型(类型) */
export type ResType<T> = (typeof ResSchema)["static"] & {
  data: T;
};

/** 响应模型(函数) */
export function ResSchemaFun<T extends TSchema>(payload?: T) {
  return t.Intersect([
    t.Omit(ResSchema, ["data"]),
    // t.Object({ data:  payload }),
    // t.Object({ data:  payload || t.Null() }),
    // t.Object({ data:  t.Union([payload || t.Null(), t.Null()]) as unknown as T }),
    // 响应数据可以为 null，比如 $g.error()
    t.Object({
      data: (payload ? t.Union([payload, t.Null()]) : t.Null()) as unknown as T,
    }),
  ]);
}
