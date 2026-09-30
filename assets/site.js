/* ==========================================================================
   Genesis Jr / Project SNGDNN — shared behaviour
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Header: scrolled state, mobile menu, active link ---------------------- */
  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  const navLinks = $$('.nav-links a[href^="#"]');
  if (navLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          navLinks.forEach((a) => a.classList.remove("active"));
          const link = byId.get(e.target.id);
          if (link) link.classList.add("active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* Reveal on scroll ------------------------------------------------------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* Year + experience counters -------------------------------------------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  const experienceStart = new Date(2024, 2, 1); // March 2024 — first dev role
  $$("[data-experience]").forEach((el) => {
    const now = new Date();
    const months = (now.getFullYear() - experienceStart.getFullYear()) * 12 + (now.getMonth() - experienceStart.getMonth());
    const years = Math.floor(months / 12);
    el.textContent = months % 12 >= 6 ? `${years}.5` : `${Math.max(years, 1)}`;
  });
  $$("[data-project-count]").forEach((el) => (el.textContent = `${$$(".work-grid .project").length}+`));

  /* Modals ----------------------------------------------------------------- */
  let lastFocus = null;
  function openModal(modal) {
    lastFocus = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const close = $(".modal-close, [data-close]", modal);
    if (close) close.focus();
  }
  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if ($(".modal.open")) return; // a modal underneath (e.g. case study) is still open
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $$(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest("[data-close]")) closeModal(modal);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = $$(".modal.open");
    if (open.length) closeModal(open[open.length - 1]); // close the top-most only
  });

  /* Portfolio filters ------------------------------------------------------ */
  const filterBtns = $$(".filter-btn");
  filterBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      $$(".work-grid .project").forEach((p) => {
        const cats = (p.dataset.category || "").split(" ");
        p.classList.toggle("hidden", f !== "all" && !cats.includes(f));
      });
    })
  );

  /* Case studies ----------------------------------------------------------- */
  const CASE_STUDIES = {
    atms: {
      title: "ATMS — Agila Tax Management System",
      subtitle: "An all-in-one operations platform for a Philippine tax and accounting firm — one system of record for sales, accounting, tax compliance, HR, payroll and field liaison work.",
      image: "Image/atms/portals.webp",
      live: null,
      note: "Internal system, not publicly accessible. Screenshots were taken from a local demo instance running on sample data. No real client information is shown.",
      gallery: [
        ["Image/atms/accounting.webp", "Accounting & finance — collections, outstanding balances and payments awaiting confirmation"],
        ["Image/atms/compliance.webp", "Compliance portal — BIR and government filing deadlines with progress per tax type"],
        ["Image/atms/invoices.webp", "Invoices — auto-numbered billing with status tracking, import and print"],
        ["Image/atms/hr.webp", "HR portal — attendance, pending requests, payroll periods and headcount"],
        ["Image/atms/tasks.webp", "Task management — department kanban boards with routed workflows"],
      ],
      meta: [["Client", "Agila Tax Management Services"], ["Industry", "Tax, accounting & compliance"], ["Role", "Lead developer · Feb – Jul 2026"]],
      stats: [["146", "Screens across 10 portals"], ["261", "API endpoints"], ["118", "Database models"], ["5", "Connected apps shipped"]],
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
    bodega: {
      title: "Bodega Coworking Café",
      subtitle: "Building a coworking brand's first website — with event, room and office bookings — from scratch.",
      image: "Image/bodega.webp",
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
    acesphils: {
      title: "Acesphils Hardware",
      subtitle: "A modern, product-first redesign for a Philippine hardware and construction supplier.",
      image: "Image/Aces.webp",
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
    spine: {
      title: "Spine & Orthopaedics Cebu",
      subtitle: "A responsive, content-rich website connecting patients with orthopaedic specialists across Cebu.",
      image: "Image/SOC.webp",
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
    mqprints: {
      title: "MQ Printing Services",
      subtitle: "End-to-end website and digital infrastructure for a Cebu print shop — from discovery call to DevOps.",
      image: "Image/mq.webp",
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
  };

  function cols(items) {
    return `<div class="cs-cols">${items
      .map(([h, list]) => `<div class="card"><h4>${h}</h4><ul>${list.map((li) => `<li>${li}</li>`).join("")}</ul></div>`)
      .join("")}</div>`;
  }
  function tags(list) {
    return `<div class="tags">${list.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`;
  }

  const caseModal = $("#caseModal");
  function renderCase(cs) {
    const stats = cs.stats
      ? `<div class="cs-stats">${cs.stats.map(([n, l]) => `<div class="card"><strong class="grad-text">${n}</strong><span>${l}</span></div>`).join("")}</div>`
      : "";
    return `
      <div class="cs-hero"><img src="${cs.image}" alt="${cs.title} preview"></div>
      <div class="cs-body">
        <header><span class="eyebrow">Case study</span><h2 id="caseTitle" style="margin-top:14px">${cs.title}</h2><p class="cs-sub">${cs.subtitle}</p></header>
        <div class="cs-meta">${cs.meta.map(([k, v]) => `<div><small>${k}</small><span>${v}</span></div>`).join("")}</div>
        ${stats}
        ${cs.gallery ? `<section class="cs-section"><h3>Inside the system</h3><div class="cs-gallery">${cs.gallery
          .map(([src, cap]) => `<figure><button type="button" data-zoom="${src}" aria-label="Enlarge: ${cap}"><img src="${src}" alt="${cap}" loading="lazy"></button><figcaption>${cap}</figcaption></figure>`)
          .join("")}</div></section>` : ""}
        ${cs.sections.map(([h, body]) => `<section class="cs-section"><h3>${h}</h3>${body}</section>`).join("")}
        ${cs.note ? `<p class="cs-note">${cs.note}</p>` : ""}
        <div class="cs-actions">
          ${cs.live ? `<a class="btn btn-primary" href="${cs.live}" target="_blank" rel="noopener">View live website <span class="arrow">↗</span></a>` : ""}
          <a class="btn ${cs.live ? "btn-ghost" : "btn-primary"}" href="#contact" data-close>Start a similar project</a>
        </div>
      </div>`;
  }

  $$("[data-case]").forEach((el) =>
    el.addEventListener("click", (e) => {
      const cs = CASE_STUDIES[el.dataset.case];
      if (cs && el.tagName === "A") e.preventDefault();
      if (!cs || !caseModal) return;
      $(".modal-body", caseModal).innerHTML = renderCase(cs);
      caseModal.querySelector(".modal-panel").scrollTop = 0;
      openModal(caseModal);
    })
  );

  /* Certificate lightbox --------------------------------------------------- */
  const lightbox = $("#lightbox");
  $$("[data-lightbox]").forEach((el) =>
    el.addEventListener("click", () => {
      if (!lightbox) return;
      const img = $("img", lightbox);
      img.src = el.dataset.lightbox;
      img.alt = el.dataset.alt || "";
      openModal(lightbox);
    })
  );

  // Case-study screenshots are rendered dynamically, so delegate
  document.addEventListener("click", (e) => {
    const zoom = e.target.closest("[data-zoom]");
    if (!zoom || !lightbox) return;
    const img = $("img", lightbox);
    img.src = zoom.dataset.zoom;
    img.alt = zoom.getAttribute("aria-label") || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    $(".modal-close", lightbox).focus();
  });

  /* Contact / intake form (shared by portfolio and SNGDNN) ----------------- */
  // Keep these limits in sync with api/contact.js
  const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
  const RULES = {
    "Full Name / Company": { required: true, min: 2, max: 120, label: "your name or company" },
    Email: { required: true, max: 254, email: true, label: "your email" },
    Phone: { max: 30, pattern: /^\+?[0-9\s\-().]{7,30}$/, patternMsg: "Use digits only, e.g. +63 917 123 4567" },
    "Business Description": { max: 2000 },
    Pages: { max: 2000 },
    Features: { max: 2000 },
    "Design Preferences": { max: 2000 },
    Budget: { max: 120 },
    Timeline: { max: 120 },
    Notes: { max: 3000 },
  };

  function checkField(input) {
    const rule = RULES[input.name];
    if (!rule) return "";
    const value = input.value.trim();
    if (!value) return rule.required ? `Please enter ${rule.label}.` : "";
    if (rule.min && value.length < rule.min) return `Must be at least ${rule.min} characters.`;
    if (rule.max && value.length > rule.max) return `Keep this under ${rule.max} characters (${value.length} now).`;
    if (rule.email && !EMAIL_RE.test(value)) return "Enter a valid email, e.g. name@company.com.";
    if (rule.pattern && !rule.pattern.test(value)) return rule.patternMsg;
    return "";
  }

  function paint(input, message) {
    const field = input.closest(".field");
    if (!field) return;
    let hint = $(".field-msg", field);
    if (!hint) {
      hint = document.createElement("small");
      hint.className = "field-msg";
      hint.id = `msg-${Math.random().toString(36).slice(2, 9)}`;
      hint.setAttribute("aria-live", "polite");
      field.appendChild(hint);
      input.setAttribute("aria-describedby", hint.id);
    }
    const filled = input.value.trim() !== "";
    field.classList.toggle("is-invalid", !!message);
    field.classList.toggle("is-valid", !message && filled);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    hint.textContent = message;
  }

  const thanks = $("#thankYouModal");
  $$("form[data-intake]").forEach((form) => {
    const status = $(".form-status", form);
    const btn = $('button[type="submit"]', form);
    const btnLabel = btn ? btn.innerHTML : "";
    const inputs = $$("input, textarea", form).filter((el) => RULES[el.name]);

    inputs.forEach((input) => {
      const rule = RULES[input.name];
      if (rule.max) input.setAttribute("maxlength", String(rule.max));
      // Validate once the visitor leaves a field, then re-check live on every keystroke
      input.addEventListener("blur", () => {
        if (input.value.trim() || input.dataset.touched) {
          input.dataset.touched = "1";
          paint(input, checkField(input));
        }
      });
      input.addEventListener("input", () => {
        if (input.dataset.touched) paint(input, checkField(input));
      });
    });

    form.addEventListener("reset", () =>
      setTimeout(() =>
        inputs.forEach((input) => {
          delete input.dataset.touched;
          const field = input.closest(".field");
          field.classList.remove("is-invalid", "is-valid");
          input.removeAttribute("aria-invalid");
          const hint = $(".field-msg", field);
          if (hint) hint.textContent = "";
        })
      )
    );

    function showError(html) {
      status.classList.add("error");
      status.innerHTML = html;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      status.classList.remove("error");

      let firstBad = null;
      inputs.forEach((input) => {
        input.dataset.touched = "1";
        const msg = checkField(input);
        paint(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) {
        firstBad.focus();
        showError("Please fix the highlighted fields.");
        return;
      }

      const data = {};
      const goals = [];
      for (const [key, value] of new FormData(form).entries()) {
        if (key === "Goals[]") goals.push(value);
        else data[key] = typeof value === "string" ? value.trim() : value;
      }
      data.Goals = goals;

      btn.disabled = true;
      btn.innerHTML = "Sending…";

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));

        if (res.status === 429) {
          const mins = Math.max(1, Math.ceil((Number(res.headers.get("Retry-After")) || 60) / 60));
          showError(`Too many submissions from your connection. Please try again in about ${mins} minute${mins > 1 ? "s" : ""}.`);
          return;
        }
        if (res.status === 400 && json.errors) {
          // Server-side validation mirrors the client rules; surface its messages on the fields
          let focus = null;
          Object.entries(json.errors).forEach(([name, msg]) => {
            const input = inputs.find((i) => i.name === name);
            if (input) { paint(input, msg); focus = focus || input; }
          });
          if (focus) focus.focus();
          showError("Please fix the highlighted fields.");
          return;
        }
        if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);

        form.reset();
        if (thanks) openModal(thanks);
      } catch (err) {
        console.error(err);
        showError('Something went wrong sending your message. Please try again or email <a href="mailto:genesis.esdrilonjr@gmail.com"><u>genesis.esdrilonjr@gmail.com</u></a>.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = btnLabel;
      }
    });
  });
})();
