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
