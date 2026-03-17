import { treaty } from "@elysiajs/eden";
import type { APP } from ".";

const client = treaty<APP>("localhost:3000");

async function test() {
  const data = (await client["1_c"].get()).data
  console.log(data?.data);
}
