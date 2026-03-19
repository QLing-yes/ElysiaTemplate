English | [中文](./README.md)

## Unofficial Version

- MVC backend, auto route, End-to-End Type Safety, more coming.

## Quick Start

```bash
bun i
```

## Commands

```bash
bun run menu    # Start command menu
bun run dev     # Start development server
bun run fix     # Fix code style
bun run generate  # Generate and register routes, prisma
```

## Project Structure

```
Project/
├── public/                   # Static assets (auto-routed)
├── app/                      # Application
│   ├── controller/           # Controller layer (files ending with `ctrl.ts` are auto-loaded)
│   ├── lib/                  # Library files
│   │   ├── prisma.ts         # Prisma client
│   │   └── redis.ts          # Redis client
│   ├── plugins/              # Plugins directory
│   │   ├── index.plug.ts     # Global plugins
│   │   └── routes.plug.ts    # Route plugins
│   ├── utils/                # Utility functions
│   ├── common.ts             # Common modules
│   └── index.ts              # Application entry point
├── prisma/                   # Database
│   ├── migrations/
│   │   └── migration.sql
│   └── schema.prisma         # Data models
├── support/                  # Support scripts (no need to care about)
│   └── script/
│       ├── index.ts          # Generation script
│       ├── menu.ts           # Command menu
│       └── routes.ts         # Route generation utilities
|── .env                      # Environment variables
...
```

## Auto Loading

- Run `bun run generate` or restart the project to update auto-imports

## AI Skills / For LLMs

```bash
bunx skills add elysiajs/skills
```

- [llms](https://elysiajs.com/llms.txt)
- [llms-full](https://elysiajs.com/llms-full.txt)

## Recommended MCPs

```json
{
  "mcpServers": {
    // Transform any GitHub project into a documentation hub
    "name": {
      "url": "https://gitmcp.io/{author}/{repo}"
    },
    // elysia docs
    "elysia": {
      "url": "https://gitmcp.io/elysiajs/documentation"
    },
    // Bun docs
    "bun": {
      "url": "https://bun.com/docs/mcp",
    },
    // Codebase context understanding service
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "your-api-key"
      ]
    },
    // Codebase deep understanding service
    "deepwiki": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-deepwiki@latest"
      ]
    },
    // Chrome DevTools integration
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest"
      ]
    },
    // Playwright browser automation
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest"
      ]
    }
  }
}
```
