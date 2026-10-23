import type * as common from "@/app/common";
import type controller from "@/app/plugins/controller.plug";

declare global {
  /** 唯一全局变量（不建议增加更多了） */
  const $g: typeof common;
  type Ctrl = typeof controller;
}
