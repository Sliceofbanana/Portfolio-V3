/* ==========================================================================
   /stats — private analytics read-out (data from /api/stats)
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const KEY = "gj-stats-key";
  const COUNTRY = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
  const fmt = (n) => Number(n).toLocaleString("en-US");
  let days = 30;
  let lastDaily = null;
  let seq = 0; // ignore replies to superseded requests

  const store = {
    get() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* session only */ } },
    clear() { try { localStorage.removeItem(KEY); } catch (e) { /* nothing stored */ } },
  };
  let key = store.get();

  function show(view) {
    $("gate").hidden = view !== "gate";
    $("dash").hidden = view !== "dash";
    $("controls").hidden = view !== "dash";
  }

  function label(dim, value) {
    if (dim === "country") {
      if (value === "??") return "Unknown";
      try { return (COUNTRY && COUNTRY.of(value)) || value; } catch (e) { return value; }
    }
    if (dim === "ref" && value === "(direct)") return "Direct or unknown";
    return value;
  }

  function renderList(ul, rows) {
    const dim = ul.dataset.dim;
    ul.textContent = "";
    if (!rows || !rows.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Nothing yet";
      ul.appendChild(li);
      return;
    }
    const max = rows[0][1];
    rows.forEach(([value, count]) => {
      const li = document.createElement("li");
      li.style.setProperty("--w", `${Math.max(2, (count / max) * 100)}%`);
      const name = document.createElement("span");
      name.textContent = label(dim, value);
      name.title = name.textContent;
      const n = document.createElement("b");
      n.textContent = fmt(count);
      li.append(name, n);
      ul.appendChild(li);
    });
  }

  function niceMax(v) {
    if (v <= 5) return 5;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
  }

  function renderChart(daily) {
    const svg = $("chart");
    const W = svg.clientWidth || 800;
    const H = 220;
    const pad = { l: 34, r: 8, t: 10, b: 24 };
    const max = niceMax(Math.max(1, ...daily.map((d) => d.pageviews)));
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const step = iw / daily.length;
    const bw = Math.max(2, Math.min(28, step * 0.7));
    const y = (v) => pad.t + ih - (v / max) * ih;
    const ns = "http://www.w3.org/2000/svg";
    const el = (tag, attrs, text) => {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text != null) n.textContent = text;
      return n;
    };

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.textContent = "";
    [0, 0.5, 1].forEach((f) => {
      const v = max * f;
      svg.appendChild(el("line", { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), stroke: "rgba(255,255,255,0.08)" }));
      svg.appendChild(el("text", { x: pad.l - 8, y: y(v) + 4, "text-anchor": "end", fill: "#6b6962", "font-size": 11 }, fmt(v)));
    });
    const labelEvery = Math.ceil(daily.length / 8);
    daily.forEach((d, i) => {
      const x = pad.l + i * step + (step - bw) / 2;
      const g = el("g", {});
      g.appendChild(el("title", {}, `${d.date}: ${fmt(d.visitors)} visitors, ${fmt(d.pageviews)} views`));
      g.appendChild(el("rect", { x, y: y(d.pageviews), width: bw, height: Math.max(0, pad.t + ih - y(d.pageviews)), rx: 3, fill: "rgba(255,176,32,0.35)" }));
      g.appendChild(el("rect", { x: x + bw * 0.2, y: y(d.visitors), width: bw * 0.6, height: Math.max(0, pad.t + ih - y(d.visitors)), rx: 2, fill: "#ff5a1f" }));
      svg.appendChild(g);
      if (i % labelEvery === 0 || (i === daily.length - 1 && i % labelEvery >= labelEvery / 2)) {
        const [, m, day] = d.date.split("-");
        svg.appendChild(el("text", { x: x + bw / 2, y: H - 6, "text-anchor": "middle", fill: "#6b6962", "font-size": 11 }, `${Number(m)}/${Number(day)}`));
      }
    });
  }

  async function load() {
    const mine = ++seq;
    show("dash");
    $("range").textContent = "Loading…";
    let res;
    try {
      res = await fetch(`/api/stats?days=${days}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    } catch (e) {
      if (mine !== seq) return;
      $("range").textContent = "Couldn't reach the site. Check your connection and press Refresh.";
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (mine !== seq) return;
    if (res.status === 401) {
      store.clear();
      key = "";
      show("gate");
      $("gate-msg").textContent = "That key didn't work. Check STATS_KEY in Vercel and try again.";
      $("range").textContent = "genesisjr.com · private";
      return;
    }
    if (!res.ok) {
      $("range").textContent = data.error || `Something went wrong (${res.status}).`;
      return;
    }

    const t = data.totals;
    $("t-visitors").textContent = fmt(t.visitors);
    $("t-views").textContent = fmt(t.pageviews);
    $("t-ppv").textContent = t.visitors ? (t.pageviews / t.visitors).toFixed(1) : "–";
    $("t-live").textContent = fmt(data.live);
    $("range").textContent = data.from === data.to ? `Today, ${data.to}` : `${data.from} to ${data.to}`;
    lastDaily = data.daily;
    renderChart(lastDaily);
    document.querySelectorAll(".list").forEach((ul) => renderList(ul, data[ul.dataset.dim]));
  }

  $("gate").addEventListener("submit", (e) => {
    e.preventDefault();
    key = $("key").value.trim();
    $("key").value = "";
    $("gate-msg").textContent = "";
    store.set(key);
    load();
  });
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
    days = Number(b.dataset.days);
    document.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    load();
  }));
  $("refresh").addEventListener("click", load);
  $("signout").addEventListener("click", () => { store.clear(); key = ""; show("gate"); });
  let lastWidth = 0;
  new ResizeObserver(() => {
    const w = $("chart").clientWidth;
    if (lastDaily && w && w !== lastWidth) { lastWidth = w; renderChart(lastDaily); }
  }).observe($("chart"));

  if (key) load(); else show("gate");
})();
