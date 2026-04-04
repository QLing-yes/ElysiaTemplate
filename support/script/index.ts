import { watchDir } from "@/app/utils/watch";
import autoRoutes from "./routes";

watchDir({
  dir: "app/controller",
  suffix: ["ctrl.ts"],
  onChange() {
    generateRoutes();
  },
});

generateRoutes();

function generateRoutes() {
  autoRoutes({
    fromDir: "app/controller",
    target: "./support/generated/routes/index.ts",
  });
}
