/**
 * Dev launcher with automatic route warming.
 *
 * In dev, Next/Turbopack compiles each route on its FIRST visit — slow on this
 * machine (HDD). This starts `next dev` and then, as soon as the server is up,
 * quietly visits one URL per route *pattern* in the background so they compile
 * ahead of time. By the time you click an image/video/filter, the inner page is
 * already compiled → it opens instantly.
 *
 * Hitting a dynamic route with any id compiles the whole route (the bad-id
 * request still compiles before it 404s), and visiting a detail page also warms
 * the data cache, so real clicks are fast too.
 *
 * For a GUARANTEED-instant first click (everything pre-built), use the
 * production preview instead:  npm run preview
 */
import { spawn } from "node:child_process";

const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}`;

// Most-clicked / heaviest routes first so they warm soonest. One per pattern.
const WARM = [
  "/images/prompt/0", // compiles image detail route (+ warms image index)
  "/videos/prompt/0", // compiles video detail route (+ warms video index)
  "/images/0", // image category route
  "/videos/0", // video category route
  "/filters/1", // filter detail route
  "/", // home
  "/images",
  "/videos",
  "/filters",
  "/tools",
  "/tools/image_generation",
  "/pricing",
  "/login",
];

const child = spawn("npx", ["next", "dev"], { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    try {
      child.kill(sig);
    } catch {}
  });
}

(async () => {
  // wait until the dev server answers (up to ~90s)
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      await fetch(BASE, { method: "HEAD" });
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!ready) return;

  // Warm one route at a time (serial) so the HDD isn't thrashed by parallel
  // compiles. Each request both compiles the route and warms its data cache.
  for (const path of WARM) {
    try {
      await fetch(BASE + path, { signal: AbortSignal.timeout(45000) });
    } catch {}
  }
  // eslint-disable-next-line no-console
  console.log("\n  ✓ routes pre-warmed — inner pages will open instantly now\n");
})();
