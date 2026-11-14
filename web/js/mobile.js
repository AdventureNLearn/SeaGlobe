// SeaGlobe phones (v2.3): a menu button and slide-up sheets on small screens.
// Every behaviour here is gated on the same media query as the phone CSS, so the desktop is untouched.
(function () {
  "use strict";
  const mq = window.matchMedia("(max-width: 820px)");
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  let mode = null; // null | "menu" | "voyage"
  let shift = 0;

  function setShift(fy) { // keep the selected vehicle in the visible strip above the voyage sheet
    if (!window.__sg || fy === shift) return;
    shift = fy;
    try { window.__sg.viewShift(fy); } catch (e) { /* globe not ready yet */ }
  }
  function sheet(m) {
    if (!mq.matches) m = null;
    mode = m || null;
    body.classList.toggle("m-sheet", !!mode);
    body.classList.toggle("m-sheet-menu", mode === "menu");
    body.classList.toggle("m-sheet-voyage", mode === "voyage");
    $("menuBtn").setAttribute("aria-expanded", String(mode === "menu"));
    if (mode === "menu") {
      const active = document.querySelector(".tab.active");
      if (!active || active.dataset.tab === "voyage") clickTab($("detail").hidden ? "layers" : "voyage");
    }
    if (mode === "voyage") clickTab("voyage");
    setShift(mode === "voyage" ? -0.24 : 0);
  }
  function clickTab(name) { const b = document.querySelector(".tab[data-tab='" + name + "']"); if (b && !b.classList.contains("active")) b.click(); }

  function syncProxies() {
    $("mModeBtn").setAttribute("aria-pressed", $("modeBtn").getAttribute("aria-pressed") || "false");
    $("mLogBtn").setAttribute("aria-pressed", $("logBtn").getAttribute("aria-pressed") || "false");
    const src = $("eraChips");
    // copies carry data-mera (not data-era) so selectors for the real era chips never match a hidden copy
    const html = src ? src.innerHTML.replace(/data-era=/g, "data-mera=") : "";
    if ($("mEras").innerHTML !== html) $("mEras").innerHTML = html;
  }

  function init() {
    $("menuBtn").addEventListener("click", () => sheet(mode === "menu" ? null : "menu"));
    $("mClose").addEventListener("click", () => sheet(null));
    $("mModeBtn").addEventListener("click", () => { $("modeBtn").click(); sheet(null); });
    $("mLogBtn").addEventListener("click", () => { sheet(null); $("logBtn").click(); });
    $("mEras").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mera]"); if (!b) return;
      const orig = $("eraChips").querySelector("[data-era='" + b.dataset.mera + "']");
      if (orig) orig.click();
      sheet(null);
    });
    // swipe the sheet header down to dismiss
    let y0 = null;
    $("mHead").addEventListener("touchstart", (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    $("mHead").addEventListener("touchend", (e) => { if (y0 != null && e.changedTouches[0].clientY - y0 > 50) sheet(null); y0 = null; });

    // a new selection (tap, Ship's Log, route list) opens the voyage card as a bottom sheet
    let renders = 0;
    new MutationObserver(() => {
      renders++;
      if (!mq.matches) return;
      if (!$("detail").hidden) { if (body.classList.contains("log-open") && window.__sg) window.__sg.log(false); sheet("voyage"); }
    }).observe($("dShip"), { childList: true, characterData: true, subtree: true });
    new MutationObserver(() => { if (mq.matches && $("detail").hidden && mode === "voyage") sheet(null); })
      .observe($("detail"), { attributes: true, attributeFilter: ["hidden"] });
    // the Ship's Log replaces any open sheet
    new MutationObserver(() => { syncProxies(); if (mq.matches && body.classList.contains("log-open") && mode) sheet(null); })
      .observe(body, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(syncProxies).observe($("modeBtn"), { attributes: true, attributeFilter: ["aria-pressed"] });
    new MutationObserver(syncProxies).observe($("eraChips"), { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

    // a tap on empty globe closes the open sheet
    const g = $("globe"); let down = null, before = 0;
    g.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; before = renders; });
    g.addEventListener("pointerup", (e) => {
      if (!mq.matches || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      setTimeout(() => { if (renders === before && mode) sheet(null); }, 0);
    });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && mode && mq.matches) sheet(null); });
    const onChange = () => { if (!mq.matches) sheet(null); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else mq.addListener(onChange);
    window.addEventListener("resize", () => { if (shift) { const s = shift; shift = 0; setShift(s); } });
    syncProxies();
    window.__sgMobile = { sheet, mode: () => mode };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
