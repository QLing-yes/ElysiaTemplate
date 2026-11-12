import { collectPermRoutes } from "@/app/common/no_global";
import { t } from "elysia";

export default (app: Ctrl) =>
    app
        .post(
            "/ready",
            {
                title: "本服务是否就绪",
                res: t.String()
            },
            () => $g.success("yes")
        )
        .post(
            "/all_perm",
            {
                title: "获取所有权限路由列表",
                /** 权限编号 → 路由签名 */
                res: t.Record(t.Number(), t.String())
            },
            async () => {
                const { permRoutes } = await collectPermRoutes();
                /** 权限编号 + 路由签名，Map 需展开后遍历 */
                const perm_route = {} as Record<number, string>;
                [...permRoutes].map(([code, path]) => {
                    perm_route[code] = path;
                });
                return $g.success(perm_route)
            })
