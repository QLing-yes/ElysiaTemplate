import { cors } from "@elysia/cors";
import { openapi } from "@elysia/openapi";
import { staticPlugin } from "@elysia/static";
import { Elysia } from "elysia";
import routes from "@/system/generated/routes";
import plug_controller from "./controller.plug";

export const controller = plug_controller.use(routes);
const assets = await staticPlugin({ alwaysStatic: false });

export default new Elysia({ name: String($g.counter.n) })
  .derive(() => {
    return { rid: crypto.randomUUID() };
  })
  .use(cors())
  .use(openapi())
  .use(assets)
  .use(controller);
