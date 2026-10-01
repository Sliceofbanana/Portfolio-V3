#!/usr/bin/env node
/**
 * Static page builder — no dependencies.
 *
 *   node tools/build.mjs
 *
 * Reads   src/partials/*.html      shared chrome (header, footer, form, modals)
 *         src/pages/portfolio/*.html   → /<name>.html
 *         src/pages/sngdnn/*.html      → /sngdnn/<name>.html
 *         src/data/projects.mjs         → /work/<slug>.html case studies + project grids
 *                                         /sngdnn/work/<slug>.html for Project SNGDNN clients
 *
 * Each page file starts with a meta comment:
 *   <!-- meta {"title": "...", "description": "...", "nav": "work"} -->
 *
 * Placeholders usable in pages/partials:
 *   {{ROOT}}                 relative path to the site root ("" or "../")
 *   {{> name}}               include src/partials/name.html
 *   {{FORM Source Value}}    the shared intake form, tagged with its source
 *   {{PROJECTS all|featured}} project cards
 *   {{MINI_WORK}}            compact strip of SNGDNN clients
 *   {{CLIENTS}}              SNGDNN client cards
 *   {{PROJECT_COUNT}}        e.g. "8+"
 *
 * Generated HTML is committed; Vercel serves it as plain static files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../src/data/projects.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT_DIR, "src");
const BASE_URL = "https://www.genesisjr.com";

const SITES = {
  portfolio: {
    out: "",
    bodyClass: "",
    brand: `<a href="{{ROOT}}index.html" class="logo" aria-label="Genesis Jr — home">genesis<span class="dot"></span>jr</a>`,
    nav: [["work", "Work"], ["about", "About"], ["services", "Services"], ["experience", "Experience"], ["contact", "Contact"]],
    pill: [`{{ROOT}}sngdnn/index.html`, "Project SNGDNN ↗"],
    cta: "Start a project",
    ogImage: "Image/genesis.webp",
    siteName: "Genesis Jr",
    thanks: "Your project details were sent successfully. I'll get back to you within 24 hours.",
  },
  sngdnn: {
    out: "sngdnn",
    bodyClass: "sng",
    brand: `<a href="{{ROOT}}sngdnn/index.html" class="logo-pixel" aria-label="Project SNGDNN — home">SNGDNN</a>`,
    nav: [["index", "Home"], ["services", "Services"], ["about", "About"], ["work", "Work"], ["contact", "Contact"]],
    pill: [`{{ROOT}}index.html`, "Genesis Jr ↗"],
    cta: "Start a project",
    ogImage: "Image/default1-67ce61e262485.webp",
    siteName: "Project SNGDNN",
    thanks: "Your project details were sent to Project SNGDNN. We'll get back to you within 24 hours.",
  },
};

const read = (p) => fs.readFileSync(p, "utf8");
const partial = (name) => read(path.join(SRC, "partials", `${name}.html`));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/* ----------------------------------------------------------- components */

// Personal portfolio work vs. Project SNGDNN client work
const portfolioProjects = projects.filter((p) => !p.studioOnly);
const studioProjects = projects.filter((p) => p.studio && p.caseStudy).sort((a, b) => a.studio - b.studio);

const CASE = {
  portfolio: { list: portfolioProjects.filter((p) => p.caseStudy), base: "{{ROOT}}work/", back: ["{{ROOT}}work.html", "← All work"], contact: "{{ROOT}}contact.html" },
  sngdnn: { list: studioProjects, base: "{{ROOT}}sngdnn/work/", back: ["{{ROOT}}sngdnn/work.html", "← All clients"], contact: "{{ROOT}}sngdnn/contact.html" },
};
const caseHref = (p, site = "portfolio") => `${CASE[site].base}${p.slug}.html`;

function projectCard(p, { featured = false, delay = 0, site = "portfolio" } = {}) {
  const internal = !!p.caseStudy;
  const href = internal ? caseHref(p, site) : p.href;
  const ext = internal ? "" : ` target="_blank" rel="noopener"`;
  const cls = ["project", "reveal", featured && "featured", delay && `reveal-d${delay}`].filter(Boolean).join(" ");
  return `<a class="${cls}" href="${href}"${ext} data-category="${p.categories.join(" ")}">
                        <div class="project-media">
                            <img src="{{ROOT}}${p.image}" alt="${esc(p.alt)}"${p.imagePosition ? ` style="object-position:${p.imagePosition}"` : ""} loading="lazy" width="${featured ? 2160 : 800}" height="${featured ? 1350 : 500}">
                            <span class="view">${internal ? "Read case study →" : p.linkLabel}</span>
                        </div>
                        <div class="project-info">
                            <div>
                                <h3>${p.title}</h3>
                                <p>${p.blurb}</p>
                            </div>
                            <span class="project-year">${site === "sngdnn" ? p.studioLabel : internal ? "Case study" : p.badge}</span>
                        </div>
                    </a>`;
}

function projectGrid(which) {
  const list = which === "featured" ? portfolioProjects.filter((p) => p.featured) : portfolioProjects;
  return `<div class="work-grid">\n                    ${list
    .map((p, i) => projectCard(p, { featured: i === 0, delay: i % 2 }))
    .join("\n\n                    ")}\n                </div>`;
}

function clientGrid() {
  return `<div class="work-grid">\n                    ${studioProjects
    .map((p, i) => projectCard(p, { featured: i === 0, delay: i % 2, site: "sngdnn" }))
    .join("\n\n                    ")}\n                </div>`;
}

function miniWork() {
  const list = studioProjects;
  return `<div class="mini-work">\n${list
    .map(
      (p, i) => `                    <a href="${caseHref(p, "sngdnn")}" class="reveal${i ? ` reveal-d${i}` : ""}">
                        <div class="project-media"><img src="{{ROOT}}${p.image}" alt="${esc(p.alt)}" loading="lazy" width="400" height="300"></div>
                        <h4>${p.short || p.title}</h4><p>${p.studioLabel} · ${p.tagline}</p>
                    </a>`
    )
    .join("\n")}\n                </div>`;
}

function caseStudyBody(p, site = "portfolio") {
  const cs = p.caseStudy;
  const { list, back, contact } = CASE[site];
  const next = list[(list.indexOf(p) + 1) % list.length];
  const stats = cs.stats
    ? `<div class="cs-stats">${cs.stats.map(([n, l]) => `<div class="card"><strong class="grad-text">${n}</strong><span>${l}</span></div>`).join("")}</div>`
    : "";
  const gallery = cs.gallery
    ? `<section class="cs-section"><h3>${cs.galleryTitle || "Inside the system"}</h3><div class="cs-gallery${cs.galleryFit === "contain" ? " is-contain" : ""}">${cs.gallery
        .map(([src, cap]) => `<figure><button type="button" data-zoom="{{ROOT}}${src}" aria-label="Enlarge: ${esc(cap)}"><img src="{{ROOT}}${src}" alt="${esc(cap)}" loading="lazy"></button><figcaption>${cap}</figcaption></figure>`)
        .join("")}</div></section>`
    : "";
  return `
        <article class="section case-page">
            <div class="container case-container">
                <a href="${back[0]}" class="back-link reveal">${back[1]}</a>
                <header class="case-head reveal">
                    <span class="eyebrow">${site === "sngdnn" ? `Client · ${p.studioLabel}` : "Case study"}</span>
                    <h1>${p.title}</h1>
                    <p class="cs-sub">${cs.subtitle}</p>
                </header>
                <div class="case-hero reveal"><img src="{{ROOT}}${p.heroImage || p.image}" alt="${esc(p.alt)}" width="2160" height="1350"></div>
                <div class="cs-body">
                    <div class="cs-meta">${cs.meta.map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join("")}</div>
                    ${stats}
                    ${gallery}
                    ${cs.sections.map(([h, body]) => `<section class="cs-section"><h3>${h}</h3>${body}</section>`).join("\n                    ")}
                    ${cs.note ? `<p class="cs-note">${cs.note}</p>` : ""}
                    <div class="cs-actions">
                        ${cs.live ? `<a class="btn btn-primary" href="${cs.live}" target="_blank" rel="noopener">View live website <span class="arrow">↗</span></a>` : ""}
                        <a class="btn ${cs.live ? "btn-ghost" : "btn-primary"}" href="${contact}">Start a similar project</a>
                    </div>
                </div>
                <a class="next-case reveal" href="${caseHref(next, site)}">
                    <span>${site === "sngdnn" ? "Next client" : "Next case study"}</span>
                    <strong>${next.title} →</strong>
                </a>
            </div>
        </article>`;
}

/* --------------------------------------------------------------- layout */

function header(site, active) {
  const s = SITES[site];
  const prefix = site === "sngdnn" ? "{{ROOT}}sngdnn/" : "{{ROOT}}";
  const links = s.nav
    .map(([key, label]) => {
      const cur = key === active;
      return `<li><a href="${prefix}${key}.html"${cur ? ' class="active" aria-current="page"' : ""}>${label}</a></li>`;
    })
    .join("\n                    ");
  return `<header class="site-header">
        <div class="container nav">
            ${s.brand}

            <nav aria-label="Primary">
                <ul class="nav-links">
                    ${links}
                    <li><a href="${s.pill[0]}" class="pill-link">${s.pill[1]}</a></li>
                </ul>
            </nav>

            <a href="${prefix}contact.html" class="btn btn-primary nav-cta">${s.cta}</a>
            <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span></button>
        </div>
    </header>`;
}

function render(content, root) {
  // includes first, then generated blocks, then ROOT last so everything gets the prefix
  let html = content.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partial(n));
  html = html.replace(/\{\{FORM ([^}]+)\}\}/g, (_, source) => partial("intake-form").replace("{{SOURCE}}", esc(source.trim())));
  html = html.replace(/\{\{PROJECTS (all|featured)\}\}/g, (_, w) => projectGrid(w));
  html = html.replace(/\{\{MINI_WORK\}\}/g, () => miniWork());
  html = html.replace(/\{\{CLIENTS\}\}/g, () => clientGrid());
  html = html.replace(/\{\{PROJECT_COUNT\}\}/g, `${portfolioProjects.length}+`);
  html = html.replace(/\{\{YEAR\}\}/g, String(new Date().getFullYear()));
  return cleanUrls(html.replace(/\{\{ROOT\}\}/g, root));
}

/**
 * Pretty URLs: every internal page link becomes extensionless and hash-free
 *   /index.html → /    /work.html → /work    /sngdnn/index.html → /sngdnn
 *   /sngdnn/services.html#web → /sngdnn/services
 * vercel.json sets cleanUrls so these resolve, and old .html addresses redirect.
 */
function cleanUrls(html) {
  return html.replace(/(\shref=")(\/[^"#]*?)\.html(#[^"]*)?"/g, (_, attr, p) => {
    let url = p.replace(/(^|\/)index$/, "$1");
    if (url.length > 1) url = url.replace(/\/$/, "");
    return `${attr}${url || "/"}"`;
  });
}

function page(site, { title, description, nav, jsonld, urlPath }, body, root) {
  const s = SITES[site];
  const url = `${BASE_URL}${urlPath}`;
  const doc = `<!DOCTYPE html>
<!-- Generated by tools/build.mjs from src/ — edit the source files, then run: node tools/build.mjs -->
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#0a0a0c">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/webp" href="{{ROOT}}Image/default1-67ce61e262485.webp">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${s.siteName}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${BASE_URL}/${s.ogImage}">
    <meta property="og:url" content="${url}">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Silkscreen&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ROOT}}assets/site.css">
    <script src="{{ROOT}}assets/boot.js"></script>
${jsonld ? `\n    <script type="application/ld+json">\n${JSON.stringify(jsonld, null, 4).replace(/^/gm, "    ")}\n    </script>\n` : ""}</head>

<body${s.bodyClass ? ` class="${s.bodyClass}"` : ""}>
    <div class="bg-glow" aria-hidden="true"></div>
    <div class="bg-grid" aria-hidden="true"></div>

    ${header(site, nav)}

    <main id="top">
${body}
    </main>

${partial(`footer-${site}`)}
${partial("modals").replace("{{THANKS}}", s.thanks)}
    <script src="{{ROOT}}assets/site.js" defer></script>
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
</body>
</html>
`;
  return render(doc, root);
}

/* ---------------------------------------------------------------- build */

const written = [];
function write(rel, html) {
  const file = path.join(ROOT_DIR, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  written.push(rel.replace(/\\/g, "/"));
}

function parse(file) {
  const src = read(file);
  const m = src.match(/^<!--\s*meta\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`Missing meta comment in ${file}`);
  return { meta: JSON.parse(m[1]), body: src.slice(m[0].length) };
}

for (const site of Object.keys(SITES)) {
  const dir = path.join(SRC, "pages", site);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".html"))) {
    const name = f.replace(/\.html$/, "");
    const { meta, body } = parse(path.join(dir, f));
    const out = SITES[site].out ? `${SITES[site].out}/${f}` : f;
    // Root-absolute paths, so links and assets resolve the same from any URL depth
    const root = "/";
    const sub = SITES[site].out;
    const urlPath = name === "index" ? `/${sub}` : `/${sub ? sub + "/" : ""}${name}`;
    write(out, page(site, { nav: name, ...meta, urlPath }, body, root));
  }
}

for (const site of ["portfolio", "sngdnn"]) {
  const sub = site === "sngdnn" ? "sngdnn/work" : "work";
  const suffix = site === "sngdnn" ? "Project SNGDNN" : "Genesis Jr";
  for (const p of CASE[site].list) {
    write(
      `${sub}/${p.slug}.html`,
      page(
        site,
        { title: `${p.title} — Case Study | ${suffix}`, description: p.caseStudy.subtitle, nav: "work", urlPath: `/${sub}/${p.slug}` },
        caseStudyBody(p, site),
        "/"
      )
    );
  }
}

// Sitemap
const today = new Date().toISOString().slice(0, 10);
const urls = written.map((w) => {
  const clean = w.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "");
  return clean ? `${BASE_URL}/${clean}` : `${BASE_URL}/`;
});
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `    <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`
);

console.log(`Built ${written.length} files:\n  ${written.join("\n  ")}`);
