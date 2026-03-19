// biome-ignore assist/source/organizeImports: Global variables
import * as $ from "@/app/common";
/** 唯一全局变量（不建议增加更多了） */
(globalThis as unknown as { $: typeof $ }).$ = $;

import plugins from "@/app/plugins/index.plug";

const app = plugins.listen(3000);
export type APP = typeof app;

const service = `${app.server?.hostname}:${app.server?.port}`;
console.log(`service http://${service}`);
console.log(`openapi http://${service}/openapi`);
