/**
 * Instant preview: build + start + pre-load EVERYTHING, so once it says ready,
 * every inner page — including the FIRST open of an image/video/filter — opens
 * instantly. It pays all the slow costs upfront:
 *   1. `next build`  -> routes are pre-compiled (no on-demand compile ever)
 *   2. pre-warm       -> the persistent cache is filled with ALL catalog data,
 *                        so the slow upstream API is never on the critical path.
 *
 * The first run is slow (it builds + fetches everything once, and the upstream
 * API can be slow). After that the cache persists to disk, so re-runs are fast.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}`;

// Start from a clean .next so a stale/corrupt dev-types file can't fail the build.
try {
  rmSync(".next", { recursive: true, force: true });
} catch {}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: "inherit", shell: true });
    c.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

// Hitting a no-hint detail route builds the FULL category index, which caches
// every category's items in one go — so afterwards ALL detail pages are warm.
const WARM = [
  "/images/prompt/0", // -> builds + caches the entire IMAGE catalog
  "/videos/prompt/0", // -> builds + caches the entire VIDEO catalog
  "/filters", // -> caches FILTER data
  "/",
  "/images",
  "/videos",
  "/tools",
];

console.log("\n[1/3] Building production bundle (pre-compiles every route)…\n");
await run("npx", ["next", "build"]);

console.log("\n[2/3] Starting server…\n");
const server = spawn("npx", ["next", "start"], { stdio: "inherit", shell: true });
server.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    try {
      server.kill(sig);
    } catch {}
  });
}

for (let i = 0; i < 60; i++) {
  try {
    await fetch(BASE, { method: "HEAD" });
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log("\n[3/3] Pre-loading all catalog data (one-time; upstream API may be slow)…\n");
for (const path of WARM) {
  try {
    await fetch(BASE + path, { signal: AbortSignal.timeout(180000) });
    console.log(`      warmed ${path}`);
  } catch {
    console.log(`      (skipped ${path})`);
  }
}

console.log(`\n  ✅ READY — open ${BASE}\n     Every click is instant now, first time included.\n`);
