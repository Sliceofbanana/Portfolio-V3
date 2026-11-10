#!/usr/bin/env node
/**
 * Static page builder — no dependencies.
 *
 *   node tools/build.mjs
 *
 * Reads   src/partials/*.html      shared chrome (footer, form, modals, CTA)
 *         src/pages/*.html         → /<name>.html
 *         src/data/projects.mjs    → /work/<slug>.html case studies + project grids
 *         src/data/services.mjs    → /services/<slug>.html + header dropdown
 *         src/data/testimonials.mjs  client quotes
 *         assets/*.css, assets/*.js  → assets/*.min.css, *.min.js (pages load these; edit the originals)
 *
 * Each page file starts with a meta comment:
 *   <!-- meta {"title": "...", "description": "...", "nav": "work"} -->
 *   Optional "theme": "paper" switches the page to the light print theme (body.theme-paper).
 *
 * Placeholders usable in pages/partials:
 *   {{ROOT}}                  site root ("/")
 *   {{> name}}                include src/partials/name.html
 *   {{FORM Source Value}}     the intake form, tagged with its source
 *   {{PROJECTS all|featured}} project cards
 *   {{SERVICES}}              service cards linking to each service page
 *   {{TESTIMONIALS}}          "What clients say" section (confirmed quotes only)
 *   {{PROJECT_COUNT}}         e.g. "8"
 *   {{YEAR}}                  current year
 *   {{LOGO}}                  inline Project SNGDNN logo with "PROJECT" (takes currentColor)
 *   {{LOGO_COMPACT}}          same without "PROJECT", for small sizes like the nav
 *
 * Generated HTML is committed; Vercel serves it as plain static files.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { projects } from "../src/data/projects.mjs";
import { services } from "../src/data/services.mjs";
import { testimonials as allTestimonials } from "../src/data/testimonials.mjs";
import { logoSvg, HOT } from "./logo.mjs";

// Only quotes the client has approved go on the site
const testimonials = allTestimonials.filter((t) => t.confirmed);

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT_DIR, "src");
const BASE_URL = "https://www.genesisjr.com";

// Project SNGDNN logo, inline so it takes the page's text colour (works on dark and paper themes).
// Geometry lives in tools/logo.mjs (also writes Image/sngdnn-*.svg). Nav uses the compact version.
const LOGO = logoSvg({ main: "currentColor", accent: HOT, attrs: 'class="logo-svg" role="img" aria-label="Project SNGDNN"' });
const LOGO_COMPACT = logoSvg({ main: "currentColor", accent: HOT, project: false, attrs: 'class="logo-svg" role="img" aria-label="Project SNGDNN"' });

const SITE = {
  brand: `<a href="{{ROOT}}index.html" class="logo logo-mark" aria-label="SNGDNN, Genesis Jr — home">{{LOGO_COMPACT}}</a>`,
  nav: [["work", "Work"], ["about", "About"], ["services", "Services"], ["experience", "Experience"]],
  cta: "Start a project",
  ogImage: "Image/genesis.webp",
  siteName: "Genesis Jr",
  thanks: "Your project details were sent successfully. I'll get back to you within 24 hours.",
};

const read = (p) => fs.readFileSync(p, "utf8");
const partial = (name) => read(path.join(SRC, "partials", `${name}.html`));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/* ----------------------------------------------------------- components */

const caseStudies = projects.filter((p) => p.caseStudy);

// Ownership note, so client and employer work is credited and never looks claimed as mine
// p.owns names what belongs to the owner when it isn't a plain website (e.g. "platform and brand")
const ownerNote = (p) => {
  if (!p.owner) return "";
  const isBrand = p.categories.includes("branding");
  const what = isBrand ? "The brand belongs to its owner" : `The ${p.owns || "website and brand"} belong to their owners`;
  return `${p.via ? `Built while at ${p.via} for ${p.owner}.` : `${isBrand ? "Made" : "Built"} for ${p.owner}.`} ${what}; shown here only as a sample of my work.`;
};
const caseHref = (p) => `{{ROOT}}work/${p.slug}.html`;

function projectCard(p, { featured = false, delay = 0 } = {}) {
  // Brand kits (p.kit) are internal pages too, but labelled as kits rather than case studies
  const internal = !!p.caseStudy || !!p.kit;
  const href = p.caseStudy ? caseHref(p) : p.kit ? `{{ROOT}}${p.kit}` : p.href;
  const ext = internal ? "" : ` target="_blank" rel="noopener"`;
  const view = p.caseStudy ? "Read case study →" : p.kit ? "Open brand kit →" : p.linkLabel;
  const badge = p.caseStudy ? "Case study" : p.kit ? "Brand kit" : p.badge;
  // p.media: HTML cover for projects without a screenshot
  const media = p.media || `<img src="{{ROOT}}${p.image}" alt="${esc(p.alt)}" loading="lazy" width="${featured ? 2160 : 800}" height="${featured ? 1350 : 500}">`;
  // Type label on every card, so websites and branding read apart on the "All" view
  const isBrand = p.categories.includes("branding");
  const kind = p.kindLabel || (isBrand ? "Branding" : p.categories.includes("applications") ? "Web app" : "Website");
  const cls = ["project", "reveal", featured && "featured", delay && `reveal-d${delay}`, isBrand ? "project--brand" : "project--web"].filter(Boolean).join(" ");
  return `<a class="${cls}" href="${href}"${ext} data-category="${p.categories.join(" ")}">
                        <div class="project-media">
                            ${media}
                            <span class="project-kind">${kind}</span>
                            <span class="view">${view}</span>
                        </div>
                        <div class="project-info">
                            <div>
                                <h3>${p.title}</h3>
                                <p>${p.blurb}</p>${p.via ? `\n                                <p class="project-credit">Built at ${p.via}</p>` : ""}
                            </div>
                            <span class="project-year">${badge}</span>
                        </div>
                    </a>`;
}

function projectGrid(which) {
  const list = which === "featured" ? projects.filter((p) => p.featured) : projects;
  return `<div class="work-grid">\n                    ${list
    .map((p, i) => projectCard(p, { featured: i === 0, delay: i % 2 }))
    .join("\n\n                    ")}\n                </div>`;
}

const serviceHref = (sv) => `{{ROOT}}services/${sv.slug}.html`;

// Homepage "Selected work": large editorial features, one composition per project (street theme)
function featureList() {
  // Only the top 3 by feature.order appear on the homepage; the rest stay on /work
  const list = projects.filter((p) => p.feature).sort((a, b) => a.feature.order - b.feature.order).slice(0, 3);
  return list
    .map((p, i) => {
      const f = p.feature;
      const num = String(i + 1).padStart(2, "0");
      const href = p.caseStudy ? caseHref(p) : p.href;
      const summary = p.caseStudy ? p.caseStudy.subtitle : p.blurb;
      const live = p.caseStudy && p.caseStudy.live;
      const meta = [
        ["Category", f.kind],
        ["Role", f.role],
        f.stack.length ? ["Stack", f.stack.join(" · ")] : null,
      ].filter(Boolean);
      return `<article class="st-feature st-feature--${(i % 4) + 1} reveal" aria-labelledby="feat-${p.slug}">
                    <a class="st-feature-media" href="${href}" tabindex="-1" aria-hidden="true">
                        <img src="{{ROOT}}${p.heroImage || p.image}" alt="" loading="lazy" width="1600" height="1000">
                    </a>
                    <div class="st-feature-body">
                        <span class="st-feature-num" aria-hidden="true">${num}</span>
                        <h3 id="feat-${p.slug}" class="st-feature-title"><a href="${href}">${p.title.replace(/ — .*/, "")}</a></h3>
                        <p class="st-feature-summary">${summary}</p>
                        <dl class="st-meta">
                            ${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("\n                            ")}
                        </dl>
                        <div class="st-feature-links">
                            <a class="st-link" href="${href}">View case study <span aria-hidden="true">→</span></a>
                            ${live ? `<a class="st-link st-link--quiet" href="${live}" target="_blank" rel="noopener">Live site <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>` : ""}
                        </div>
                    </div>
                </article>`;
    })
    .join("\n\n                ");
}

function serviceGrid() {
  return `<div class="services-grid">\n${services
    .map(
      (sv, i) => `                    <a class="card service-card reveal${i % 2 ? " reveal-d1" : ""}" href="${serviceHref(sv)}">
                        <div class="icon"><ion-icon name="${sv.icon}"></ion-icon></div>
                        <span class="num">${String(i + 1).padStart(2, "0")}</span>
                        <h3>${sv.title}</h3>
                        <p>${sv.summary}</p>
                        <div class="tags">${sv.stack.slice(0, 5).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
                        <span class="more-link">Explore service →</span>
                    </a>`
    )
    .join("\n")}\n                </div>`;
}

function quoteCard(t, delay = 0, linkCase = true) {
  const p = linkCase && t.project && projects.find((x) => x.slug === t.project && x.caseStudy);
  const initials = t.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return `<figure class="card quote reveal${delay ? ` reveal-d${delay}` : ""}">
                        <span class="quote-mark" aria-hidden="true">“</span>
                        <blockquote>${t.quote}</blockquote>
                        <figcaption>
                            ${t.logo ? `<span class="quote-avatar quote-avatar--logo" aria-hidden="true"><img src="{{ROOT}}${t.logo}" alt="" width="46" height="46" loading="lazy"></span>` : `<span class="quote-avatar" aria-hidden="true">${initials}</span>`}
                            <span class="quote-who"><strong>${t.name}</strong><small>${t.role}</small></span>
                            ${p ? `<a class="more-link" href="${caseHref(p)}">Case study →</a>` : ""}
                        </figcaption>
                    </figure>`;
}

// The whole "What clients say" section — empty until at least one quote is confirmed
function testimonialSection() {
  if (!testimonials.length) return "";
  return `<section class="section">
            <div class="container">
                <div class="section-head reveal">
                    <span class="eyebrow">Kind words</span>
                    <h2>What clients say.</h2>
                </div>
                <div class="quotes">
                    ${testimonials.map((t, i) => quoteCard(t, i % 2)).join("\n                    ")}
                </div>
            </div>
        </section>`;
}

function caseStudyBody(p) {
  const cs = p.caseStudy;
  const next = caseStudies[(caseStudies.indexOf(p) + 1) % caseStudies.length];
  const story = cs.story; // Story-style case study: headline, big numbers, then a short narrative
  const stats = cs.stats
    ? `<div class="cs-stats${story ? " cs-stats--big" : ""}">${cs.stats.map(([n, l]) => `<div class="card"><strong class="grad-text">${n}</strong><span>${l}</span></div>`).join("")}</div>`
    : "";
  const gallery = cs.gallery
    ? `<section class="cs-section"><h3>${story ? "Screenshots" : "Inside the system"}</h3><div class="cs-gallery">${cs.gallery
        .map(([src, cap]) => `<figure><button type="button" data-zoom="{{ROOT}}${src}" aria-label="Enlarge: ${esc(cap)}"><img src="{{ROOT}}${src}" alt="${esc(cap)}" loading="lazy"></button><figcaption>${cap}</figcaption></figure>`)
        .join("")}</div></section>`
    : "";
  return `
        <article class="section case-page">
            <div class="container case-container">
                <a href="{{ROOT}}work.html" class="back-link reveal">← All work</a>
                <header class="case-head${story ? " case-head--story" : ""} reveal">
                    <span class="eyebrow">${story ? `Client: ${story.client || p.title}` : "Case study"}</span>
                    <h1>${story ? story.headline : p.title}</h1>
                    <p class="cs-sub">${story ? story.services : cs.subtitle}</p>
                    ${ownerNote(p) ? `<p class="cs-credit">${esc(ownerNote(p))}</p>` : ""}
                </header>
                <div class="case-hero reveal"><img src="{{ROOT}}${p.heroImage || p.image}" alt="${esc(p.alt)}" width="2160" height="1350"></div>
                <div class="cs-body">
                    ${story ? "" : `<div class="cs-meta">${cs.meta.map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join("")}</div>`}
                    ${stats}
                    ${story ? "" : gallery}
                    ${story ? (story.sections || cs.sections).map(([h, body]) => `<section class="cs-section cs-story"><h3>${h}</h3>${body}</section>`).join("\n                    ") : cs.sections.map(([h, body]) => `<section class="cs-section"><h3>${h}</h3>${body}</section>`).join("\n                    ")}
                    ${testimonials.filter((t) => t.project === p.slug).map((t) => `<section class="cs-section"><h3>What the client says</h3>${quoteCard(t, 0, false)}</section>`).join("")}${story ? gallery : ""}
                    ${cs.note ? `<p class="cs-note">${cs.note}</p>` : ""}
                    <div class="cs-actions">
                        ${cs.live ? `<a class="btn btn-primary" href="${cs.live}" target="_blank" rel="noopener">View live website <span class="arrow">↗</span></a>` : ""}
                        <a class="btn ${cs.live ? "btn-ghost" : "btn-primary"}" href="{{ROOT}}contact.html">Start a similar project</a>
                    </div>
                </div>
                <a class="next-case reveal" href="${caseHref(next)}">
                    <span>Next case study</span>
                    <strong>${next.title} →</strong>
                </a>
            </div>
        </article>`;
}

function serviceBody(sv) {
  const related = sv.projects.map((slug) => projects.find((p) => p.slug === slug)).filter(Boolean);
  const others = services.filter((x) => x !== sv);
  return `
        <section class="page-hero service-hero">
            <div class="container">
                <a href="{{ROOT}}services.html" class="back-link reveal">← All services</a>
                <div class="service-hero-row reveal">
                    <span class="service-hero-icon"><ion-icon name="${sv.icon}"></ion-icon></span>
                    <span class="eyebrow">Service</span>
                </div>
                <h1 class="reveal reveal-d1">${sv.title}</h1>
                <p class="page-lead reveal reveal-d2">${sv.lead}</p>
                <div class="hero-actions reveal reveal-d3" style="margin-top:28px">
                    <a href="{{ROOT}}contact.html" class="btn btn-primary">Start a project <span class="arrow">→</span></a>
                    <a href="{{ROOT}}work.html" class="btn btn-ghost">See my work</a>
                </div>
            </div>
        </section>

        <section class="section" style="padding-top:0">
            <div class="container">
                <div class="section-head reveal">
                    <span class="eyebrow">What's included</span>
                    <h2>Everything you need,<br>handled end to end.</h2>
                </div>
                <div class="include-grid">
                    ${sv.includes.map(([h, d], i) => `<div class="card include reveal${i % 3 ? ` reveal-d${i % 3}` : ""}"><span class="num">${String(i + 1).padStart(2, "0")}</span><h3>${h}</h3><p>${d}</p></div>`).join("\n                    ")}
                </div>
                <div class="stack-row reveal">
                    <span class="col-title">Tools I use</span>
                    <div class="tags">${sv.stack.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
                </div>
            </div>
        </section>
${
  related.length
    ? `
        <section class="section">
            <div class="container">
                <div class="section-head section-head-row reveal">
                    <div>
                        <span class="eyebrow">Related work</span>
                        <h2>Built with this service.</h2>
                    </div>
                    <a href="{{ROOT}}work.html" class="more-link">All work →</a>
                </div>
                <div class="work-grid">
                    ${related.map((p, i) => projectCard(p, { delay: i % 2 })).join("\n                    ")}
                </div>
            </div>
        </section>`
    : ""
}

        <section class="section">
            <div class="container">
                <div class="section-head reveal">
                    <span class="eyebrow">Other services</span>
                    <h2>Need something else?</h2>
                </div>
                <div class="other-services">
                    ${others.map((x) => `<a class="card other-service reveal" href="${serviceHref(x)}"><span class="submenu-icon"><ion-icon name="${x.icon}"></ion-icon></span><span><strong>${x.title}</strong><small>${x.short}</small></span><span class="arrow" aria-hidden="true">→</span></a>`).join("\n                    ")}
                </div>
            </div>
        </section>

        {{> cta}}`;
}

/* --------------------------------------------------------------- layout */

function servicesMenu(cur, activeService) {
  const items = services
    .map(
      (sv) => `<a href="${serviceHref(sv)}" class="submenu-item${sv.slug === activeService ? " active" : ""}"${sv.slug === activeService ? ' aria-current="page"' : ""}>
                                <span class="submenu-icon"><ion-icon name="${sv.icon}"></ion-icon></span>
                                <span><strong>${sv.title}</strong><small>${sv.short}</small></span>
                            </a>`
    )
    .join("\n                            ");
  // Rates & plans is deliberately left out of the header: visitors see the work first.
  // It's reached from the footer, the Services page and the Contact page.
  return `<li class="has-menu">
                        <a href="{{ROOT}}services.html"${cur ? ' class="active"' : ""}${cur && !activeService ? ' aria-current="page"' : ""}>Services</a>
                        <button type="button" class="submenu-toggle" aria-expanded="false" aria-controls="menu-services" aria-label="Show services"><ion-icon name="chevron-down-outline"></ion-icon></button>
                        <div class="submenu" id="menu-services">
                            ${items}
                            <a href="{{ROOT}}services.html" class="submenu-all">All services &amp; how I work <span aria-hidden="true">→</span></a>
                        </div>
                    </li>`;
}

function header(active, activeService) {
  const links = SITE.nav
    .map(([key, label]) => {
      // The Design gallery is reached from Work, so it highlights Work
      const cur = key === active || (key === "work" && active === "design");
      if (key === "services") return servicesMenu(cur, activeService);
      return `<li><a href="{{ROOT}}${key}.html"${cur ? ' class="active" aria-current="page"' : ""}>${label}</a></li>`;
    })
    .join("\n                    ");
  return `<header class="site-header">
        <div class="container nav">
            ${SITE.brand}

            <nav aria-label="Primary">
                <ul class="nav-links">
                    ${links}
                    <li class="nav-links-cta"><a href="{{ROOT}}contact.html" class="btn btn-primary">${SITE.cta}</a></li>
                </ul>
            </nav>

            <a href="{{ROOT}}contact.html" class="btn btn-primary nav-cta">${SITE.cta}</a>
            <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span></button>
        </div>
    </header>`;
}

function render(content, root) {
  // includes first, then generated blocks, then ROOT last so everything gets the prefix
  let html = content.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partial(n));
  html = html.replace(/\{\{FORM ([^}]+)\}\}/g, (_, source) => partial("intake-form").replace("{{SOURCE}}", esc(source.trim())));
  html = html.replace(/\{\{PROJECTS (all|featured)\}\}/g, (_, w) => projectGrid(w));
  html = html.replace(/\{\{SERVICES\}\}/g, () => serviceGrid());
  html = html.replace(/\{\{FEATURES\}\}/g, () => featureList());
  html = html.replace(/\{\{TESTIMONIALS\}\}/g, () => testimonialSection());
  html = html.replace(/\{\{PROJECT_COUNT\}\}/g, `${projects.length}`);
  html = html.replace(/\{\{YEAR\}\}/g, String(new Date().getFullYear()));
  html = html.replace(/\{\{LOGO_COMPACT\}\}/g, LOGO_COMPACT).replace(/\{\{LOGO\}\}/g, LOGO);
  return cleanUrls(html.replace(/\{\{ROOT\}\}/g, root));
}

/**
 * Pretty URLs: every internal page link becomes extensionless and hash-free
 *   /index.html → /    /work.html → /work    /work/atms.html → /work/atms
 * vercel.json sets cleanUrls so these resolve, and old .html addresses redirect.
 */
function cleanUrls(html) {
  return html.replace(/(\shref=")(\/[^"#]*?)\.html(#[^"]*)?"/g, (_, attr, p) => {
    let url = p.replace(/(^|\/)index$/, "$1");
    if (url.length > 1) url = url.replace(/\/$/, "");
    return `${attr}${url || "/"}"`;
  });
}

function page({ title, description, nav, service, jsonld, urlPath, theme, ogImage }, body) {
  const url = `${BASE_URL}${urlPath}`;
  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="${theme === "paper" ? "#efece4" : theme === "street" ? "#141414" : "#0a0a0c"}">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/svg+xml" href="{{ROOT}}Image/sngdnn-favicon.svg">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${SITE.siteName}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${BASE_URL}/${ogImage || SITE.ogImage}">
    <meta property="og:url" content="${url}">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ROOT}}assets/site.min.css">
    <link rel="stylesheet" href="{{ROOT}}assets/street.min.css">
    <script src="{{ROOT}}assets/boot.min.js"></script>
${jsonld ? `\n    <script type="application/ld+json">\n${JSON.stringify(jsonld, null, 4).replace(/^/gm, "    ")}\n    </script>\n` : ""}</head>

<body class="theme-street${theme && theme !== "street" ? ` theme-${theme}` : ""}">
    <a class="skip-link" href="#top">Skip to content</a>
    <div class="bg-glow" aria-hidden="true"></div>
    <div class="bg-grid" aria-hidden="true"></div>

    ${header(nav, service)}

    <main id="top" tabindex="-1">
${body}
    </main>

${partial("footer")}
${partial("modals").replace("{{THANKS}}", SITE.thanks)}
    <script src="{{ROOT}}assets/site.min.js" defer></script>
    <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
</body>
</html>
`;
  // Root-absolute paths, so links and assets resolve the same from any URL depth
  return render(doc, "/");
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

const pagesDir = path.join(SRC, "pages");
for (const f of fs.readdirSync(pagesDir).filter((f) => f.endsWith(".html"))) {
  const name = f.replace(/\.html$/, "");
  const { meta, body } = parse(path.join(pagesDir, f));
  write(f, page({ nav: name, ...meta, urlPath: name === "index" ? "/" : `/${name}` }, body));
}

// Brand kits for client branding work: src/pages/brand/<slug>.html → /brand/<slug>
const brandDir = path.join(pagesDir, "brand");
if (fs.existsSync(brandDir)) {
  for (const f of fs.readdirSync(brandDir).filter((f) => f.endsWith(".html"))) {
    const name = f.replace(/\.html$/, "");
    const { meta, body } = parse(path.join(brandDir, f));
    write(`brand/${f}`, page({ nav: "design", ...meta, urlPath: `/brand/${name}` }, body));
  }
}

for (const p of caseStudies) {
  write(
    `work/${p.slug}.html`,
    page({ title: `${p.title} — Case Study | Genesis Jr`, description: p.caseStudy.subtitle, nav: "work", urlPath: `/work/${p.slug}` }, caseStudyBody(p))
  );
}

for (const sv of services) {
  write(
    `services/${sv.slug}.html`,
    page({ title: `${sv.title} | Genesis Jr`, description: sv.summary, nav: "services", service: sv.slug, urlPath: `/services/${sv.slug}` }, serviceBody(sv))
  );
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

// Minify CSS and JS. Run through npx because node_modules is committed in this repo.
const minified = ["site.css", "street.css", "site.js", "boot.js"];
execSync(
  `npx --yes esbuild@0.25.10 ${minified.map((f) => `assets/${f}`).join(" ")} --minify --charset=utf8 --legal-comments=none --outdir=assets --out-extension:.css=.min.css --out-extension:.js=.min.js --log-level=warning`,
  { cwd: ROOT_DIR, stdio: "inherit" }
);
written.push(...minified.map((f) => `assets/${f.replace(/\.(css|js)$/, ".min.$1")}`));

console.log(`Built ${written.length} files:\n  ${written.join("\n  ")}`);
