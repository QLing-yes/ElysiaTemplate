// biome-ignore assist/source/organizeImports: Global variables
import * as $ from "@/app/common";
/** 唯一全局变量（不建议增加更多了） */
(globalThis as unknown as { $: typeof $ }).$ = $;

import { logger } from "@/app/lib/logger";
import plugins from "@/app/plugins/index.plug";

const app = plugins
  .onStart(() => {
    const service = `localhost:${process.env.PORT || 3000}`;
    logger.info(`service http://${service}`);
    logger.info(`openapi http://${service}/openapi`);
  })
  .onStop(() => {
    logger.info("service stop");
  })
  .listen(process.env.PORT || 3000);

export type APP = typeof app;
