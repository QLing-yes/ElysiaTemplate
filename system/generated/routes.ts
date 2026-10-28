// auto generated
import Elysia from "elysia";
import * as $g from "@/app/common";
import mod_0 from "app/controller/test.ctrl.ts";
import mod_1 from "app/controller/test/test.ctrl.ts";
import mod_2 from "app/controller/test/testsub/test.ctrl.ts";

const num = () => String($g.counter.n);

const plug_2 = () => new Elysia({ prefix: "testsub", detail: { tags:["/test/testsub"] }, name: num() })
	.use(mod_2)

const plug_1 = () => new Elysia({ prefix: "test", detail: { tags:["/test"] }, name: num() })
	.use(mod_1)
	.use(plug_2())

const plug_0 = () => new Elysia({ prefix: "", detail: { tags:["/"] }, name: num() })
	.use(mod_0)
	.use(plug_1())

export default plug_0();
