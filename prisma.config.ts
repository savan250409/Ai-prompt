import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config (migrate / introspect / generate).
 *
 * The existing content tables are marked EXTERNAL so Prisma never generates
 * migrations that ALTER them — only the new web tables are app-owned (§1).
 * `db pull` keeps the external tables' shapes in sync.
 *
 * Datasource is only wired when DATABASE_URL is present, so `prisma generate`
 * works in mock mode (no DB) without throwing.
 *
 * The Prisma CLI (unlike Next.js) does not auto-load .env.local, so on the
 * server `prisma migrate deploy` would see no DATABASE_URL and fail with
 * "datasource.url property is required". Load the env files here first —
 * .env.local wins because dotenv keeps the first value set for each key.
 */
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      "ngendev_categories",
      "ngendev_images",
      "ngendev_video_categories",
      "ngendev_videos",
      "filter_ai_image_categories",
      "filter_ai_images",
    ],
  },
  enums: {
    external: ["ngendev_categories_type", "ngendev_video_categories_type"],
  },
});
