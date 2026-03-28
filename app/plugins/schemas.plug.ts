import { Elysia, t } from "elysia";
import * as PostModel from "@/support/generated/prismabox/Post";
import * as UserModel from "@/support/generated/prismabox/User";

/* 统一的基础响应模型 */
const resp = t.Object({
  msg: t.String(),
  code: t.Number(),
  // data 先写成 unknown，后面路由会把具体模型 “继承” 进来
  data: t.Unknown(),
});

export default new Elysia({ name: __filename })
  .model({ resp })
  .model(UserModel)
  .model(PostModel);
