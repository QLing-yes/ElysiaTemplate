import { type TSchema, t } from "elysia";

export function resp<T extends TSchema>(payload?: T) {
  return t.Object({
    msg: t.String(),
    code: t.Number(),
    data: payload || t.Unknown(),
  });
}
