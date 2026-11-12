import { Elysia } from "elysia";
import type { TSchema } from "elysia/type";
import * as Schema from "@/app/common/schemaDerive";
import { PERM_CODE_KEY } from "@/app/common/no_global";

export default new Elysia({ name: String($g.counter.n) }).macro({
  /** 标准响应宏插件 - 统一返回格式与校验 */
  res<T extends TSchema>(payload?: T) {
    return {
      response: Schema.ResSchemaFun(payload),
    };
  },
  /**
   * 接口权限编号：写入路由元数据与 OpenAPI 文档
   * @param code 全局唯一的权限编号
   */
  perm(code: number) {
    return {
      detail: {
        [PERM_CODE_KEY]: code,
      },
    };
  },
  /**
   * 接口标题：写入路由元数据与 OpenAPI 文档
   * @param summary 接口标题
   */
  title(summary: string) {
    return {
      detail: {
        summary
      },
    };
  },
  /**
   * 接口描述：写入路由元数据与 OpenAPI 文档
   * @param description 接口描述
   */
  desc(description: string) {
    return {
      detail: {
        description
      },
    };
  },
});
