import "server-only";
import { config } from "@/lib/config";
import type { Store } from "./types";
import { memoryStore } from "./memory";
import { prismaStore } from "./prisma-store";

/**
 * Web-data store — Prisma only when explicitly opted in (WEB_STORE=prisma +
 * DATABASE_URL), else in-memory. Decoupled from the catalog so a shared/legacy
 * DB can drive the catalog without its users/sessions tables colliding with the
 * app's own web tables (§1). See config.useDbWebStore.
 */
export const store: Store = config.useDbWebStore ? prismaStore : memoryStore;

export type { Store } from "./types";
