import { t } from "elysia";
import {
  UserPlain,
  UserPlainInputCreate,
} from "@/support/generated/prismabox/User";

export default (app: RouterType) =>
  app
    .post("test", () => $g.success("test"), { standard: t.String() })
    .get("/redis", async () => {
      await $g.redis.set("test", "hello world");
      const result = await $g.redis.get("test");
      return $g.success(result);
    })
    .put(
      "/create",
      async ({ body }) => {
        const res = await $g.prisma.user.create({
          data: body,
        });
        // return res;
        return $g.success(res);
      },
      {
        body: UserPlainInputCreate,
        response: $g.ResSchemaFun(UserPlain),
      },
    )
    .get(
      "/id/:id",
      async ({ params: { id }, status }) => {
        const user = await $g.prisma.user.findUnique({
          where: { id: Number(id) },
        });

        if (!user) return status(404, "User not found");

        return user;
      },
      {
        response: {
          200: UserPlain,
          404: t.String(),
        },
      },
    );
