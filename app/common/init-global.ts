import "@/app/lib/error";
import * as common from "@/app/common";

/** 唯一全局变量（不建议增加更多了） */
(globalThis as unknown as { $g: typeof common }).$g = common;
