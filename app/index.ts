import { Elysia } from "elysia";
import plugins from "@/app/plugins/index.plug";

const app = new Elysia({
    serve: {
        // 跨进程端口复用(仅 Linux 生效)，允许多个进程监听同一端口实现负载均衡
        reusePort: true
    }
}).use(plugins).listen(process.env.PORT!);

export type APP = typeof app;
