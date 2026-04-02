// 这里导出的模型都将使用 elysia.model() 注册，也只能导出 具名 TypeBox 类型
import { t } from "elysia";

export * from "@/support/generated/prismabox/Post";
export * from "@/support/generated/prismabox/User";

/** 响应模型 */
export const ResSchema = t.Object({
  /** 响应信息 */
  msg: t.String(),
  /** 状态码 */
  code: t.Number(),
  /** 响应数据 */
  data: t.Unknown(),
});
