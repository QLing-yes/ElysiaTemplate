English | [中文](./README.md)

## Unofficial Version

- MVC backend, auto route, End-to-End Type Safety, more coming soon.

## Project Structure

```
Project/
├── public/                   # Static assets (auto-routed static resources)
├── app/
│   ├── common/
│   │   └── index.ts          # Common module entry (registered to global "$g", recommended for controller use only, manual import recommended for other locations)
│   │   └── schemas.ts        # All data models
│   ├── controller/           # Controller layer (files ending with `ctrl.ts` are auto-loaded)
│   ├── lib/
│   │   ├── logger.ts         # Logger library
│   │   ├── prisma.ts         # Prisma client
│   │   └── redis.ts          # Redis client
│   ├── plugins/
│   │   ├── index.plug.ts     # Global plugins
│   │   └── macro.plug.ts     # Macro plugins
│   │   └── routes.plug.ts    # Route plugins
│   │   └── schemas.plug.ts   # Data model registration plugins
│   ├── utils/                # Utility functions
│   └── cluster.ts            # Single-machine multi-process cluster mode entry
│   └── index.ts              # Application entry point
├── logs/
├── prisma/                   # Prisma ORM configuration directory
│   ├── migrations/           # Database migration files directory
│   │   └── migration.sql
│   └── schema.prisma         # Prisma data models
├── test/                     # Eden test directory
├── support/                  # Support scripts directory (no need to care about)
│   └── script/
│       ├── index.ts          # Generation script
│       ├── menu.ts           # Command menu
│       └── routes.ts         # Route generation utilities
|── .env                      # Configuration file
...
```

## Quick Start

```bash
bun i
bun run generate
bun run dev
```
- Note: After adding or deleting controller files, you need to run `bun run script_generate` again to update routes.

## Commands

```bash
bun run menu    # Start command menu
bun run dev     # Start development server
bun run fix     # Fix code style
bun run generate  # Generate routes and prisma
bun run script_generate  # Generate routes
bun run prisma_generate  # Generate prisma
```

## Logger Configuration
[logger.ts](app/lib/logger.ts)
```typescript
import { Logger, logger } from "@/app/lib/logger";
//const logger = new Logger({ level: "debug" });
logger.info("msg");
logger.info("msg", { meta: "value" });
```
```typescript
/** Log levels */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** File rotation granularity */
export type RotateBy = "hour" | "day" | "month";

/** Logger constructor options */
export interface LoggerOptions {
  /** Log output directory, default `logs` */
  dir?: string;
  /** File rotation granularity, default `day` */
  rotateBy?: RotateBy;
  /** Whether to output to stdout simultaneously, default `true` */
  stdout?: boolean;
  /** Minimum log level, default `debug` */
  level?: LogLevel;
  /** Periodic flush interval (ms), default `1000` */
  flushInterval?: number;
  /**
   * Memory buffer high water mark (bytes), triggers sync flush when reached, default `1MB`
   * Applicable for async mode; sync mode writes directly to disk each time, this option is invalid
   */
  highWaterMark?: number;
  /** Maximum number of archived files to retain, 0 means no limit, default `0` */
  maxFiles?: number;
  /** Synchronous write mode, default `false` */
  sync?: boolean;
}
```

## AI Skills / For LLMs

```bash
bunx skills add elysiajs/skills
```

- [llms](https://elysiajs.com/llms.txt)
- [llms-full](https://elysiajs.com/llms-full.txt)

## Recommended MCPs
```
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