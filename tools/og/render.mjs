#!/usr/bin/env node
/**
 * Renders link-preview images (1200×630) from the HTML files in tools/og/
 * with headless Edge or Chrome. Re-run after changing prices:
 *
 *   node tools/og/render.mjs
 *
 * tools/og/rates.html → Image/og-rates.png (used by /rates via "ogImage" in its meta)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const BROWSERS = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
const browser = BROWSERS.find((b) => fs.existsSync(b));
if (!browser) throw new Error("No Edge or Chrome found to render the images.");

const jobs = [["rates.html", "Image/og-rates.png"]];
for (const [src, out] of jobs) {
  const target = path.join(ROOT, out);
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--virtual-time-budget=4000",
    "--window-size=1200,630",
    `--screenshot=${target}`,
    pathToFileURL(path.join(HERE, src)).href,
  ], { stdio: "ignore" });
  console.log(`${src} → ${out} (${fs.statSync(target).size} bytes)`);
}
