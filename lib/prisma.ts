import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const url = new URL(
    process.env.DATABASE_URL ?? "mysql://root@localhost:3306/basket_latihan",
  );
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || "3306"),
    user: url.username || "root",
    password: url.password ? decodeURIComponent(url.password) : "",
    database: url.pathname.replace(/^\//, "") || "basket_latihan",
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;