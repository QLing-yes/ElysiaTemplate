import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";

export default new Elysia({ name: __filename })
    .use(openapi())
    .use(staticPlugin())
    // .as("scoped");