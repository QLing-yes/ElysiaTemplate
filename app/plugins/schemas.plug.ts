import { Elysia } from "elysia";
import * as Schema from "@/app/common/schemas";

export default new Elysia({ name: String($g.counter.n) }).model(Schema);
