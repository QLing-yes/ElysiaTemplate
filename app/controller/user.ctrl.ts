import Elysia from "elysia";
import plug_routes from "@/app/plugins/routes.plug";

export default (app: typeof plug_routes) =>
	app
		.get("/1_c", () => "1_c")
		.get("/1_c_res", ({ res }) => res.success("1_c"))
		.get("/1_c_errc_err", () => {
			throw new Error("ERR-1c");
		});
