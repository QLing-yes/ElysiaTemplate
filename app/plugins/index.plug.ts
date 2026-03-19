import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import routes from "@/support/generated/routes";
import plug_routes from "./routes.plug";
/** 插件入口 */
export default new Elysia({ name: __filename })
	.use(openapi())
	.use(staticPlugin())
	.use(plug_routes.use(routes));
