[English](./README-en.md) | [中文](./README.md)

- MVC backend, auto route & middleware, more coming.

## 快速开始

```bash
bun i
```

## 启动命令

```bash
bun run menu    # 启动命令菜单
bun run dev     # 启动开发服务器
bun run fix     # 修复代码风格
bun run generate  # 生成和注册路由、中间件、prisma
```

## 项目结构

```
Project/
├── public/                   # 静态资源
├── app/                      # 应用核心代码
│   ├── controller/           # 控制器层
│   ├── lib/                  # 库文件
│   │   ├── prisma.ts         # Prisma 客户端
│   │   └── redis.ts          # Redis 客户端
│   ├── utils/                # 工具函数
│   ├── common.ts             # 公共模块
│   └── index.ts              # 应用入口
├── prisma/                   # 数据库
│   ├── migrations/           # 数据库迁移
│   │   └── migration.sql
│   └── schema.prisma         # 数据模型
├── support/                  # 辅助脚本（无需关心）
│   └── script/
│       ├── index.ts          # 生成脚本
│       ├── menu.ts           # 命令菜单
│       └── routes.ts         # 路由注册
|── .env                      # 环境变量
...
```

## controller 目录介绍

### 自动加载
- 目录下的 `middleware.ts` 和 `*.ctrl.ts` 文件都会自动加载
- 运行 `bun run generate` 更新导入，或重新启动项目

### 中间件作用域
- `middleware.ts` 的影响范围仅限于当前目录及其下游子目录，前提是使用`{ as:'scoped' }`选项

### 示例
```
app/controller/
├── middleware.ts        # 中间件
├── user.ctrl.ts         # 用户路由
└── admin/
    ├── middleware.ts    # 中间件
    ├── user.ctrl.ts    # 后台用户路由
    └── admin_sub/
        ├── middleware.ts  # 中间件
        └── user.ctrl.ts   # 子模块用户路由
```

## 模块说明

| 目录 | 说明 |
|------|------|
| `app/controller` | 控制器层，支持自动加载路由和中间件 |
| `app/lib` | 基础库封装（数据库、缓存等） |
| `app/utils` | 工具函数 |
| `prisma` | 数据库模型和迁移 |
| `support/script` | 构建和代码生成脚本 |

## 人工智能技能 / 针对LLMS

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