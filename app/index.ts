
import { Elysia } from "elysia";
import plug_global from "@/app/plugins/global.plug";
import plug_routes from "@/app/plugins/routes.plug";
import routes from "@/support/generated/routes";

const app = new Elysia({ name: __filename })
	.use(plug_global)
	.use(routes)
	.listen(3000);

export type APP = typeof app;

const service = `${app.server?.hostname}:${app.server?.port}`;

console.log(`service http://${service}`);
console.log(`openapi http://${service}/openapi`);
