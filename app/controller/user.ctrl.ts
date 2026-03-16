import Elysia from "elysia";

export default new Elysia({ name: __filename, prefix: "" })
	.get("/1_c", () => "1_c")
	.get("/1_c_errc_err", () => {
		throw new Error("ERR-1c");
	});
