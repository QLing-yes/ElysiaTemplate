import { t } from "elysia";
import { UserPlain } from "@/support/generated/prismabox/User";

export default (app: RouterType) =>
  app
    .post(
      "test",
      ({ body }) => {
        if (body.a > 2) {
          return $g.error("no > 2");
        }
        return $g.success(body.a + 1);
      },
      {
        body: t.Object({ a: t.Number() }),
        // res: t.Union([t.Number(), t.Null()]),
        res: t.Number(),
      },
    )
    .post("success", () => $g.success("succData"), { res: t.String() })
    .post("err", () => $g.error("errData", 0), { res: t.String() })
    .post("err2", () => $g.success({ a: { b: 1 } }), {
      res: t.Object({ a: t.Object({ b: t.String() }) }),
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
      { res: t.String() },
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
        body: "UserPlainInputCreate",
        res: UserPlain,
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
