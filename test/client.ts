import { treaty } from "@elysiajs/eden";
import type { APP } from "../app/index.ts";

const client = treaty<APP>("localhost:3000");

async function test() {
	const data = (await client["1_c_res"].get()).data;
	console.log(data?.data);

	client["1_c_errc_err"].get().then((res) => {
		console.log(res.data?.data);
	});
}
test();
