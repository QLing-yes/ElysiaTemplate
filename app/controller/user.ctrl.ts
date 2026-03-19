export default (app: RouterType) => app
	.get("/1_c", () => "1_c")
	.get("/1_c_res", ({ $ }) => $.res.success("1_c"))
	.get("/1_c_errc_err", () => {
		throw new Error("ERR-1c");
	});
