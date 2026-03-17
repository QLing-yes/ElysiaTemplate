import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";

export default new Elysia({ name: __filename })
	.use(openapi())
	.use(staticPlugin());
