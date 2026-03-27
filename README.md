[English](./README-en.md) | [中文](./README.md)

## 非正式版本

- MVC后端，自动路由，端到端类型安全，更多即将到来。

## 快速开始

```bash
bun i
```

## 启动命令

```bash
bun run menu    # 启动命令菜单
bun run dev     # 启动开发服务器
bun run fix     # 修复代码风格
bun run generate  # 生成和注册路由、prisma
```

## 项目结构

```
Project/
├── public/                   # 静态资源（自动路由）
├── app/                      # 应用
│   ├── controller/           # 控制器层(`ctrl.ts` 结尾的文件将自动加载)
│   ├── lib/                  # 库文件
│   │   ├── logger.ts         # 日志库
│   │   ├── prisma.ts         # Prisma 客户端
│   │   └── redis.ts          # Redis 客户端
│   ├── plugins/              # 插件目录
│   │   ├── index.plug.ts     # 全局插件
│   │   └── routes.plug.ts    # 路由插件
│   ├── utils/                # 工具函数
│   ├── common.ts             # 公共模块
│   └── index.ts              # 应用入口
├── prisma/                   # 数据库
│   ├── migrations/
│   │   └── migration.sql
│   └── schema.prisma         # 数据模型
├── support/                  # 辅助脚本（无需关心）
│   └── script/
│       ├── index.ts          # 生成脚本
│       ├── menu.ts           # 命令菜单
│       └── routes.ts         # 路由生成工具
|── .env                      # 环境变量
...
```

## 自动加载
- 运行 `bun run generate`或重新启动项目来更新自动导入

## 日志

基于 Bun 的时间段分文件日志库，支持按小时/天/月轮转。

### 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dir` | `string` | `"logs"` | 输出目录 |
| `rotateBy` | `"hour" \| "day" \| "month"` | `"day"` | 轮转粒度 |
| `sync` | `boolean` | `false` | 同步模式（直接刷盘） |
| `maxFiles` | `number` | `0` | 保留归档数，0 不清理 |
| `level` | `"debug" \| "info" \| "warn" \| "error"` | `"debug"` | 最低级别 |
| `flushInterval` | `number` | `1000` | 刷新间隔(ms) |
| `stdout` | `boolean` | `true` | 输出到 stdout |

### API

| 方法 | 说明 |
|------|------|
| `log.debug(msg, meta?)` | 记录调试日志 |
| `log.info(msg, meta?)` | 记录信息日志 |
| `log.warn(msg, meta?)` | 记录警告日志 |
| `log.error(msg, meta?)` | 记录错误日志 |
| `log.flush()` | 主动刷新缓冲 |
| `log.close()` | 关闭 Logger |

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