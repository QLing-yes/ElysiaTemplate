import { watchDir } from "@/app/utils/watch";
import batchExport from "./batchExport";
import autoRoutes from "./routes";

const args = process.argv.slice(2);
const routes_config = {
  fromDir: "app/controller",
  target: "./system/generated/routes.ts",
};
const batch_export_config = {
  root: "app/model",// 文件只能在配置的root目录下，否则会导致重复名称
  suffix: [".mold.ts"],
  out: "./system/generated/schema.ts",
  template: `export { schema as {{name}}_schema } from "{{path}}";`,
};

autoRoutes(routes_config);// 文件路由生成
batchExport(batch_export_config);// 批量导出文件生成

if (args[0] === "watch") {
  // 监听路由文件变更
  watchDir({
    dir: routes_config.fromDir,
    suffix: [".ctrl.ts"],
    onChange() {
      autoRoutes(routes_config);
    },
  });
  // 监听模型文件变更
  watchDir({
    dir: batch_export_config.root,
    suffix: batch_export_config.suffix,
    onChange() {
      batchExport(batch_export_config);
    },
  });
  console.log("\x1b[32m 👀 watch auto generate \x1b[0m");
}
