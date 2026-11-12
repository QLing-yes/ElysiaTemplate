# 项目
请参考package.json确定技术栈。
统一使用bun作为包管理器。
node_modules 目录下的内容不能修改。

# 规则
代码准则: 极致性能、高复用性、高可读性、易维护，逻辑嵌套≤3层，分区分块编写;
语法规范: 禁用存在变量提升的语法声明属性; 不可变对象用常量;
规范: 所有入参、返回值、字段、函数，必须写简单明了的注释，注释不能越界描述;
格式: 合理换行，代码精简无冗余，尽量减少代码量达到同样效果（不能使用压缩代码的方式）;
边界职责: 注意模块之间边界职责清晰不要有任何牵扯（包括注释描述），每个模块只能负责自己的功能。

# elysiajs 规则

## 特别注意AOT模式下的问题：
参考: https://next.elysiajs.com/patterns/aot/

### 一句话总结
默认是 JIT(首次请求到来时才编译该路由), AOT 把每条路由 handler/schema 的编译搬到"构建期": 构建脚本会 dry-run 执行入口, 捕获路由注册并生成 manifest, 产物落在 dist/, 运行期直接命中已编译程序。
- 收益: 启动与首请求更快; 峰值内存更低(免去运行期编译的临时分配); 可裁剪未使用的 Elysia 模块(所有 schema 都可编译时可完全移除 TypeBox); 默认值合并预计算。
- 代价: 生成的代码会增大 bundle 体积与启动驻留内存。
- 构建脚本(Bun): `Bun.build({ entrypoints, outdir: 'dist', target: 'bun', plugins: [aot(entry, { target: 'bun' })] })`, 末尾必须 `process.exit(0)`(dry-run 已启动过服务); 运行 `bun dist/index.js`。`target` 必须与真实运行时一致(bun / node / workerd)。

### 本项目注意事项
1. 入口约定: AOT 编译"主 app"优先取 `app` 导出, 其次 `default` 导出, 再次入口唯一实例。本项目 `app/index.ts` 已 `export const app`; `app/cluster.ts` 只做进程管理(spawn `app/index.ts`), 不导出实例, 因此不能作为 AOT 构建入口, 构建统一以 `app/index.ts` 为 entry。
2. 构建期会真实执行入口(dry-run): 数据库/Redis 连接、定时器、顶层 await、日志初始化都会在构建机跑一遍。外部服务初始化必须包在 `if (!inAotBuild()) { ... }`(`import { inAotBuild } from "elysia"`)。本项目 `app/common/init-global.ts` 经 `app/common/index.ts` 静态引入 drizzle/redis, 必须确认构建期不建连(惰性连接)。
3. 实例 name 必须静态、唯一, 且构建期与运行期取值完全一致: 禁止由环境变量或运行时计算派生。本项目插件/generated 路由用 `String($g.counter.n)`(全局自增计数器), 依赖模块加载顺序, 顺序一旦变化 manifest 键就对不上, 运行期报 `has no AOT manifest` 或 `Mismatch fingerprint`。应改为显式常量名(如 `"controller"`、`"schemas"`、`"plugins"`、`"routes:test/testsub"`)。多 app 场景主 app 也必须命名, 且所有 name 互不重复。
4. 只有自己起服务的实例才需要从入口命名导出: 凡是调用 `.listen()`/`.handle()`/`.compile()`、读 `.fetch`、或 `.mount(x.fetch)`/`.mount(x.handle)` 的实例, 否则构建成功但运行期抛 `[elysia-aot] App "<name>" has no AOT manifest. Name and export it, .mount() ones too`。仅 `.use()` 组合的插件、以及 `.mount(普通函数)`(如 `auth.handler`)不需要导出。
5. cluster 与产物路径: `app/cluster.ts` 中 `spawn(["bun", `${import.meta.dir}/index.ts`])` 指向源码, AOT 后必须改指向 dist 产物(或把 cluster 一并打包), 否则 worker 跑的是未编译源码, AOT 完全失效。
6. 环境变量: `ELYSIA_AOT_BUILD` 由构建插件设置, 运行环境残留会抛 `Elysia AOT capture module is not activated.`, 部署前清理。
7. manifest 带 ABI 指纹: elysia 版本变更后必须重新构建, 不可复用旧 dist(否则 `Mismatch fingerprint`)。
8. `precompile: true` 是运行期选项: AOT 下命中 manifest 时复用已编译程序, 保留不冲突; 其实际收益需以启动/首请求实测为准。
9. 改动后必验清单: 构建产物能 `bun dist/index.js` 启动; `/openapi`、动态参数路由、校验错误响应正常; `CLUSTER_ENABLED=true` 多 worker 正常; 日志无 AOT 报错; 构建期无外部服务连接。
