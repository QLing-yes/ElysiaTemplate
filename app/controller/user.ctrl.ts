export default (app: RouterType) =>
  app
    .guard({ tags: ["guard"] }, (app) =>
      app.get(
        "/exit",
        () => {
          process.exit(0);
        },
        {
          detail: { operationId: "1001" },
        },
      ),
    )

    .get("/1_c", () => "1_c", {
      detail: { operationId: "1001" },
    })
    .get("/1_c_res", () => $.res.success("1_c"), {
      detail: { operationId: "1002" },
    })
    .get(
      "/1_c_errc_err",
      () => {
        // return $.res.error("ERR-1c", 400);
        throw new Error("ERR-1c");
      },
      {
        detail: { operationId: "1003" },
      },
    );
