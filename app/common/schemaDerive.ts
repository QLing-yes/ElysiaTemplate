import { type TSchema, t } from "elysia";
import * as m from "./schemas";

/** 响应模型(类型) */
export type ResType<T> = (typeof m.ResSchema)["static"] & {
  data: T;
};

/** 响应模型(函数) */
export function ResSchemaFun<T extends TSchema>(payload?: T) {
  return t.Intersect([
    t.Omit(m.ResSchema, ["data"]),
    // t.Object({ data:  payload }),
    // t.Object({ data:  payload || t.Null() }),
    // t.Object({ data:  t.Union([payload || t.Null(), t.Null()]) as unknown as T }),
    // 响应数据可以为 null，比如 $g.error()
    t.Object({
      data: (payload ? t.Union([payload, t.Null()]) : t.Null()) as unknown as T,
    }),
  ]);
}
