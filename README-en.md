[English](./README-en.md) | [中文](./README.md)

- MVC backend, auto route & middleware, more coming.

## Quick Start

```bash
bun i
```

## Commands

```bash
bun run menu    # Launch command menu
bun run dev     # Start development server
bun run fix     # Fix code style
bun run generate  # Generate and register routes, middleware, prisma
```

## Project Structure

```
Project/
├── public/                   # Static assets
├── app/                      # Application core code
│   ├── controller/           # Controller layer
│   ├── lib/                  # Library files
│   │   ├── prisma.ts         # Prisma client
│   │   └── redis.ts          # Redis client
│   ├── utils/                # Utility functions
│   ├── common.ts             # Common modules
│   └── index.ts              # Application entry
├── prisma/                   # Database
│   ├── migrations/           # Database migrations
│   │   └── migration.sql
│   └── schema.prisma         # Data models
├── support/                  # Helper scripts (no need to worry about)
│   └── script/
│       ├── index.ts          # Generation script
│       ├── menu.ts           # Command menu
│       └── routes.ts         # Route registration
├── .env                      # Environment variables
...
```

## Controller Directory

### Auto-loading
- Files `middleware.ts` and `*.ctrl.ts` in this directory are automatically loaded
- Run `bun run generate` to update imports, or restart the project

### Middleware Scope
- The impact of `middleware.ts` is limited to the current directory and its downstream subdirectories, provided the `{ as:'scoped' }` option is used

### Example
```
app/controller/
├── middleware.ts        # Middleware
├── user.ctrl.ts         # User routes
└── admin/
    ├── middleware.ts    # Middleware
    ├── user.ctrl.ts    # Admin user routes
    └── admin_sub/
        ├── middleware.ts  # Middleware
        └── user.ctrl.ts   # Sub-module user routes
```

## Module Description

| Directory | Description |
|------|------|
| `app/controller` | Controller layer, supports auto-loading routes and middleware |
| `app/lib` | Base library wrappers (database, cache, etc.) |
| `app/utils` | Utility functions |
| `prisma` | Database models and migrations |
| `support/script` | Build and code generation scripts |

## AI Skills / For LLMs

```bash
bunx skills add elysiajs/skills
```

- [llms](https://elysiajs.com/llms.txt)
- [llms-full](https://elysiajs.com/llms-full.txt)

## MCP Recommended
```
{
  "mcpServers": {
    // Turn any GitHub project into a documentation center
    "name": {
      "url": "https://gitmcp.io/{author}/{repo}"
    },
    // elysia documentation
    "elysia": {
      "url": "https://gitmcp.io/elysiajs/documentation"
    },
    // Bun documentation
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
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    },
    // Playwright browser automation
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest"
      ]
    }
  }
}
```
