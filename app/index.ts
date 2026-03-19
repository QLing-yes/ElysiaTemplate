import plugins from "@/app/plugins/index.plug";

const app = plugins.listen(3000);

export type APP = typeof app;

const service = `${app.server?.hostname}:${app.server?.port}`;

console.log(`service http://${service}`);
console.log(`openapi http://${service}/openapi`);
