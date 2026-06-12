/**
 * Self-verification harness.
 *
 * Boots the new Phaser app (and optionally the original Construct export) in a
 * headless Chromium, waits for first render, and writes a PNG screenshot. This
 * lets changes be made AND confirmed without a human in the loop, and supports
 * A/B-ing the port against the original.
 *
 *   npm run verify            # screenshot the new app
 *   npm run verify -- --ab    # also screenshot the original export side-by-side
 *
 * Servers are started/stopped by this script. Exit code is non-zero on failure.
 */
import { chromium, type Browser, type Page } from "playwright";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer, type Server } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname, normalize } from "node:path";
import { mkdirSync, readFile } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "build", "screenshots");
const VIEWPORT = { width: 480, height: 854 };

const args = process.argv.slice(2);
const wantAB = args.includes("--ab");

// Scenes to screenshot in the new app. ?static keeps spawning deterministic.
const SCENES: Array<{ name: string; query: string }> = [
  { name: "title", query: "static=1" },
  { name: "stageselect", query: "scene=StageSelect&category=fruit1&static=1" },
  { name: "stageselect-locked", query: "scene=StageSelect&category=fruit2&static=1" },
  { name: "study", query: "scene=Study&category=fruit1&static=1" },
  { name: "play", query: "scene=Play&category=fruit1&static=1" },
];

async function shootNewApp(browser: Browser): Promise<void> {
  const server = await createViteServer({
    root: resolve(ROOT, "app"),
    configFile: resolve(ROOT, "vite.config.ts"),
    server: { port: 5180 },
    logLevel: "warn",
  });
  await server.listen();
  try {
    for (const scene of SCENES) {
      const page = await newPage(browser);
      const errors = captureErrors(page);
      await page.goto(`http://localhost:5180/?${scene.query}`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => (window as any).__ready === true, { timeout: 15000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: resolve(OUT, `new-${scene.name}.png`) });
      console.log(`✓ new app  -> build/screenshots/new-${scene.name}.png`);
      if (errors.length) {
        console.error(`✗ ${scene.name} errors:\n` + errors.join("\n"));
        process.exitCode = 1;
      }
      await page.close();
    }
  } finally {
    await server.close();
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".wasm": "application/wasm", ".webp": "image/webp",
  ".png": "image/png", ".webm": "audio/webm", ".mp3": "audio/mpeg",
  ".ttf": "font/ttf", ".css": "text/css", ".ico": "image/x-icon",
};

/** Minimal static file server rooted at the repo (serves the Construct export
 *  with correct MIME types — vite cannot, since it rewrites module scripts). */
function startStaticServer(rootDir: string, port: number): Promise<Server> {
  const server = createHttpServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const rel = normalize(urlPath === "/" ? "/index.html" : urlPath).replace(/^(\.\.[/\\])+/, "");
    const file = join(rootDir, rel);
    readFile(file, (err, buf) => {
      if (err) { res.statusCode = 404; res.end("not found"); return; }
      res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
      // Construct workers may want cross-origin isolation; harmless if unused.
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      res.end(buf);
    });
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}

async function shootOriginal(browser: Browser): Promise<void> {
  const server = await startStaticServer(ROOT, 4188);
  try {
    const page = await newPage(browser);
    await page.goto("http://localhost:4188/index.html", { waitUntil: "load" });
    // The Construct runtime boots workers + decoders then renders to a canvas.
    await page.waitForSelector("canvas", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: resolve(OUT, "original.png") });
    console.log("✓ original -> build/screenshots/original.png");
    await page.close();
  } finally {
    server.close();
  }
}

async function newPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  });
  return ctx.newPage();
}

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    await shootNewApp(browser);
    if (wantAB) await shootOriginal(browser);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
