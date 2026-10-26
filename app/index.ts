import "@/app/common/init-global";
import { Elysia } from "elysia";
import plugins from "@/app/plugins/index.plug";

export const app = new Elysia({
    // 在服务器启动前预编译所有路由，大幅降低首次请求的延迟
    precompile: true,
    // 使用 Bun 原生的静态响应优化，提高纯静态返回值的吞吐量
    nativeStaticResponse: true,
    // 强制严格匹配路径（禁用尾部斜杠容忍），减少路由匹配阶段的正则表达式计算开销
    strictPath: true,
    // 开启 Schema 严格规范化（精确映射机制），清理多余字段，保证数据结构干净
    normalize: true,
    // 允许生产环境暴露完整的验证错误详情（含失败字段路径），便于排查响应结构问题
    // allowUnsafeValidationDetails: true,
    serve: {
        // 跨进程端口复用(仅 Linux 生效)，允许多个进程监听同一端口实现负载均衡
        reusePort: true,
        // 降低空闲连接超时时间（默认30秒），防止无用连接长时间占用内存
        idleTimeout: 15,
    }
}).use(plugins).listen(process.env.PORT!);

export type APP = typeof app;
