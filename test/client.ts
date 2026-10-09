import { treaty } from "@elysia/eden";
import type { APP } from "../app/index.ts";

const client = treaty<APP>("localhost:3000");

async function _() {
  // (await client.id({ id: 1 }).get()).data!.data;
  (await client.test.post({ a: 1 })).data!.data;
  (await client.routers.post()).data!.data;
}

// 手动执行：bun ./test/client.ts（需先启动服务）
_();

