import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Unit-test harness for the server logic. We stub `server-only` (so server
 * modules import in a plain Node env) and `@/server/auth` (so tests don't load
 * the whole next-auth chain). The `@/*` path alias mirrors tsconfig.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/server\/auth$/, replacement: resolve(__dirname, "test/stubs/auth.ts") },
      { find: /^server-only$/, replacement: resolve(__dirname, "test/stubs/server-only.ts") },
      { find: /^@\/(.*)$/, replacement: resolve(__dirname, "src") + "/$1" },
    ],
  },
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
  },
});
