#!/usr/bin/env node
// Verifies every internal href/src in the generated pages points at a real file,
// and that no template placeholders were left behind.  Usage: node tools/check-links.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["", "work", "services"].flatMap((d) =>
  fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith(".html")).map((f) => path.join(d, f))
);

let problems = 0;
for (const rel of pages) {
  const html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  if (/\{\{/.test(html)) { console.log(`✗ ${rel}: unresolved placeholder`); problems++; }
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, attr, url] of html.matchAll(/\s(href|src|data-zoom|data-lightbox)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    const [file, hash] = url.split("#");
    if (!file) {
      if (hash && hash !== "top" && !ids.has(hash)) { console.log(`✗ ${rel}: missing #${hash}`); problems++; }
      continue;
    }
    if (attr === "href" && /\.html$/.test(file)) { console.log(`✗ ${rel}: href="${url}" → use a clean URL`); problems++; }
    const base = file.startsWith("/") ? path.join(ROOT, decodeURIComponent(file)) : path.join(ROOT, path.dirname(rel), decodeURIComponent(file));
    // Resolve like Vercel cleanUrls: exact file, file.html, or dir/index.html
    const target = [base, `${base}.html`, path.join(base, "index.html")].find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
    if (!target) { console.log(`✗ ${rel}: ${attr}="${url}" → not found`); problems++; continue; }
    if (hash && target.endsWith(".html")) {
      const other = fs.readFileSync(target, "utf8");
      if (!other.includes(`id="${hash}"`)) { console.log(`✗ ${rel}: ${url} → anchor #${hash} missing`); problems++; }
    }
  }
}
console.log(problems ? `\n${problems} problem(s) in ${pages.length} pages` : `✓ ${pages.length} pages, all internal links and assets resolve`);
process.exit(problems ? 1 : 0);
