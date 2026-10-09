import {
  boolean,
  int,
  mysqlTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-orm/typebox";

export const table = mysqlTable("post", {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  content: text(),
  published: boolean().notNull().default(false),
  authorId: int("author_id").notNull(),
});

export const schema = createInsertSchema(table);
