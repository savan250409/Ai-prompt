import "server-only";
import { PrismaClient } from "@/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "./config";

/**
 * Prisma 7 client singleton — uses the MariaDB/MySQL driver adapter (Prisma 7
 * requires a driver adapter; there is no built-in engine). Constructed LAZILY
 * and only when DATABASE_URL is set, so the app runs on the mock catalog with
 * no DB and never instantiates a client (§1).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  if (!config.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set — database access is unavailable (running on the mock catalog).",
    );
  }
  const adapter = new PrismaMariaDb(config.databaseUrl);
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/** True when a real database is configured (else the app uses the mock catalog). */
export const hasDatabase = Boolean(config.databaseUrl);
