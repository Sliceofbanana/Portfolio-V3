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
    feature: { order: 5, kind: "Operations platform", role: "Lead developer", stack: ["Next.js", "React", "TypeScript", "Prisma", "PostgreSQL"] },
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
      story: {
        client: "Agila Tax Management Services",
        headline: "One platform for every department of a tax firm",
        services: "Web Application Development • System Architecture • Internal Tools",
      },
      stats: [["146", "Screens across 10 portals"], ["261", "API endpoints"], ["118", "Database models"], ["5", "Connected apps shipped"]],
      gallery: [
        ["Image/atms/accounting.webp", "Accounting & finance — collections, outstanding balances and payments awaiting confirmation"],
        ["Image/atms/compliance.webp", "Compliance portal — BIR and government filing deadlines with progress per tax type"],
        ["Image/atms/invoices.webp", "Invoices — auto-numbered billing with status tracking, import and print"],
        ["Image/atms/hr.webp", "HR portal — attendance, pending requests, payroll periods and headcount"],
        ["Image/atms/tasks.webp", "Task management — department kanban boards with routed workflows"],
      ],
      sections: [
        ["Project Overview", `<p>ATMS is an all-in-one operations platform for Agila Tax Management Services, a Philippine tax and accounting firm. It gives sales, accounting, tax compliance, HR, payroll and field liaison work one system of record.</p>`],
        ["The Challenge", `<p>Agila's teams ran leads, quotations, billing, BIR filings, payroll and government liaison runs across spreadsheets and a legacy PHP portal. Every department kept its own copy of client data, deadlines lived in people's heads, and management had no single view of what was due, paid or stuck.</p><p>The firm needed one platform where each department gets its own portal, every client has one record, and access is controlled per role and per app.</p>`],
        ["My Role", `<p>Lead developer from March to August 2026, on a small team:</p>
          <ul><li>Leading development of the full platform</li><li>Building the portals for sales, accounting, compliance, HR and liaison work</li><li>Setting up access control so each department only sees its own portals</li><li>Writing the majority of the code across 540+ commits</li></ul>`],
        ["The Process", `<ul><li><strong>Prove the idea first.</strong> ATMS Hub, a prototype from February to March 2026, tested the portal model before the full rebuild.</li><li><strong>Give each department its own module.</strong> Every business area owns its routes, API and components inside one codebase.</li><li><strong>Control who sees what.</strong> Roles and per-employee app permissions keep each team in its own portals.</li><li><strong>Grow around the core.</strong> Client, learning, operations and liaison apps were added around the main platform.</li></ul>`],
        ["The Solution", cols([
          ["Sales & lead center", ["Leads, quotations, job orders and contracts", "Monthly and one-time service plans, packages and promos", "Commissions, after-sales and sales reports"]],
          ["Accounting & finance", ["Invoices, payments and allocations with auto-numbering", "Chart of accounts, journal entries and client funds", "Petty cash, cheque monitoring and financial reports"]],
          ["Tax compliance", ["Per-client VAT, percentage tax, EWT, compensation withholding and income tax", "SSS, PhilHealth, Pag-IBIG, GIS and SEC AFS tracking", "Sales and expense books with working papers"]],
          ["HR & payroll", ["Employee records, contracts and work schedules", "Timesheets, leave, overtime and holidays", "Payroll periods, PDF payslips, cash advances and government loans"]],
          ["Liaison & task management", ["Task templates with routed subtasks per department", "Liaison dashboards and government-office directory", "Task history, conversations and account-officer monitoring"]],
          ["Client gateway & IT", ["Client accounts, users and API keys", "Announcements, notifications and full activity log", "IT tickets, asset register and access-request approvals"]],
        ]) + `<h4>The wider ecosystem</h4><ul>
          <li><strong>ATMS Hub</strong> — the first prototype (Feb–Mar 2026) that proved the portal model before the full rebuild.</li>
          <li><strong>Client Portal</strong> — lets Agila's clients manage their own employees, attendance, leave and payroll coordination.</li>
          <li><strong>Agila Business Academy</strong> — an internal learning platform with video series, exams, certificates and a leaderboard.</li>
          <li><strong>Operations Portal</strong> — team workspaces for BIR, mayor's permit and payroll engagements, with tickets, task dependencies and tax filing slots.</li>
          <li><strong>Liaison Task Order tracker</strong> — a lightweight app for creating task orders and looking up their status by number.</li>
        </ul><h4>Engineering highlights</h4><ul>
          <li><strong>Modular monolith</strong> on the Next.js App Router, with each business module owning its own routes, API and components.</li>
          <li><strong>Role-based access</strong> with BetterAuth, plus per-employee app permissions, so each department only sees its own portals.</li>
          <li><strong>Zod validation on every API route</strong> and Prisma transactions for sequential codes like <code>INV-YYYY-XXXX</code>.</li>
          <li><strong>Domain-split Prisma schema</strong> on PostgreSQL covering accounting, HR, sales, compliance and services.</li>
          <li><strong>Non-blocking activity logging and notifications</strong>, PDF payslips and reports, Excel import/export and Cloudinary uploads.</li>
          <li><strong>Dockerised</strong> for local work and deployed on Vercel, with 540+ commits from a small team where I wrote the majority.</li>
        </ul><h4>Built with</h4>` + tags(["Next.js 16", "React 19", "TypeScript", "Prisma", "PostgreSQL", "BetterAuth", "Zod", "Tailwind CSS", "Recharts", "React-PDF", "Cloudinary", "Docker", "Vercel"])],
        ["Results &amp; Learnings", `<p>The platform shipped with 146 screens across 10 portals, 261 API endpoints and 118 database models, with five connected apps around it. Each department now has its own portal, and every client has one record.</p>
          <p><strong>What I learned:</strong> proving the portal model with a small prototype made it much safer to commit to a full rebuild.</p>`],
      ],
    },
  },
  {
    slug: "mqprints",
    feature: { order: 1, kind: "Website + order system", role: "Full ownership", stack: ["WordPress", "PHP", "Custom plugin", "MySQL"] },
    title: "MQ Printing Services",
    blurb: "WordPress · Custom portal, ordering & quotes",
    tagline: "WordPress site + custom ordering plugin",
    image: "Image/mq-2026.jpg",
    alt: "MQ Printing Services website",
    categories: ["development", "design"],
    featured: true,
    caseStudy: {
      subtitle: "Website, customer portal and online ordering that made a Cebu print shop easier to find and order from.",
      live: "https://mqprintsph.com/",
      stats: [["153%", "More clicks from Google, 28 days vs. the previous 28 (Nov 2026)"], ["93%", "More Google impressions over the same period"]],
      story: {
        headline: "Making printing in Cebu easier to find and order",
        services: "Website Design &amp; Development • Customer Portal • Online Ordering &amp; Quotes",
        sections: [
          ["Project Overview", `<p>MQ Printing Services is a 24-hour print shop in Cebu City. I designed and built their website and the online system behind it, so customers can send in print jobs at any hour and the team can run those jobs from one place.</p>`],
          ["The Challenge", `<p>MQ's goal was simple: make printing easy. Customers should be able to skip the queue, upload their documents and get their prints delivered. But inquiries still depended on social media. There was no website built to show up in local search, no clear breakdown of services and no structured way to capture a lead.</p>`],
          ["My Role", `<p>I owned the project from start to finish:</p>
                        <ul><li>Planning the website and system with the owner</li><li>Designing the layouts and user experience</li><li>Building the front end and back end</li><li>Setting up the domain, hosting and launch</li><li>Handling updates, backups and uptime monitoring</li></ul>`],
          ["The Process", `<ul><li><strong>Understand the vision.</strong> I started with what Michael, the owner, wanted printing with MQ to feel like.</li><li><strong>Make it visible early.</strong> I shared clear layouts so Michael could react to something real.</li><li><strong>Build in phases.</strong> Each phase came with an update, so there were no surprises.</li><li><strong>Improve along the way.</strong> I suggested changes wherever the plan needed help.</li></ul>`],
          ["The Solution", `<p>One system for both sides of the business:</p>
                        <ul><li><strong>For customers:</strong> a website built for local search, clear service pages, file upload, online ordering and quote requests, plus an account for tracking orders and reordering.</li><li><strong>For the team:</strong> the MQ Portal, which brings job orders, sales, production and the time clock into one place, with staff pricing, approving and updating orders from one dashboard.</li></ul>`],
          ["Results &amp; Learnings", `<p>The results are showing up on Google. In the latest 28 days, the site earned 114 clicks and 10.7K impressions, and people are finding MQ through searches like “printing services near me” and “printing services cebu”.</p>
                        <figure class="cs-proof"><button type="button" data-zoom="{{ROOT}}Image/mq-search-console.png" aria-label="Enlarge: Google Search Console performance for mqprintsph.com"><img src="{{ROOT}}Image/mq-search-console.png" alt="Google Search Console graph for mqprintsph.com: clicks and impressions climbing from February to November 2026, with 436 total clicks and 34.1K impressions" width="1531" height="513" loading="lazy"></button><figcaption>Google Search Console, February to November 2026</figcaption></figure>
                        <p>It's reaching real customers too. One had messaged more than 15 print shops in a single night, and MQ was the only one that replied. After trying the website and online ordering and showing them to their own boss, they sent MQ this:</p>
                        <blockquote class="cs-pull">“Tell your boss. He/She is way ahead of his/her competitors.”<cite>An MQ Prints customer</cite></blockquote>
                        <p><strong>What I learned:</strong> showing clear layouts early made it much easier for a client to say what they really wanted. And for customers, being easy to reach and easy to order from is what stands out.</p>`],
        ],
      },
      gallery: [
        ["Image/mq-services.jpg", "Services page, including online ordering"],
        ["Image/mq-portal.jpg", "MQ Portal sign-in, where the team manages job orders, sales and production"],
      ],
    },
  },
  {
    slug: "wl-construction",
    feature: { order: 2, kind: "Brand identity + company profile", role: "Design consultant", stack: [] },
    title: "WL Construction",
    blurb: "Brand identity · Construction",
    tagline: "Brand guidelines + company profile",
    image: "Image/design/wlc-cover.webp",
    alt: "WL Construction brand guidelines cover",
    categories: ["design"],
    caseStudy: {
      subtitle: "Brand guidelines and a company profile for a Cebu builder, from the logo to the materials clients see.",
      live: null,
      story: {
        headline: "Giving a Cebu builder a brand as solid as its work",
        services: "Brand Identity • Graphic Design • Company Profile • Social Media",
      },
      gallery: [
        ["Image/design/wlc-logo.webp", "Primary logo: a W shaped like a roof over a small window"],
        ["Image/design/wlc-logo-variations.webp", "Logo variations for different backgrounds"],
        ["Image/design/wlc-colour.webp", "Colour palette: deep navy, construction gold, soft white and charcoal grey"],
        ["Image/design/wlc-profile.webp", "Company profile cover"],
        ["Image/design/wlc-services.webp", "Company profile: services offered"],
        ["Image/design/wlc-project.webp", "Company profile: project showcase"],
        ["Image/design/wlc-business-card.webp", "Business cards"],
      ],
      sections: [
        ["Project Overview", `<p>WL Construction is a Cebu builder working on residential, commercial and institutional developments. As design consultant through Project SNGDNN, I created its brand guidelines and the company materials built from them.</p>`],
        ["The Challenge", `<p>A builder earns work on trust, and clients form an opinion from everything they see before a project starts. WL Construction needed one clear identity that could carry across its logo, company profile, social media and business cards, and present services from residential builds to interior fit-outs in a consistent way.</p>`],
        ["My Role", `<p>Design consultant through Project SNGDNN, in 2026:</p>
          <ul><li>Designing the logo and its variations</li><li>Setting the colours, typography, pattern and imagery direction</li><li>Putting it all together as brand guidelines</li><li>Designing the company profile</li><li>Applying the brand to social posts and business cards</li></ul>`],
        ["The Process", `<ul><li><strong>Start with the mark.</strong> The logo is a W shaped like a roof over a small window, so it reads as a builder at a glance.</li><li><strong>Build the system.</strong> Navy and construction gold, Inter for type, a repeating W pattern and a direction for imagery.</li><li><strong>Document the rules.</strong> The brand guidelines show how each element should be used.</li><li><strong>Apply it everywhere.</strong> The profile, social posts and business cards were all built from that system.</li></ul>`],
        ["The Solution", cols([
          ["Brand identity", ["Primary logo and variations", "Works on gold, navy and white backgrounds"]],
          ["Visual system", ["Colour palette and typography", "Repeating W pattern and imagery direction"]],
          ["Company profile", ["Six service areas, each with its own photo", "Project showcases of completed work"]],
          ["Everyday materials", ["Social media posts, including hiring", "Business cards"]],
        ])],
        ["Results &amp; Learnings", `<ul><li><strong>One consistent identity</strong> across the logo, profile, social posts and business cards.</li><li><strong>A company profile ready to present</strong> to prospective clients.</li><li><strong>A reusable system</strong> that future materials can follow.</li></ul>
          <p><strong>What I learned:</strong> a logo is only the start. The real value is in the rules that keep every later piece looking like the same company.</p>
          <p><a class="inline more-link" href="{{ROOT}}design.html">See the full series on my Design page →</a></p>`],
      ],
    },
  },
  {
    slug: "bodega",
    feature: { order: 3, kind: "Brand website + booking platform", role: "Concept, design, full-stack build, deployment", stack: ["HTML", "CSS", "JavaScript", "PHP", "MySQL", "Figma"] },
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
      story: {
        headline: "Giving a coworking brand its first home online",
        services: "Website Design &amp; Development • UX/UI Design • Bookings &amp; Payments",
      },
      gallery: [
        ["Image/bodega-rooms.jpg", "Meeting rooms, with branch selection, hourly rates and booking"],
        ["Image/bodega-offices.jpg", "Private offices, with direct inquiry paths"],
      ],
      stats: [["6", "Core pages"], ["2", "Booking systems"], ["100%", "Mobile responsive"], ["0 → 1", "First digital presence"]],
      sections: [
        ["Project Overview", `<p>Bodega Coworking Café is a coworking brand in Cebu. I designed and built its first website, with event, meeting room and private office bookings.</p>`],
        ["The Challenge", `<p>As a new, growing coworking brand, Bodega needed its first official website to establish credibility, let customers book and pay for events and meeting rooms, showcase private-office availability, and reflect a stylish, playful, community-driven identity. There was no existing platform — everything was designed and built from zero.</p>`],
        ["My Role", `<p>I handled the project end to end:</p>
          <ul><li>Shaping the concept and site structure</li><li>Designing the brand-led interface in Figma</li><li>Building the front end, back end, bookings and payments</li><li>Deploying the finished website</li></ul>`],
        ["The Process", `<ul><li><strong>Start from the brand.</strong> The site had to feel stylish, playful and community-driven.</li><li><strong>Map what people need.</strong> Six core pages cover membership, events, meeting rooms and private offices.</li><li><strong>Design it in Figma.</strong> The look and page layouts were worked out before the build.</li><li><strong>Build for every screen.</strong> Booking and payment flows were built to work fully on mobile.</li></ul>`],
        ["The Solution", cols([
          ["Information architecture", ["Six core pages: Home, About, Membership, Events, Meeting Rooms, Private Offices", "Clean top-bar navigation and organised event layouts"]],
          ["Event booking & payments", ["Dedicated events section for talks, socials and workshops", "Integrated booking and online payment"]],
          ["Rooms & private offices", ["Hourly meeting-room reservations with payment", "Private office listings with inquiry/booking flow"]],
          ["Design & mobile-first build", ["Modern, playful brand-led UI designed in Figma", "Fully responsive across devices"]],
        ]) + `<h4>Built with</h4>` + tags(["HTML5", "CSS3", "JavaScript", "PHP", "MySQL", "Payment gateway", "Figma", "cPanel"])],
        ["Results &amp; Learnings", `<ul><li><strong>From zero to full platform</strong> — Bodega's first-ever digital presence.</li><li><strong>Streamlined bookings</strong> — events and rooms reserved online.</li><li><strong>Community growth</strong> — clearer event visibility improved attendance.</li><li><strong>Scalable foundation</strong> — ready for new branches and services.</li></ul>
          <p><strong>What I learned:</strong> a new brand's first website has to do two jobs at once: show people who the brand is, and let them book without friction.</p>`],
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
      story: {
        headline: "Connecting patients with orthopaedic specialists across Cebu",
        services: "Website Development • Healthcare • Responsive Design",
      },
      gallery: [
        ["Image/spine-physicians.jpg", "Specialists page, with appointment buttons on every doctor"],
        ["Image/spine-conditions.jpg", "Conditions page, with an interactive body map"],
      ],
      sections: [
        ["Project Overview", `<p>Spine &amp; Orthopaedics Cebu is a network of orthopaedic specialists and clinics. I developed a responsive, content-rich website that helps patients find the right doctor and clinic.</p>`],
        ["The Challenge", `<p>The clinic network needed a trustworthy online presence that showcases its specialists, explains conditions and services, makes clinic locations easy to find, and supports patient education through blogs and foundation initiatives.</p>`],
        ["My Role", `<p>I was responsible for the website's development:</p>
          <ul><li>Building the specialist, conditions and location pages</li><li>Creating clear paths to book a consultation or send an inquiry</li><li>Adding the blog and foundation pages</li><li>Making every layout responsive and accessible</li></ul>`],
        ["The Process", `<ul><li><strong>Start with what patients look for.</strong> Doctors, conditions and clinic locations came first.</li><li><strong>Make the next step obvious.</strong> Each key page leads to a consultation or inquiry.</li><li><strong>Support education.</strong> Blog and foundation pages give patients useful information beyond the clinic.</li></ul>`],
        ["The Solution", cols([
          ["Specialist profiles", ["Dedicated doctor pages with bios and specialties", "Clear CTAs to schedule consultations"]],
          ["Conditions & services", ["Informational sections on treatments offered", "Navigation built for quick access to health info"]],
          ["Clinic locations", ["Affiliated hospitals and clinic addresses", "“Talk to Us” inquiry paths"]],
          ["Education & outreach", ["Blog and foundation pages", "Responsive, accessible layouts"]],
        ])],
        ["Results &amp; Learnings", `<ul><li><strong>Professional online presence</strong> that builds patient trust.</li><li><strong>Improved accessibility</strong> — doctors, services and locations are easy to find.</li><li><strong>Ongoing educational value</strong> through blogs and foundation content.</li><li><strong>More inquiries</strong> through clear contact pathways.</li></ul>
          <p><strong>What I learned:</strong> on a healthcare website, trust comes from clarity. People need to find the right doctor quickly and know exactly what to do next.</p>`],
      ],
    },
  },
  {
    slug: "acesphils",
    feature: { order: 4, kind: "Retail website", role: "Design, development, deployment, maintenance", stack: [] },
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
      story: {
        client: "Acesphils / Aces Depot",
        headline: "A product-first redesign for a hardware supplier",
        services: "Website Design &amp; Development • UX/UI Design • Retail",
      },
      gallery: [
        ["Image/aces-about.jpg", "About page, with the brand's colours and typography carried through"],
      ],
      sections: [
        ["Project Overview", `<p>Acesphils, also known as Aces Depot, is a Philippine hardware and construction supplier. I gave its website a modern, product-first redesign.</p>`],
        ["The Challenge", `<p>The previous site was outdated, lacked hierarchy and didn't highlight the store's wide product range. Acesphils needed a professional look that builds trust, clearer navigation to products, and a structure that could grow into e-commerce.</p>`],
        ["My Role", `<p>I took the redesign from design through to maintenance:</p>
          <ul><li>Designing the interface and page structure</li><li>Developing the website</li><li>Deploying it live</li><li>Maintaining it after launch</li></ul>`],
        ["The Process", `<ul><li><strong>Find what wasn't working.</strong> The old site was outdated, lacked hierarchy and hid the product range.</li><li><strong>Fix the structure.</strong> Menus were organised around categories and services, with clear inquiry buttons.</li><li><strong>Set a consistent look.</strong> Brand colours, typography and hierarchy now carry across every page.</li><li><strong>Plan for growth.</strong> Flexible product cards and page structure leave room for e-commerce.</li></ul>`],
        ["The Solution", cols([
          ["Modern, professional look", ["Strong visual hierarchy for easy browsing", "Consistent brand colours and typography"]],
          ["Better navigation", ["Structured menus for categories and services", "Clear inquiry CTAs across the site"]],
          ["Future-ready", ["Flexible product cards for easy updates", "Structure prepared for e-commerce"]],
          ["Responsive", ["Layouts designed for desktop, tablet and mobile", "Organised About, Products and Contact sections"]],
        ])],
        ["Results &amp; Learnings", `<ul><li><strong>Modern web identity</strong> that reflects a reliable hardware brand.</li><li><strong>Improved usability</strong> — customers find products faster.</li><li><strong>Stronger trust</strong> through a clean, consistent design.</li><li><strong>Scalable foundation</strong> for online catalogues and e-commerce.</li></ul>
          <p><strong>What I learned:</strong> planning for future growth during a redesign is far easier than rebuilding the structure later.</p>`],
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
