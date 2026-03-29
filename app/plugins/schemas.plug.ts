import { Elysia } from "elysia";
import * as Schema from "@/app/common/schemas";
import * as PostModel from "@/support/generated/prismabox/Post";
import * as UserModel from "@/support/generated/prismabox/User";

export default new Elysia({ name: __filename })
  .model({
    ResSchema: Schema.ResSchema,
  })
  .model(UserModel)
  .model(PostModel);
