#!/usr/bin/env node
// Local static server that mimics Vercel's cleanUrls: /work → work.html, /work/atms → work/atms.html,
// and redirects *.html requests to the clean URL.   Usage: node tools/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 5173;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".xml": "application/xml", ".ttf": "font/ttf", ".json": "application/json" };
const BLOCKED = /^\/(src|tools|node_modules|\.git|\.env)/; // not deployed (see .vercelignore)

function resolve(urlPath) {
  const p = path.join(ROOT, urlPath);
  if (!p.startsWith(ROOT)) return null;
  for (const c of [p, `${p}.html`, path.join(p, "index.html")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

// Minimal Vercel-style adapter so GET functions in api/ (e.g. /api/github) work locally.
// Env vars come from the shell, e.g. GITHUB_TOKEN=... node tools/serve.mjs
async function runApi(url, req, res) {
  const file = path.join(ROOT, `${url}.js`);
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
  try {
    const { default: handler } = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(body)); };
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end("API error");
  }
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (BLOCKED.test(url)) { res.writeHead(404); return res.end("Not found"); }
  if (/^\/api\/[a-z-]+$/.test(url) && req.method === "GET") return runApi(url, req, res);
  if (url.endsWith(".html") || (url.length > 1 && url.endsWith("/"))) {
    const clean = url.replace(/(\/index)?\.html$/, "").replace(/\/$/, "") || "/";
    res.writeHead(308, { Location: clean });
    return res.end();
  }
  const file = resolve(url);
  if (!file) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}`));
