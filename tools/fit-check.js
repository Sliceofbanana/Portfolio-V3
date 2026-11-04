// Paste into the browser console on any page of the local preview (or run via the
// preview tools): loads the homepage in hidden frames at common screen sizes and
// reports, for each section, its height against the visible height below the header.
// A section "fits" when it is no taller than the screen minus the scrolled header.
(async () => {
  const sizes = [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [768, 1024], [390, 844], [375, 667]];
  const pick = (d) => [
    ["works head", d.querySelector(".st-works .st-head")],
    ...[...d.querySelectorAll(".st-feature")].map((f, i) => [`feature ${i + 1}`, f]),
    ["capabilities", d.querySelector("#capabilities")],
    ["about", d.querySelector("#about")],
    ["contact", d.querySelector("#contact")],
  ];
  const rows = [];
  for (const [w, h] of sizes) {
    const f = document.createElement("iframe");
    f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;opacity:0;pointer-events:none`;
    f.src = "/?fit=" + Date.now();
    document.body.appendChild(f);
    await new Promise((r) => { f.onload = r; setTimeout(r, 6000); });
    await new Promise((r) => setTimeout(r, 500));
    const d = f.contentDocument;
    d.getAnimations().forEach((a) => { try { a.finish(); } catch (e) {} });
    d.querySelectorAll(".reveal").forEach((e) => e.classList.add("in"));
    const avail = h - (w <= 900 ? 64 : 62);
    const bad = pick(d)
      .filter(([, el]) => el)
      .map(([name, el]) => [name, Math.round(el.getBoundingClientRect().height)])
      .filter(([, hh]) => hh > avail)
      .map(([name, hh]) => `${name} ${hh}>${avail}`);
    rows.push(`${w}x${h}: ${bad.length ? "TOO TALL: " + bad.join(", ") : "all fit"}`);
    f.remove();
  }
  return rows;
})();
