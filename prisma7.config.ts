import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI only (migrate, studio). Migrations take a Postgres advisory lock; through
    // Neon's pooler (PgBouncer) that lock can stay stuck on a pooled connection and block
    // every later deploy with P1002, so point DIRECT_URL at the host without "-pooler".
    // The app itself keeps using DATABASE_URL (lib/prisma.ts).
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
    // Optional — hosted Postgres (Neon) needs none.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"] || undefined,
  },
});
