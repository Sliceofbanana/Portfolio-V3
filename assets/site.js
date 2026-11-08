/* ==========================================================================
   Genesis Jr — site behaviour
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

  // Services dropdown: click/tap toggles it (desktop also opens on hover via CSS)
  $$(".has-menu").forEach((item) => {
    const btn = $(".submenu-toggle", item);
    if (!btn) return;
    const setOpen = (open) => {
      item.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(!item.classList.contains("open"));
    });
    document.addEventListener("click", (e) => {
      if (!item.contains(e.target)) setOpen(false);
    });
    item.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && item.classList.contains("open")) {
        setOpen(false);
        btn.focus();
      }
    });
    item.addEventListener("focusout", (e) => {
      if (window.matchMedia("(min-width: 901px)").matches && !item.contains(e.relatedTarget)) setOpen(false);
    });
  });

  // "Back to top" scrolls without adding #top to the address bar
  $$("[data-top]").forEach((btn) =>
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const logo = $(".site-header a");
      if (logo) logo.focus({ preventScroll: true });
    })
  );

  // "Save as PDF" buttons open the print dialog (rates page)
  $$("[data-print]").forEach((btn) => btn.addEventListener("click", () => window.print()));

  /* Rates page: choose a plan, then show that plan's questions -------------- */
  $$("form[data-quote]").forEach((form) => {
    const radios = $$('input[name="Plan"]', form);
    const sections = $$("[data-for]", form);
    const label = $("[data-plan-label]", form);
    const budget = $("[data-budget-field]", form);
    let autoBudget = "";
    function sync() {
      const picked = radios.find((r) => r.checked);
      const key = picked ? picked.dataset.key : "";
      // Prefill the budget with the plan's price, unless the visitor typed their own
      if (budget && (budget.value === "" || budget.value === autoBudget)) {
        autoBudget = picked ? picked.dataset.budget || "" : "";
        budget.value = autoBudget;
      }
      sections.forEach((sec) => {
        const on = !!key && sec.dataset.for.split(" ").includes(key);
        sec.hidden = !on;
        sec.disabled = !on;
      });
      if (label) label.textContent = picked ? picked.value : "No plan chosen yet";
    }
    function choose(key) {
      const r = radios.find((x) => x.dataset.key === key);
      if (r) { r.checked = true; sync(); }
    }
    radios.forEach((r) => r.addEventListener("change", sync));
    $$("[data-choose]").forEach((a) => a.addEventListener("click", () => choose(a.dataset.choose)));
    form.addEventListener("intake:sent", () => setTimeout(sync));
    const fromUrl = new URLSearchParams(location.search).get("plan");
    if (fromUrl) choose(fromUrl.toLowerCase());
    sync();
  });

  /* Design page: each series is a sideways strip; add count + prev/next ------- */
  $$(".dz-series-head").forEach((head) => {
    const section = head.closest("section");
    const strip = section && $(".dz-tiles, .dz-masonry, .dz-grid", section);
    if (!strip) return;
    const title = ($("h2", head) || head).textContent.trim();
    const count = strip.children.length;
    // Keep each print's shape before it loads, so the strip has its full width
    $$("img", strip).forEach((img) => {
      const w = +img.getAttribute("width"), h = +img.getAttribute("height");
      if (w && h) img.style.aspectRatio = `${w} / ${h}`;
    });
    strip.setAttribute("tabindex", "0");
    strip.setAttribute("role", "region");
    strip.setAttribute("aria-label", `${title}: ${count} pieces, scroll sideways`);

    const nav = document.createElement("div");
    nav.className = "dz-nav";
    nav.innerHTML = `<span class="dz-count">${count} pieces</span>
      <button type="button" aria-label="Previous pieces in ${title}">←</button>
      <button type="button" aria-label="Next pieces in ${title}">→</button>`;
    head.appendChild(nav);
    const [prev, next] = $$("button", nav);
    const step = () => Math.max(strip.clientWidth * 0.8, 200);
    prev.addEventListener("click", () => strip.scrollBy({ left: -step() }));
    next.addEventListener("click", () => strip.scrollBy({ left: step() }));
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      nav.hidden = max <= 2;
      prev.disabled = strip.scrollLeft <= 2;
      next.disabled = strip.scrollLeft >= max - 2;
    };
    strip.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    $$("img", strip).forEach((img) => img.addEventListener("load", update));
    update();
  });

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

  /* GitHub contribution calendar (About) ------------------------------------- */
  // Data comes from api/github.js; the section stays hidden if the request fails.
  const contrib = $("[data-contrib]");
  if (contrib) {
    const grid = $(".contrib-grid", contrib);
    const months = $(".contrib-months", contrib);
    const yearsNav = $(".contrib-years", contrib);
    const scroller = $(".contrib-scroll", contrib);
    const fmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    const monthName = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
    const cache = new Map(); // "" = last 12 months, otherwise a calendar year

    const load = (year) => {
      if (!cache.has(year)) {
        cache.set(year, fetch(`/api/github${year ? `?year=${year}` : ""}`).then((res) => (res.ok ? res.json() : Promise.reject(res.status))));
      }
      return cache.get(year).catch((err) => { cache.delete(year); throw err; });
    };

    const renderYears = (years, active) => {
      if (yearsNav.childElementCount || !Array.isArray(years) || years.length < 2) return;
      ["", ...years].forEach((y) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "contrib-year";
        btn.dataset.year = y;
        btn.textContent = y || "Last 12 months";
        btn.setAttribute("aria-pressed", String(String(y) === active));
        btn.addEventListener("click", () => show(String(y)));
        yearsNav.appendChild(btn);
      });
    };

    const render = ({ total, weeks }, year) => {
      const cells = document.createDocumentFragment();
      let lastMonth = -1;
      grid.textContent = "";
      months.textContent = "";

      weeks.forEach((week, col) => {
        week.forEach(([date, count, level]) => {
          const d = new Date(`${date}T00:00:00Z`);
          const cell = document.createElement("span");
          cell.dataset.l = level;
          cell.style.gridColumn = col + 1;
          cell.style.gridRow = d.getUTCDay() + 1;
          cell.title = `${count || "No"} contribution${count === 1 ? "" : "s"} on ${fmt.format(d)}`;
          cells.appendChild(cell);
        });
        // Label a month above the first week that starts in it (skip a partial first week)
        const first = new Date(`${week[0][0]}T00:00:00Z`);
        if (first.getUTCMonth() !== lastMonth) {
          if ((col > 0 || first.getUTCDate() <= 7) && col < weeks.length - 2) {
            const label = document.createElement("span");
            label.textContent = monthName.format(first);
            label.style.gridColumn = `${col + 1} / span 3`;
            months.appendChild(label);
          }
          lastMonth = first.getUTCMonth();
        }
      });

      const when = year ? `in ${year}` : "in the last year";
      contrib.style.setProperty("--weeks", weeks.length);
      grid.appendChild(cells);
      grid.setAttribute("aria-label", `${total} GitHub contributions ${when}`);
      $("[data-contrib-total]", contrib).textContent = Number(total).toLocaleString("en");
      $("[data-contrib-when]", contrib).textContent = `${when}.`;
      $$(".contrib-year", contrib).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.year === year)));
      scroller.scrollLeft = year ? 0 : scroller.scrollWidth; // latest weeks first for the rolling view
    };

    const show = (year) => {
      contrib.classList.add("is-loading");
      load(year)
        .then((data) => {
          if (!Array.isArray(data.weeks) || !data.weeks.length) return;
          contrib.hidden = false; // unhide first so the scroll position can be set
          renderYears(data.years, year);
          render(data, year);
        })
        .catch(() => {})
        .finally(() => contrib.classList.remove("is-loading"));
    };
    show("");
  }

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
  const filterBtns = $$("button.filter-btn");
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

  /* Image lightbox (certificates) --------------------------------------------------- */
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

  /* Contact / intake form ---------------------------------------------------- */
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

      // Quotation form (rates page): a plan must be picked
      const planPicker = $("[data-plan-picker]", form);
      if (planPicker && !$('input[name="Plan"]:checked', form)) {
        planPicker.scrollIntoView({ block: "center" });
        showError("Please choose a plan first.");
        return;
      }

      const data = {};
      const goals = [];
      const answers = {};
      // Hidden plan sections are disabled, so FormData leaves their fields out
      for (const [key, value] of new FormData(form).entries()) {
        const v = typeof value === "string" ? value.trim() : value;
        if (key === "Goals[]") goals.push(v);
        else if (key.startsWith("A:")) {
          const q = key.slice(2);
          if (v) answers[q] = answers[q] ? `${answers[q]}, ${v}` : v;
        } else data[key] = v;
      }
      data.Goals = goals;
      if (Object.keys(answers).length) data.Answers = answers;

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
        form.dispatchEvent(new CustomEvent("intake:sent"));
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

  /* Analytics: one cookieless page view, skipped for Do Not Track / GPC ---- */
  if (!navigator.globalPrivacyControl && navigator.doNotTrack !== "1" && !/^(localhost|127\.|\[::1\])/.test(location.hostname)) {
    const q = new URLSearchParams(location.search);
    const view = JSON.stringify({ p: location.pathname, r: document.referrer, s: q.get("utm_source") || q.get("ref") || "" });
    try {
      if (!(navigator.sendBeacon && navigator.sendBeacon("/api/track", view))) {
        fetch("/api/track", { method: "POST", body: view, keepalive: true }).catch(() => {});
      }
    } catch (e) { /* analytics must never break the page */ }
  }
})();
