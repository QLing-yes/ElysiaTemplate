[English](./README-en.md) | [中文](./README.md)

## 非正式版本

- 自动路由、日志系统、端到端类型安全，更多即将到来。
- 目标：先实现一整套前后端分离模板 为日后AI生成代码打下基础。
- 打算将Drizzle作为默认的ORM工具，Prisma作为可选的。

## 项目结构

```
Project/
├── public/                   # 静态资源（自动路由静态资源）
├── app/
│   ├── common/
│   │   └── index.ts          # 全局模块入口 (已注册到全局“$g”建议控制器中使用，其他位置建议手动导入)
│   │   └── schemas.ts        # 数据模型 (自动使用elysia.model注册)
│   │   └── schemaDerive.ts   # 数据模型的派生类型和方法
│   ├── controller/           # 控制器层 (`ctrl.ts` 结尾的文件将自动加载)
│   ├── lib/
│   │   ├── error.ts          # 全局错误与进程事件捕获处理
│   │   ├── logger.ts         # 日志库
│   │   ├── prisma.ts         # Prisma 客户端
│   │   └── redis.ts          # Redis 客户端
│   ├── plugins/
│   │   ├── index.plug.ts     # 全局插件
│   │   └── macro.plug.ts     # 宏插件
│   │   └── routes.plug.ts    # 路由插件
│   │   └── schemas.plug.ts   # 数据模型注册插件
│   ├── utils/                # 工具函数
│   └── cluster.ts            # 单机多进程集群模式入口
│   └── index.ts              # 应用入口
├── logs/
├── prisma/                   # Prisma ORM 配置目录
│   ├── migrations/           # 数据库迁移文件目录
│   │   └── migration.sql
│   └── schema.prisma         # Prisma 数据模型
├── test/                     # Eden 测试目录
├── support/                  # 辅助脚本目录（无需关心）
│   └── script/
│       ├── index.ts          # 生成脚本
│       ├── menu.ts           # 命令菜单
│       └── routes.ts         # 路由生成工具
|── .env                      # 配置文件
...
```

## 快速开始

```bash
bun i
bun run generate
bun run dev
```
- 注意新增或删除控制器文件后，需要重新运行 `bun run script_generate` 来更新路由。

## 命令

```bash
bun run menu    # 启动命令菜单
bun run dev     # 启动开发服务器
bun run fix     # 修复代码风格
bun run generate  # 生成路由和prisma
bun run script_generate  # 生成路由
bun run prisma_generate  # 生成prisma
```

## 日志配置
[logger.ts](app/lib/logger.ts)
```typescript
import { Logger, logger } from "@/app/lib/logger";
//const logger = new Logger({ level: "debug" });
logger.info("msg");
logger.info("msg", { meta: "value" });
```
```typescript
/** 日志级别 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** 文件轮转粒度 */
export type RotateBy = "hour" | "day" | "month";

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
}
```

## AI技能 / 针对LLMS

```bash
bunx skills add elysiajs/skills
```

- [llms](https://elysiajs.com/llms.txt)
- [llms-full](https://elysiajs.com/llms-full.txt)

## MCP推荐
```
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