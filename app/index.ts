// biome-ignore assist/source/organizeImports: Global variables
import * as $ from "@/app/common";
/** 唯一全局变量（不建议增加更多了） */
(globalThis as unknown as { $: typeof $ }).$ = $;

import { Elysia } from "elysia";
import plugins from "@/app/plugins/index.plug";
import { logger } from "@/app/lib/logger";
import cluster from "node:cluster";

const app = new Elysia({
  serve: {
    idleTimeout: 10,
    maxRequestBodySize: 1024 * 1024 * 10,
    reusePort: true,
  },
})
  .use(plugins)
  .onStart(() => {
    if (cluster.isPrimary) {
      const service = `localhost:${process.env.PORT}`;
      logger.info(`${process.pid} service http://${service}`);
      logger.info(`openapi http://${service}/openapi`);
    }
  })
  .onStop(() => {
    logger.info(`${process.pid} service stop`);
  })
  .listen(process.env.PORT!);

export type APP = typeof app;
