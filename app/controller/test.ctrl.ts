import { eq } from "drizzle-orm";
import { t } from "elysia";
import { post, user } from "@/app/model";
import { controller } from "@/app/plugins/index.plug";

export default $g.ctrl((app) =>
  app
    .post("/", () => "ok")
    // 全部路由
    .post(
      "routers",
      {
        response: $g.res(t.Array(t.String())),
      },
      () => {
        const list: string[] = controller.routes.map(
          (item) => `[${item.method}]${item.path}`,
        );
        return $g.success(list);
      },
    )
    // 测试动态响应类型
    .post(
      "test",
      {
        body: t.Object({ a: t.Number() }),

        // res: t.Number(),// Type validation has no effect, run-time normal validation
        // Equality ↑↓
        // response: $g.res(t.Number()),
      },
      ({ body }) => {
        if (body.a > 2) {
          return $g.error("no > 2");
        }
        return $g.success("1"); // Test type error
      },
    )
    // 测试成功响应
    .post("success", { response: $g.res(t.String()) }, () => {
      return $g.success("succData");
    })
    // 测试错误响应
    .post("err", { response: $g.res(t.String()) }, () => {
      return $g.error("errData", 0);
    })
    // 测试响应类型错误
    .post(
      "err2",
      {
        response: $g.res(t.Object({ a: t.Object({ b: t.String() }) })),
      },
      () => {
        return $g.success({ a: { b: 1 } });
      },
    )
    // 抛出错误
    .post("throwErr", () => {
      throw new Error("throwErr");
    })
    // 直接抛出数据
    .post("throwData", () => {
      throw "throwData";
    })

    // ===== 测试 Redis =====

    .get("/redis", { response: $g.res(t.String()) }, async () => {
      await $g.redis.set("test", "hello world");
      const result = await $g.redis.get("test");
      return $g.success(result);
    })

    // ===== 增删改查 测试 =====

    /** 新增用户 */
    .post(
      "user/create",
      {
        body: t.Object({
          email: t.String({ format: "email" }),
          name: t.Optional(t.String()),
        }),
        response: $g.res(t.Any()),
      },
      async ({ body }) => {
        const row = await $g.db.insert(user).values(body).$returningId();
        return $g.success(row);
      },
    )

    /** 查询所有用户 */
    .get("user/list", { response: $g.res(t.Any()) }, async () => {
      const rows = await $g.db.query.user.findMany();
      return $g.success(rows);
    })

    /** 按ID查询用户 */
    .get(
      "user/detail/:id",
      { response: $g.res(t.Any()) },
      async ({ params }) => {
        const row = await $g.db.query.user.findFirst({
          where: { id: +params.id },
        });
        if (!row) {
          return $g.error("用户不存在", 404);
        }
        return $g.success(row);
      },
    )

    /** 更新用户 */
    .put(
      "user/update/:id",
      {
        body: t.Object({
          email: t.Optional(t.String({ format: "email" })),
          name: t.Optional(t.String()),
        }),
        response: $g.res(t.Any()),
      },
      async ({ params, body }) => {
        const [{ affectedRows }] = await $g.db
          .update(user)
          .set(body)
          .where(eq(user.id, +params.id));
        if (affectedRows === 0) {
          return $g.error("用户不存在", 404);
        }
        return $g.success(null, "更新成功");
      },
    )

    /** 删除用户 */
    .delete(
      "user/delete/:id",
      { response: $g.res(t.Any()) },
      async ({ params }) => {
        const [{ affectedRows }] = await $g.db
          .delete(user)
          .where(eq(user.id, +params.id));
        if (affectedRows === 0) {
          return $g.error("用户不存在", 404);
        }
        return $g.success(null, "删除成功");
      },
    )

    /** 新增文章 */
    .post(
      "post/create",
      {
        body: t.Object({
          title: t.String(),
          content: t.Optional(t.String()),
          published: t.Optional(t.Boolean()),
          authorId: t.Number(),
        }),
        response: $g.res(t.Any()),
      },
      async ({ body }) => {
        const row = await $g.db.insert(post).values(body).$returningId();
        return $g.success(row);
      },
    )

    /** 查询所有文章（含作者信息） */
    .get("post/list", { response: $g.res(t.Any()) }, async () => {
      const rows = await $g.db.query.post.findMany({
        with: { author: true },
      });
      return $g.success(rows);
    }),
);
