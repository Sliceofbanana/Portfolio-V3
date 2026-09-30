// Single source of truth for projects and case studies.
// Image paths are relative to the site root; the build adds the right prefix per page.
// Categories: development | design | applications

const cols = (items) =>
  `<div class="cs-cols">${items
    .map(([h, list]) => `<div class="card"><h4>${h}</h4><ul>${list.map((li) => `<li>${li}</li>`).join("")}</ul></div>`)
    .join("")}</div>`;
const tags = (list) => `<div class="tags">${list.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`;

export const projects = [
  {
    slug: "atms",
    title: "ATMS — Agila Tax Management System",
    short: "ATMS — Agila",
    blurb: "Enterprise operations platform · Next.js + Prisma + PostgreSQL",
    tagline: "Enterprise operations platform",
    image: "Image/atms/portals.webp",
    alt: "ATMS main dashboard showing all enterprise portals",
    categories: ["development", "applications"],
    featured: true,
    caseStudy: {
      subtitle: "An all-in-one operations platform for a Philippine tax and accounting firm — one system of record for sales, accounting, tax compliance, HR, payroll and field liaison work.",
      live: null,
      note: "Internal system, not publicly accessible. Screenshots were taken from a local demo instance running on sample data. No real client information is shown.",
      meta: [["Client", "Agila Tax Management Services"], ["Industry", "Tax, accounting & compliance"], ["Role", "Lead developer · Feb – Jul 2026"]],
      stats: [["146", "Screens across 10 portals"], ["261", "API endpoints"], ["118", "Database models"], ["5", "Connected apps shipped"]],
      gallery: [
        ["Image/atms/accounting.webp", "Accounting & finance — collections, outstanding balances and payments awaiting confirmation"],
        ["Image/atms/compliance.webp", "Compliance portal — BIR and government filing deadlines with progress per tax type"],
        ["Image/atms/invoices.webp", "Invoices — auto-numbered billing with status tracking, import and print"],
        ["Image/atms/hr.webp", "HR portal — attendance, pending requests, payroll periods and headcount"],
        ["Image/atms/tasks.webp", "Task management — department kanban boards with routed workflows"],
      ],
      sections: [
        ["The challenge", `<p>Agila's teams ran leads, quotations, billing, BIR filings, payroll and government liaison runs across spreadsheets and a legacy PHP portal. Every department kept its own copy of client data, deadlines lived in people's heads, and management had no single view of what was due, paid or stuck.</p><p>The firm needed one platform where each department gets its own portal, every client has one record, and access is controlled per role and per app.</p>`],
        ["What I built", cols([
          ["Sales & lead center", ["Leads, quotations, job orders and contracts", "Monthly and one-time service plans, packages and promos", "Commissions, after-sales and sales reports"]],
          ["Accounting & finance", ["Invoices, payments and allocations with auto-numbering", "Chart of accounts, journal entries and client funds", "Petty cash, cheque monitoring and financial reports"]],
          ["Tax compliance", ["Per-client VAT, percentage tax, EWT, compensation withholding and income tax", "SSS, PhilHealth, Pag-IBIG, GIS and SEC AFS tracking", "Sales and expense books with working papers"]],
          ["HR & payroll", ["Employee records, contracts and work schedules", "Timesheets, leave, overtime and holidays", "Payroll periods, PDF payslips, cash advances and government loans"]],
          ["Liaison & task management", ["Task templates with routed subtasks per department", "Liaison dashboards and government-office directory", "Task history, conversations and account-officer monitoring"]],
          ["Client gateway & IT", ["Client accounts, users and API keys", "Announcements, notifications and full activity log", "IT tickets, asset register and access-request approvals"]],
        ])],
        ["The wider ecosystem", `<ul>
          <li><strong>ATMS Hub</strong> — the first prototype (Feb–Mar 2026) that proved the portal model before the full rebuild.</li>
          <li><strong>Client Portal</strong> — lets Agila's clients manage their own employees, attendance, leave and payroll coordination.</li>
          <li><strong>Agila Business Academy</strong> — an internal learning platform with video series, exams, certificates and a leaderboard.</li>
          <li><strong>Operations Portal</strong> — team workspaces for BIR, mayor's permit and payroll engagements, with tickets, task dependencies and tax filing slots.</li>
          <li><strong>Liaison Task Order tracker</strong> — a lightweight app for creating task orders and looking up their status by number.</li>
        </ul>`],
        ["Engineering highlights", `<ul>
          <li><strong>Modular monolith</strong> on the Next.js App Router, with each business module owning its own routes, API and components.</li>
          <li><strong>Role-based access</strong> with BetterAuth, plus per-employee app permissions, so each department only sees its own portals.</li>
          <li><strong>Zod validation on every API route</strong> and Prisma transactions for sequential codes like <code>INV-YYYY-XXXX</code>.</li>
          <li><strong>Domain-split Prisma schema</strong> on PostgreSQL covering accounting, HR, sales, compliance and services.</li>
          <li><strong>Non-blocking activity logging and notifications</strong>, PDF payslips and reports, Excel import/export and Cloudinary uploads.</li>
          <li><strong>Dockerised</strong> for local work and deployed on Vercel, with 540+ commits from a small team where I wrote the majority.</li>
        </ul>`],
        ["Tech stack", tags(["Next.js 16", "React 19", "TypeScript", "Prisma", "PostgreSQL", "BetterAuth", "Zod", "Tailwind CSS", "Recharts", "React-PDF", "Cloudinary", "Docker", "Vercel"])],
      ],
    },
  },
  {
    slug: "mqprints",
    title: "MQ Printing Services",
    blurb: "Full-stack · WordPress + Next.js + Supabase",
    tagline: "Full-stack web + order system",
    image: "Image/mq.webp",
    alt: "MQ Printing Services website",
    categories: ["development", "design"],
    featured: true,
    caseStudy: {
      subtitle: "End-to-end website and digital infrastructure for a Cebu print shop — from discovery call to DevOps.",
      live: "https://mqprintsph.com/",
      meta: [["Client", "MQ Printing Services, Cebu"], ["Industry", "Printing / Local business"], ["Role", "Full ownership"]],
      stats: [["8 wks", "Full launch"], ["3×", "Online inquiries, month one"], ["40+", "Inquiries / month captured"], ["<2s", "Page load"]],
      sections: [
        ["The challenge", `<p>MQ relied on social media for inquiries, had no local-SEO-optimised site, no structured lead capture and no clear service breakdown. They needed a professional presence, a better inquiry flow and infrastructure that could scale.</p>`],
        ["How it was built", cols([
          ["WordPress — marketing layer", ["Core marketing site with customised Elementor and custom plugin extensions", "Dynamic service sections, tuned for performance"]],
          ["Next.js — app layer", ["Order system built for scalability", "Frontend structured for performance"]],
          ["Supabase — backend", ["Data handling and storage", "Structured form data and backend management"]],
          ["DevOps & maintenance", ["Hostinger + Vercel, env vars, DNS, SSL", "Uptime monitoring, SEO and performance tuning"]],
        ])],
        ["Tech stack", tags(["WordPress", "Elementor", "Next.js", "Supabase", "Hostinger", "Vercel"])],
        ["Results", `<ul><li><strong>70% less reliance</strong> on social media for leads.</li><li><strong>Improved local SEO rankings</strong> for key services.</li><li><strong>Mobile traffic up 55%.</strong></li><li><strong>Hybrid approach</strong> — WordPress for marketing, Next.js for performance.</li></ul>`],
      ],
    },
  },
  {
    slug: "bodega",
    title: "Bodega Coworking Café",
    blurb: "Design + development · Booking & payments",
    tagline: "Brand-led site + bookings",
    image: "Image/bodega.webp",
    alt: "Bodega Coworking website",
    categories: ["development", "design"],
    featured: true,
    caseStudy: {
      subtitle: "Building a coworking brand's first website — with event, room and office bookings — from scratch.",
      live: "https://bodegacoworking.com/",
      meta: [["Client", "Bodega Coworking Café, Cebu"], ["Industry", "Coworking & Hospitality"], ["Role", "Design + Full-Stack"]],
      stats: [["6", "Core pages"], ["2", "Booking systems"], ["100%", "Mobile responsive"], ["0 → 1", "First digital presence"]],
      sections: [
        ["The challenge", `<p>As a new, growing coworking brand, Bodega needed its first official website to establish credibility, let customers book and pay for events and meeting rooms, showcase private-office availability, and reflect a stylish, playful, community-driven identity. There was no existing platform — everything was designed and built from zero.</p>`],
        ["What I delivered", cols([
          ["Information architecture", ["Six core pages: Home, About, Membership, Events, Meeting Rooms, Private Offices", "Clean top-bar navigation and organised event layouts"]],
          ["Event booking & payments", ["Dedicated events section for talks, socials and workshops", "Integrated booking and online payment"]],
          ["Rooms & private offices", ["Hourly meeting-room reservations with payment", "Private office listings with inquiry/booking flow"]],
          ["Design & mobile-first build", ["Modern, playful brand-led UI designed in Figma", "Fully responsive across devices"]],
        ])],
        ["Tech stack", tags(["HTML5", "CSS3", "JavaScript", "PHP", "MySQL", "Payment gateway", "Figma", "cPanel"])],
        ["Results", `<ul><li><strong>From zero to full platform</strong> — Bodega's first-ever digital presence.</li><li><strong>Streamlined bookings</strong> — events and rooms reserved online.</li><li><strong>Community growth</strong> — clearer event visibility improved attendance.</li><li><strong>Scalable foundation</strong> — ready for new branches and services.</li></ul>`],
      ],
    },
  },
  {
    slug: "spine",
    title: "Spine & Orthopaedics Cebu",
    short: "Spine & Ortho Cebu",
    blurb: "Web development · Healthcare",
    tagline: "Healthcare website",
    image: "Image/SOC.webp",
    alt: "Spine and Orthopaedics Cebu website",
    categories: ["development"],
    caseStudy: {
      subtitle: "A responsive, content-rich website connecting patients with orthopaedic specialists across Cebu.",
      live: "https://spineandorthocebu.com/",
      meta: [["Client", "Spine & Orthopaedics Cebu"], ["Industry", "Healthcare"], ["Role", "Web Development"]],
      sections: [
        ["The challenge", `<p>The clinic network needed a trustworthy online presence that showcases its specialists, explains conditions and services, makes clinic locations easy to find, and supports patient education through blogs and foundation initiatives.</p>`],
        ["What I built", cols([
          ["Specialist profiles", ["Dedicated doctor pages with bios and specialties", "Clear CTAs to schedule consultations"]],
          ["Conditions & services", ["Informational sections on treatments offered", "Navigation built for quick access to health info"]],
          ["Clinic locations", ["Affiliated hospitals and clinic addresses", "“Talk to Us” inquiry paths"]],
          ["Education & outreach", ["Blog and foundation pages", "Responsive, accessible layouts"]],
        ])],
        ["Results", `<ul><li><strong>Professional online presence</strong> that builds patient trust.</li><li><strong>Improved accessibility</strong> — doctors, services and locations are easy to find.</li><li><strong>Ongoing educational value</strong> through blogs and foundation content.</li><li><strong>More inquiries</strong> through clear contact pathways.</li></ul>`],
      ],
    },
  },
  {
    slug: "acesphils",
    title: "Acesphils Hardware",
    blurb: "Web design · Retail",
    tagline: "Retail web design",
    image: "Image/screenshot-2025-03-04-084038-67c64c1e6004f.webp",
    heroImage: "Image/Aces.webp",
    alt: "Acesphils hardware store website",
    categories: ["design"],
    caseStudy: {
      subtitle: "A modern, product-first redesign for a Philippine hardware and construction supplier.",
      live: "https://acesphils.com/",
      meta: [["Client", "Acesphils / Aces Depot"], ["Industry", "Retail & Construction"], ["Role", "UI/UX Design"]],
      sections: [
        ["The challenge", `<p>The previous site was outdated, lacked hierarchy and didn't highlight the store's wide product range. Acesphils needed a professional look that builds trust, clearer navigation to products, and a structure that could grow into e-commerce.</p>`],
        ["What I designed", cols([
          ["Modern, professional look", ["Strong visual hierarchy for easy browsing", "Consistent brand colours and typography"]],
          ["Better navigation", ["Structured menus for categories and services", "Clear inquiry CTAs across the site"]],
          ["Future-ready", ["Flexible product cards for easy updates", "Structure prepared for e-commerce"]],
          ["Responsive", ["Layouts designed for desktop, tablet and mobile", "Organised About, Products and Contact sections"]],
        ])],
        ["Results", `<ul><li><strong>Modern web identity</strong> that reflects a reliable hardware brand.</li><li><strong>Improved usability</strong> — customers find products faster.</li><li><strong>Stronger trust</strong> through a clean, consistent design.</li><li><strong>Scalable foundation</strong> for online catalogues and e-commerce.</li></ul>`],
      ],
    },
  },
  {
    slug: "kitaspaces",
    title: "Kita Spaces",
    blurb: "Web development · Coworking café & space",
    image: "Image/screenshot-2025-12-01-100126-692cf705826c2.webp",
    alt: "Kita Spaces website",
    categories: ["development"],
    href: "https://kitaspaces.com/",
    linkLabel: "Visit site ↗",
    badge: "Live",
  },
  {
    slug: "buoywatch",
    title: "Buoy Watch — Thesis",
    blurb: "Mobile application · Flutter",
    image: "Image/mobile.webp",
    alt: "Buoy Watch mobile application",
    categories: ["applications"],
    href: "https://github.com/Sliceofbanana/buoy_watch.git",
    linkLabel: "View on GitHub ↗",
    badge: "GitHub",
  },
  {
    slug: "first-portfolio",
    title: "First Personal Portfolio",
    blurb: "Design + development",
    image: "Image/portfolio.webp",
    alt: "First personal portfolio",
    categories: ["development", "design"],
    href: "https://sliceofbanana.github.io/Genesis-Portfolio/",
    linkLabel: "Visit site ↗",
    badge: "Live",
  },
];
