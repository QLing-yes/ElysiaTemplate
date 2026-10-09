import { mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-orm/typebox";

export const table = mysqlTable("user", {
  id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }),
});

export const schema = createInsertSchema(table);
