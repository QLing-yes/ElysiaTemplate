// 这里放一些不能进入全局“$g”的公共代码

import { routes_ctrl } from "@/app/plugins/index.plug";

import type { PublicRoute } from "elysia/types";

/** OpenAPI 扩展字段：接口权限编号 */
export const PERM_CODE_KEY = "x-perm-code" as const;

/**
 * 反查已注册路由的权限编号并校验唯一（读取 routes 会触发路由编译）
 * @param routes 已注册路由列表
 */
export async function collectPermRoutes() {
  const routes: PublicRoute[] = routes_ctrl.routes;
  const permRoutes = new Map<number, string>();
  const permRepeat = {} as Record<number, string[]>;

  for (const { method, path, hooks } of routes) {
    const code = hooks?.detail?.[PERM_CODE_KEY];
    if (typeof code !== "number") continue;
    const route = `${method} ${path}`;
    const prev = permRoutes.get(code);
    if (prev) {
      permRepeat[code] = permRepeat[code] || [];
      permRepeat[code].push(prev, route);
    }
    permRoutes.set(code, route);
  }

  return {
    /** 权限编号 → 路由路径 的映射 */
    permRoutes,
    /** 重复的权限编号 → 路由路径列表 */
    permRepeat
  };
}
