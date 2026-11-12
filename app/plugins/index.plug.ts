import { cors } from "@elysia/cors";
import { openapi } from "@elysia/openapi";
import { staticPlugin } from "@elysia/static";
import { Elysia } from "elysia";
import routes from "@/system/generated/routes";
import plug_controller from "@/app/plugins/controller.plug";
import { logger } from "@/app/common";
import { collectPermRoutes, PERM_CODE_KEY } from "@/app/common/no_global";
import { createDir } from "@/app/utils/file";
// import { inAotBuild } from "elysia";

const env = process.env;

export const routes_ctrl = plug_controller.use(routes);

/** 检查权限编号是否唯一，不阻塞模块加载 */
collectPermRoutes().then(({ permRepeat }) => {
  if (Object.keys(permRepeat).length > 0) logger.error("[权限编号重复]", permRepeat);
})

const app = new Elysia({ name: String($g.counter.n) })
  .derive(() => {
    return {
      /** 路由每次请求的唯一标识 */
      rid: crypto.randomUUID()
    };
  });

// if (!inAotBuild()) {
// 按 .env 开关注册可选插件，默认开启
if (env.CORS_ENABLED === "true") {
  app.use(cors());
}
if (env.OPENAPI_ENABLED === "true") {
  app.use(openapi({ scalar: { showExtensions: [PERM_CODE_KEY] } }));
}
if (env.STATIC_ENABLED === "true") {
  const op = {
    assets: "public",
    alwaysStatic: false
  };
  createDir(op.assets);
  app.use(staticPlugin(op));
}
// }

// 这里必须app.use(controller) 否着类型类型推断链路就断了。可以断开的类型链路只能是对controller无影响的。
export default app.use(routes_ctrl);
