// import type * as common from "@/app/common";
import type routes from "@/app/plugins/routes.plug.ts";

declare global {
  /** 唯一全局变量（不建议增加更多了） */
  const $g: typeof common;
  type RouterType = typeof routes;
}
