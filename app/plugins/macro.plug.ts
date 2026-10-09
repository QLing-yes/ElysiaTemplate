import { Elysia } from "elysia";
import type { TSchema } from "elysia/type";
import * as Schema from "@/app/common/schemaDerive";

/** 标准响应宏插件 - 统一返回格式与校验 */
export default new Elysia({ name: __filename }).macro({
  /** 标准响应验证 */
  res<T extends TSchema>(payload?: T) {
    return {
      response: Schema.ResSchemaFun(payload),
    };
  },
});
