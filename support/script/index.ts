import autoRoutes from "./routes";

autoRoutes({
 fromDir: "app/controller",
 target: "./support/generated/routes/index.ts",
});
