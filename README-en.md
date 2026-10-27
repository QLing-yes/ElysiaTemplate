[English](./README-en.md) | [中文](./README.md)

## Pre-release Version `0.9.9`

- Version `1.0.0` and above are official releases
- Clone the project to try it out

## Project Structure
- Fully automatic routing, logging system, ORM, end-to-end type safety, and more features coming soon

```
Project/
├── public/                   # Static resources (auto-routed)
├── app/
│   ├── common/
│   │   └── index.ts          # Global module (registered to global `$g`, only usable in `controller`)
│   │   └── schemas.ts        # Data models (every model exported here is registered via `elysia.model()`)
│   │   └── schemaDerive.ts   # Derived types and methods of data models
│   ├── controller/           # Controller layer (files ending with `ctrl.ts` are auto-registered as routes and auto-updated)
│   ├── lib/
│   │   ├── error.ts          # Process exception event capture and logging (sync mode)
│   │   ├── logger.ts         # Logger library (async mode by default)
│   │   ├── drizzle.ts        # Drizzle client
│   │   └── redis.ts          # Redis client
│   ├── model/                # Drizzle data model directory (named `schema` exports in `.mold.ts` files are auto-registered via `elysia.model()`)
│   ├── plugins/
│   │   ├── index.plug.ts     # Global plugin
│   │   └── macro.plug.ts     # Macro plugin
│   │   └── controller.plug.ts # Controller plugin
│   │   └── schemas.plug.ts   # Data model registration plugin
│   ├── utils/                # Utility functions
│   └── cluster.ts            # Single-machine multi-process cluster entry (Linux only)
│   └── index.ts              # Application entry
├── logs/
├── test/                     # Eden test directory
├── system/                  # Helper scripts directory (no need to care)
│   └── script/
│       ├── index.ts          # Generation script
│       ├── menu.ts           # Interactive command menu
│       └── routes.ts         # Route generation tool
│       └── batchExport.ts    # Batch file export generation tool
|── .env                      # Configuration file
|── drizzle.config.ts         # drizzle configuration
...
```

### Please configure Drizzle with the following steps

1. **Check database configuration** — make sure the database connection info in [.env](.env) is correct
2. **Confirm data models** — check whether the model definitions in [app/model](app/model) meet your needs
3. **Sync to database** — run `bun run generate_drigrate_migrate`

## Quick Start

```bash
bun i
bun run dev
```

## Commands

```bash
bun run menu    # Start the interactive menu
bun run dev     # Start the dev server and auto-generate routes
bun run start-hot # Start in production mode with hot reload
bun run start-hot-bg # Start in production mode with hot reload; process keeps running after the terminal closes
bun run fix     # Fix code style

bun run generate  # Run all commands starting with `generate_`
bun run generate_script  # Generate routes (usually no need to run manually)

bun run drizzle_studio  # Drizzle visualization
bun run generate_drigrate_migrate # Generate migrations and run them

```
- `bun run menu --list` lists all options
- `bun run menu <parent> <child> <...>` executes by navigating the path level by level

## Logging Configuration

- Default: [the application logs in `sync` mode](app/lib/error.ts), [while controllers log in `async` mode](app/plugins/controller.plug.ts).

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
  /** Log output directory, defaults to `logs` */
  dir?: string;
  /** File rotation granularity, defaults to `day` */
  rotateBy?: RotateBy;
  /** Whether to also output to stdout, defaults to `process.env.LOG_STDOUT` */
  stdout?: boolean;
  /** Minimum log level, defaults to `debug` */
  level?: LogLevel;
  /** Periodic flush interval (ms), defaults to `1000` */
  flushInterval?: number;
  /**
   * In-memory buffer high water mark (bytes); flushes synchronously once reached, defaults to `1MB`
   * Applies to async mode; sync mode writes to disk on every call, so this option has no effect
   */
  highWaterMark?: number;
  /** Maximum number of archived files to keep; 0 means unlimited, defaults to `0` */
  maxFiles?: number;
  /** Synchronous write mode, defaults to `false` */
  sync?: boolean;
  /** Number of indent spaces for formatting metadata, defaults to `1` */
  formatted?: number;
}
```
