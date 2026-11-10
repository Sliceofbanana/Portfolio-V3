/**
 * Project SNGDNN logo geometry — single source for the site's inline logo and the Image/sngdnn-*.svg files.
 *
 *   node tools/logo.mjs        writes the SVG files into Image/
 *
 * Mark: three blocks that read as an inverted P and an S. Only the middle step is Hot.
 * Wordmark and "PROJECT" are drawn as shapes on a 48 x 60 grid (13 stroke), so nothing depends on fonts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HOT = "#ff5a1f";

const MARK_OUTER = `<polygon points="330,0 720,0 720,112 650,154 623,154 623,99 260,99 260,42"/><polygon points="0,247 75,205 100,205 100,262 460,262 460,322 385,362 0,362"/>`;
const MARK_MID = `<polygon points="133,45 233,45 233,132 590,132 590,322 493,322 493,232 133,232"/>`;

const N = `points="0,60 0,0 13,0 35,36 35,0 48,0 48,60 35,60 13,24 13,60"`;
const WORD = [
  `<polygon points="0,8 8,0 48,0 48,13 13,13 13,23.5 48,23.5 48,52 40,60 0,60 0,47 35,47 35,36.5 0,36.5"/>`,
  `<polygon transform="translate(58 0)" ${N}/>`,
  `<polygon transform="translate(116 0)" points="8,0 48,0 48,13 13,13 13,47 35,47 35,36.5 24,36.5 24,23.5 48,23.5 48,60 8,60 0,52 0,8"/>`,
  `<path transform="translate(174 0)" d="M0 0 H32 L48 16 V44 L32 60 H0 Z M13 13 V47 H27 L35 39 V21 L27 13 Z"/>`,
  `<polygon transform="translate(232 0)" ${N}/>`,
  `<polygon transform="translate(290 0)" ${N}/>`,
].join("");

// PROJECT, same grid, 16 unit tracking → 432 x 60
const at = (i) => `transform="translate(${i * 64} 0)"`;
const PROJECT = [
  `<path ${at(0)} d="M0 0 H40 L48 8 V30 L40 38 H13 V60 H0 Z M13 13 V25 H35 V13 Z"/>`,
  `<path ${at(1)} d="M0 0 H40 L48 8 V30 L40 38 H13 V60 H0 Z M13 13 V25 H35 V13 Z"/><polygon ${at(1)} points="22,38 36,38 48,54 48,60 35,60"/>`,
  `<path ${at(2)} d="M8 0 H40 L48 8 V52 L40 60 H8 L0 52 V8 Z M13 13 V47 H35 V13 Z"/>`,
  `<polygon ${at(3)} points="35,0 48,0 48,52 40,60 8,60 0,52 0,38 13,38 13,47 35,47"/>`,
  `<polygon ${at(4)} points="0,0 48,0 48,13 13,13 13,23.5 40,23.5 40,36.5 13,36.5 13,47 48,47 48,60 0,60"/>`,
  `<polygon ${at(5)} points="8,0 48,0 48,13 13,13 13,47 48,47 48,60 8,60 0,52 0,8"/>`,
  `<polygon ${at(6)} points="0,0 48,0 48,13 30.5,13 30.5,60 17.5,60 17.5,13 0,13"/>`,
].join("");

/**
 * @param {object} o
 * @param {string} o.main     colour of outer blocks + wordmark ("currentColor" for inline use)
 * @param {string} o.accent   colour of the middle step and "PROJECT"
 * @param {boolean} o.project include "PROJECT" above the wordmark (full lockup) — use at 40px tall and up
 * @param {string} [o.attrs]  extra attributes on <svg>
 */
export function logoSvg({ main, accent, project = true, attrs = 'xmlns="http://www.w3.org/2000/svg"' }) {
  const wordY = project ? 41.5 : 27;
  return `<svg ${attrs} viewBox="0 0 647 120" width="647" height="120"><title>Project SNGDNN</title>`
    + `<g transform="scale(0.33149)"><g fill="${main}">${MARK_OUTER}</g><g fill="${accent}">${MARK_MID}</g></g>`
    + (project ? `<g transform="translate(275 12.5) scale(0.3333)" fill="${accent}" fill-rule="evenodd">${PROJECT}</g>` : "")
    + `<g transform="translate(275 ${wordY}) scale(1.1)" fill="${main}" fill-rule="evenodd">${WORD}</g></svg>`;
}

export function markSvg({ main, accent, attrs = 'xmlns="http://www.w3.org/2000/svg"' }) {
  return `<svg ${attrs} viewBox="0 0 720 362" width="720" height="362"><title>Project SNGDNN</title><g fill="${main}">${MARK_OUTER}</g><g fill="${accent}">${MARK_MID}</g></svg>`;
}

function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#0a0a0c"/><g transform="translate(5 18.4) scale(0.075)"><g fill="#f3f1ec">${MARK_OUTER}</g><g fill="${HOT}">${MARK_MID}</g></g></svg>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "Image");
  const files = {
    "sngdnn-logo-on-dark.svg": logoSvg({ main: "#f3f1ec", accent: HOT }),
    "sngdnn-logo-on-light.svg": logoSvg({ main: "#0a0a0c", accent: HOT }),
    "sngdnn-logo-black.svg": logoSvg({ main: "#0a0a0c", accent: "#0a0a0c" }),
    "sngdnn-logo-white.svg": logoSvg({ main: "#ffffff", accent: "#ffffff" }),
    "sngdnn-logo-compact-on-dark.svg": logoSvg({ main: "#f3f1ec", accent: HOT, project: false }),
    "sngdnn-logo-compact-on-light.svg": logoSvg({ main: "#0a0a0c", accent: HOT, project: false }),
    "sngdnn-mark-on-dark.svg": markSvg({ main: "#f3f1ec", accent: HOT }),
    "sngdnn-mark-on-light.svg": markSvg({ main: "#0a0a0c", accent: HOT }),
    "sngdnn-favicon.svg": faviconSvg(),
  };
  for (const [name, svg] of Object.entries(files)) fs.writeFileSync(path.join(out, name), svg + "\n");
  console.log(`wrote ${Object.keys(files).length} logo files to Image/`);
}
