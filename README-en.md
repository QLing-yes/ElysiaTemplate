[English](./README-en.md) | [中文](./README.md)

## Pre-release Version

- Version `1.0.0` marks the official release
- Clone the project to try it out

## Project Structure
- Fully automatic routing, logging system, ORM, end-to-end type safety, and more features coming soon

```
Project/
├── public/                   # Static assets (auto-routed)
├── app/
│   ├── common/
│   │   └── index.ts          # Global module (registered to global "$g", only used in `controller`)
│   │   └── schemas.ts        # Data models (auto-registered via elysia.model)
│   │   └── schemaDerive.ts   # Derived types and methods for data models
│   ├── controller/           # Controller layer (files ending with `ctrl.ts` are auto-loaded, routes update on change)
│   ├── lib/
│   │   ├── error.ts          # Global error and process event capture logging (sync mode)
│   │   ├── logger.ts         # Logger library (async mode by default)
│   │   ├── drizzle.ts        # Drizzle client
│   │   └── redis.ts          # Redis client
│   ├── model/                # Drizzle data model directory
│   ├── plugins/
│   │   ├── index.plug.ts     # Global plugin
│   │   └── macro.plug.ts     # Macro plugin
│   │   └── controller.plug.ts # Controller plugin
│   │   └── schemas.plug.ts   # Data model registration plugin
│   ├── utils/                # Utility functions
│   └── cluster.ts            # Single-machine multi-process cluster mode entry
│   └── index.ts              # Application entry
├── logs/
├── test/                     # Eden test directory
├── support/                  # Auxiliary scripts directory (no need to care)
│   └── script/
│       ├── index.ts          # Generation scripts
│       ├── menu.ts           # Command menu
│       └── routes.ts         # Route generation tool
|── .env                      # Configuration file
|── drizzle.config.ts         # drizzle configuration
...
```

- Of course, you can also just download this repository and use it directly.

### Please configure Drizzle with the following steps

1. **Check database configuration** — Verify the database connection info in [.env](.env)
2. **Confirm data models** — Check whether the model definitions in [app/model](app/model) meet your needs
3. **Sync to database** — Run `bun run generate_drigrate_migrate`

## Quick Start

```bash
bun i
bun run dev
```

## Commands

```bash
bun run menu    # Start interactive menu
bun run dev     # Start dev server, auto-generate routes
bun run start-hot # Start in production mode with hot reload
bun run start-hot-bg # Start in production mode with hot reload, process survives terminal close
bun run fix     # Fix code style

bun run generate  # Run all `generate_` prefixed commands
bun run generate_script  # Generate routes (usually no need to run manually)

bun run drizzle_studio  # drizzle visualization
bun run generate_drigrate_migrate # Generate migrations and execute

```
- `bun run menu --list` lists all options
- `bun run menu <parent> <child> <...>` supports navigating and executing level by level by path

## Logging Configuration

- Default: [the application uses `sync` mode](app/lib/error.ts), [controllers use `async` mode](app/plugins/controller.plug.ts).

```typescript
import { Logger, logger } from "@/app/lib/logger";
//const logger = new Logger({ sync: false, level: "debug" });
logger.info("msg", { meta: "value" });
logger.error("msg", Object | Error);
```

[logger.ts](app/lib/logger.ts)

```typescript
/** Log level */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** File rotation granularity */
export type RotateBy = "hour" | "day" | "month";

/** Log metadata type */
export type Meta = Record<string, unknown> | Error | undefined | null;

/** Logger constructor options */
export interface LoggerOptions {
  /** Log output directory, default `logs` */
  dir?: string;
  /** File rotation granularity, default `day` */
  rotateBy?: RotateBy;
  /** Whether to also output to stdout, default `process.env.LOG_STDOUT` */
  stdout?: boolean;
  /** Minimum log level, default `debug` */
  level?: LogLevel;
  /** Timed flush interval (ms), default `1000` */
  flushInterval?: number;
  /**
   * In-memory buffer high water mark (bytes), flushed to disk synchronously when reached, default `1MB`
   * Applies to async mode; in sync mode every write goes straight to disk, so this option has no effect
   */
  highWaterMark?: number;
  /** Maximum number of archived files to keep, 0 means unlimited, default `0` */
  maxFiles?: number;
  /** Sync write mode, default `false` */
  sync?: boolean;
  /** Number of spaces used to indent formatted metadata, default `1` */
  formatted?: number;
}
```
