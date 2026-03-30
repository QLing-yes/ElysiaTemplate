import { t } from "elysia";
import {
  UserPlain,
  UserPlainInputCreate,
} from "@/support/generated/prismabox/User";

export default (app: RouterType) =>
  app
    .get("test", () => $g.success("test"))
    .post("success", () => $g.success("succData"), { standard: t.String() })
    .post("err", () => $g.error("errData", 0), { standard: t.String() })
    .post("err2", () => $g.success({ a: { b: 1 } }), {
      standard: t.Object({ a: t.Object({ b: t.String() }) }),
    })
    .post("throwErr", () => {
      throw new Error("throwErr");
    })
    .post("throwData", () => {
      throw "throwData";
    })
    .get(
      "/redis",
      async () => {
        await $g.redis.set("test", "hello world");
        const result = await $g.redis.get("test");
        return $g.success(result);
      },
      { standard: t.Union([t.String(), t.Null()]) },
    )
    .put(
      "/create",
      async ({ body }) => {
        const res = await $g.prisma.user.create({
          data: body,
        });
        return $g.success(res);
      },
      {
        body: UserPlainInputCreate,
        standard: UserPlain,
      },
    )
    .get(
      "/id/:id",
      async ({ params: { id }, status }) => {
        const user = await $g.prisma.user.findUnique({
          where: { id: Number(id) },
        });
        if (!user) return status(404, "User not found");
        return $g.success(user);
      },
      {
        response: {
          200: $g.ResSchemaFun(UserPlain),
          404: t.String(),
        },
      },
    );
