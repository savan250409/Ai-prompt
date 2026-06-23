/**
 * Custom Next.js server entry point for panel-managed Node hosting
 * (FastPanel / cPanel / Passenger). The panel runs THIS file and tells the app
 * which port to use via an env var, then reverse-proxies nginx to it.
 *
 * FastPanel provides the port as SERVICE_PORT (and SERVICE_HOST). cPanel uses
 * PORT. We honor whichever is set, so the app always binds where nginx expects
 * — otherwise you get a 502 Bad Gateway.
 *
 * Requires a production build first:  npm run build   (creates the .next folder)
 */
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || process.env.SERVICE_PORT || "3000", 10);
const hostname = process.env.SERVICE_HOST || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`> Prompt Studio ready on ${hostname}:${port}`);
  });
});
