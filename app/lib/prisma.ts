import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/support/generated/prisma";

const adapter = new PrismaMariaDb({
	host: process.env.DATABASE_HOST,
	port: Number(process.env.DATABASE_PORT) || 3306,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
	connectionLimit: 5,
});
/** prisma客户端 */
const prisma = new PrismaClient({ adapter });

export { prisma };
