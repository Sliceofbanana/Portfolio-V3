// Services — drives the header dropdown, the /services overview and one page per service (/services/<slug>).
// `projects` lists case-study slugs from projects.mjs shown as related work.

export const services = [
  {
    slug: "web-applications",
    icon: "layers-outline",
    title: "Custom web applications",
    short: "Portals, booking systems and dashboards",
    summary: "Sales portals, booking systems and dashboards — full-stack applications with real business logic, role-based access and reporting.",
    lead: "When spreadsheets and group chats stop scaling, I build the system your team actually runs on: one source of truth, the right access for each role, and reports you can trust.",
    includes: [
      ["Portals & dashboards", "Role-based portals for each department, with the numbers that matter on the first screen."],
      ["Booking & reservations", "Rooms, events and appointments with schedules, payments and confirmations."],
      ["Workflows & approvals", "Tasks, requests and approvals routed to the right people, with a full history."],
      ["Reports & exports", "PDF and Excel exports, payslips, invoices and summaries generated from live data."],
      ["Authentication & roles", "Secure sign-in, per-role permissions and activity logs."],
      ["Deployment & support", "Production hosting, monitoring, backups and ongoing improvements."],
    ],
    stack: ["React", "Next.js", "TypeScript", "Laravel", "Prisma", "PostgreSQL", "MySQL"],
    projects: ["atms", "bodega"],
  },
  {
    slug: "wordpress-cms",
    icon: "globe-outline",
    title: "WordPress & CMS solutions",
    short: "Business sites your team can edit",
    summary: "Fast-turnaround business websites with custom themes, WooCommerce and ongoing performance optimization — easy for your team to edit.",
    lead: "A professional website in weeks, not months — fast, found on Google, and simple enough that your team can update it without calling a developer.",
    includes: [
      ["Custom themes", "Designs built around your brand instead of a template everyone else uses."],
      ["Easy editing", "Elementor or block-based layouts so your team can change text, photos and pages."],
      ["Local SEO", "Structure, speed and metadata tuned so nearby customers can find you."],
      ["Lead capture", "Inquiry forms, quotes and click-to-chat that land in your inbox."],
      ["Performance", "Image optimization, caching and clean code for fast load times on mobile."],
      ["Care plans", "Updates, backups, uptime monitoring and small changes every month."],
    ],
    stack: ["WordPress", "Elementor", "WooCommerce", "Odoo", "Hostinger", "cPanel"],
    projects: ["mqprints", "spine"],
  },
  {
    slug: "e-commerce",
    icon: "cart-outline",
    title: "E-commerce systems",
    short: "Stores, payments and inventory",
    summary: "Complete online store setup — product management, payment integration, inventory tracking and conversion optimization.",
    lead: "Sell online without the guesswork: products that are easy to manage, checkout that works on every phone, and orders that flow straight into your process.",
    includes: [
      ["Product catalogue", "Categories, variants and stock that your team manages from one place."],
      ["Online payments", "Local and card payment gateways with clear receipts and confirmations."],
      ["Order management", "Order tracking, status updates and notifications for staff and customers."],
      ["Inventory", "Stock levels that update with every sale, with low-stock alerts."],
      ["Conversion", "Fast pages, clear calls to action and a short checkout."],
      ["Integrations", "Connections to accounting, shipping or your existing tools."],
    ],
    stack: ["Next.js", "WooCommerce", "Supabase", "Payment gateways", "Vercel"],
    projects: ["mqprints", "bodega"],
  },
];
