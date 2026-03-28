import { Elysia } from "elysia";
import plugins from "@/app/plugins/index.plug";

const app = new Elysia().use(plugins).listen(process.env.PORT!);

export type APP = typeof app;
