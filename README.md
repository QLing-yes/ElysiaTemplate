[English](./README-en.md) | [中文](./README.md)

## 项目暂停中

准备打造一个适合自己的AI工作台。
后续作为[aicode](https://github.com/QLing-yes/aicode) 底座。

## 预发布版本

- `1.0.0` 版本起即为正式版。
- `bun create app-elysia@latest` - 尝鲜体验

## 项目结构
- 全自动路由、日志系统、ORM、端到端类型安全，更多功能即将推出。

```
Project/
├── public/                   # 静态资源（自动路由）
├── app/
│   ├── common/
│   │   └── index.ts          # 全局模块 (注册到全局"$g", 仅`controller`中使用)
│   │   └── schemas.ts        # 数据模型 (自动使用elysia.model注册)
│   │   └── schemaDerive.ts   # 数据模型的派生类型和方法
│   ├── controller/           # 控制器层 (自动加载`ctrl.ts`结尾的文件,改变时自动更新路由)
│   ├── lib/
│   │   ├── error.ts          # 全局错误与进程事件捕获记录 (同步模式)
│   │   ├── logger.ts         # 日志库 (默认异步模式)
│   │   ├── drizzle.ts        # Drizzle 客户端
│   │   └── redis.ts          # Redis 客户端
│   ├── model/                # Drizzle 数据模型目录
│   ├── plugins/
│   │   ├── index.plug.ts     # 全局插件
│   │   └── macro.plug.ts     # 宏插件
│   │   └── controller.plug.ts # 控制器插件
│   │   └── schemas.plug.ts   # 数据模型注册插件
│   ├── utils/                # 工具函数
│   └── cluster.ts            # 单机多进程集群模式入口
│   └── index.ts              # 应用入口
├── logs/
├── test/                     # Eden 测试目录
├── support/                  # 辅助脚本目录（无需关心）
│   └── script/
│       ├── index.ts          # 生成脚本
│       ├── menu.ts           # 命令菜单
│       └── routes.ts         # 路由生成工具
|── .env                      # 配置文件
|── drizzle.config.ts         # drizzle 配置
...
```

## 使用 CLI 创建项目

```bash
bun create app-elysia@latest
```

- 当然，你也可以直接下载本仓库使用。

### 请按以下步骤配置 Drizzle

1. **检查数据库配置** — 确认 [.env](.env) 中的数据库连接信息是否正确
2. **确认数据模型** — 检查 [app/model](app/model) 中的模型定义是否符合需求
3. **同步到数据库** — 运行 `bun run generate_drigrate_migrate`

## 快速开始

```bash
bun i
bun run dev
```

## 命令

```bash
bun run menu    # 启动交互式菜单
bun run dev     # 启动开发服务器、自动生成路由
bun run start-hot # 以正式环境启动，支持热更新
bun run start-hot-bg # 以正式环境启动，支持热更新，关闭终端不终止进程
bun run fix     # 修复代码风格

bun run generate  # 运行全部`generate_`开头的命令
bun run generate_script  # 生成路由（一般不需要手动执行）

bun run drizzle_studio  # drizzle可视化
bun run generate_drigrate_migrate # 生成迁移并执行

```
- `bun run menu --list` 列出所有选项
- `bun run menu <父级> <子项> <...>` 支持按路径逐级定位执行

## 日志配置

- 默认：[应用使用`同步`模式记录](app/lib/error.ts)，[控制器使用`异步`记录的方式](app/plugins/controller.plug.ts)。

```typescript
import { Logger, logger } from "@/app/lib/logger";
//const logger = new Logger({ sync: false, level: "debug" });
logger.info("msg", { meta: "value" });
logger.error("msg", Object | Error);
```

[logger.ts](app/lib/logger.ts)

```typescript
/** 日志级别 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** 文件轮转粒度 */
export type RotateBy = "hour" | "day" | "month";

/** 日志元数据类型 */
export type Meta = Record<string, unknown> | Error | undefined | null;

/** Logger 构造选项 */
export interface LoggerOptions {
  /** 日志输出目录，默认 `logs` */
  dir?: string;
  /** 文件轮转粒度，默认 `day` */
  rotateBy?: RotateBy;
  /** 是否同时输出到 stdout，默认 `true` */
  stdout?: boolean;
  /** 最低记录级别，默认 `debug` */
  level?: LogLevel;
  /** 定时刷新间隔（ms），默认 `1000` */
  flushInterval?: number;
  /**
   * 内存缓冲高水位线（字节），达到后同步落盘，默认 `1MB`
   * 适用于 async 模式；sync 模式每次写入直接落盘，此选项无效
   */
  highWaterMark?: number;
  /** 保留归档文件的最大数量，0 表示不限制，默认 `0` */
  maxFiles?: number;
  /** 同步写入模式，默认 `false` */
  sync?: boolean;
  /** 格式化元数据的缩进空格数，默认 `1` */
  formatted?: number;
}
```

## AI技能 / 针对LLMS

```bash
bunx skills add elysiajs/skills
```

- [llms](https://elysiajs.com/llms.txt)
- [llms-full](https://elysiajs.com/llms-full.txt)

## MCP推荐

```json
{
  "mcpServers": {
    // 任何GitHub项目转变为文档中心
    "名称": {
      "url": "https://gitmcp.io/{作者}/{仓库}"
    },
    // elysia 文档
    "elysia": {
      "url": "https://gitmcp.io/elysiajs/documentation"
    },
    // Bun 文档
    "bun": {
      "url": "https://bun.com/docs/mcp",
    },
    // 代码库上下文理解服务
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "你的密钥"
      ]
    },
    // 代码库深度理解服务
    "deepwiki": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-deepwiki@latest"
      ]
    },
    // Chrome 开发者工具集成
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest"
      ]
    },
    // Playwright 浏览器自动化
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest"
      ]
    }
  }
}
```

