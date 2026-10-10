import { cors } from "@elysia/cors";
import { openapi } from "@elysia/openapi";
import { staticPlugin } from "@elysia/static";
import { Elysia } from "elysia";
import routes from "@/support/generated/routes";
import plug_controller from "./controller.plug";

export const controller = plug_controller.use(routes);

/** 插件入口 */
export default new Elysia({ name: __filename })
  .use(cors())
  .use(openapi())
  .use(staticPlugin())
  .use(controller);
