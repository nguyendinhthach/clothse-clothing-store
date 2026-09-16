import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// One client per process. Next.js dev hot-reloads modules, so the instance is
// parked on globalThis to avoid opening a new pool on every reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Short idle timeout: local `prisma dev` (and serverless Postgres) drop idle
  // connections server-side; letting pg recycle them first avoids
  // "Server has closed the connection" on the next query.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 5_000 });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
