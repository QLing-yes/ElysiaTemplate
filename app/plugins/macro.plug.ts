import { Elysia, type TSchema } from "elysia";
import * as Schema from "@/app/common/schemas";

/** 标准响应宏插件 - 统一返回格式与校验 */
export default new Elysia({ name: __filename }).macro({
  standard<T extends TSchema>(payload?: T) {
    return {
      response: Schema.ResSchemaFun(payload),
    };
  },
});
