import "server-only";
import { hasDatabase } from "@/lib/prisma";
import type { Store } from "./types";
import { memoryStore } from "./memory";
import { prismaStore } from "./prisma-store";

/** Web-data store — Prisma when a DB is configured, else in-memory (§1). */
export const store: Store = hasDatabase ? prismaStore : memoryStore;

export type { Store } from "./types";
