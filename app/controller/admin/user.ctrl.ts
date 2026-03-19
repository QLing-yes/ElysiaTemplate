import { t } from "elysia";
import {
	UserPlain,
	UserPlainInputCreate,
} from "@/support/generated/prismabox/User";

export default (app: RouterType) =>
	app
		.get("/2_c", () => "2_c")
		.get("/redis", async () => {
			await $.redis.set("hello", "world");
			const result = await $.redis.get("hello");

			console.log(result);
			return result;
		})
		.put(
			"/create",
			async ({ body }) => {
				return $.prisma.user.create({
					data: body,
				});
			},
			{
				body: UserPlainInputCreate,
				response: UserPlain,
			},
		)
		.get(
			"/id/:id",
			async ({ params: { id }, status }) => {
				const user = await $.prisma.user.findUnique({
					where: { id: Number(id) },
				});

				if (!user) return status(404, "User not found");

				return user;
			},
			{
				response: {
					200: UserPlain,
					404: t.String(),
				},
			},
		);
