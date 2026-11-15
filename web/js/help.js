/* A short, dismissible "How to go deeper" note on the Layers tab, and a matching encyclopedia entry. */
(function () {
  "use strict";
  const KEY = "seaglobe-help-deeper";
  const $ = (id) => document.getElementById(id);
  function q() { return new URLSearchParams(location.search); }
  function suppressed() {
    const f = q().get("help");
    if (f === "0") return true;
    if (f === "1") return false;
    return q().get("capture") === "1" || q().get("shot") === "1";
  }
  function dismissed() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }
  function persist(on) {
    if (q().get("capture") === "1" || q().get("shot") === "1") return;
    try { if (on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch (e) {}
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function p(text) { return el("p", "", text); }
  function card() {
    const box = el("aside", "deeperhelp");
    box.id = "deeperHelp";
    box.setAttribute("aria-label", "How to go deeper");
    const head = el("div", "deeperhelp-head");
    const title = el("div", "deeperhelp-title", "How to go deeper");
    title.id = "deeperHelpTitle";
    const got = el("button", "btn small", "Got it");
    got.type = "button";
    got.id = "deeperHelpDismiss";
    got.addEventListener("click", () => { persist(true); show(false); });
    head.appendChild(title);
    head.appendChild(got);
    box.appendChild(head);
    box.appendChild(p("Zoom the globe to go from countries to states, counties and towns. In this tab, turn on “Borders and regions (zoom in: country › state › county › towns)”; a Region breadcrumb then follows the view centre. “Live US town boundaries (U.S. Census TIGERweb; off by default, needs the internet)” is optional and needs the internet."));
    box.appendChild(p("This tab also has Air hubs, Satellites (decorative, space age), Launch sites (75, GCAT), Cursor coordinates, Measure distance, and Print map view."));
    box.appendChild(p("A Focus chip appears when you pick an era, or when you filter or select a voyage in the Ship’s Log. Press × on the chip to clear it. Esc closes the Ship’s Log first, then clears Focus."));
    box.appendChild(p("Ship’s Log (or L) lists every voyage. Encyclopedia has Search, Ask and Listen. The Go deeper tab has narrated tours: press a tour to start, then Next for the next stop. Narration never starts on its own."));
    box.appendChild(p("The Window controls button on a panel opens lock, zoom the panel (not the globe), and minimize. Reset layout is in the dock."));
    return box;
  }
  function opener() {
    const b = el("button", "btn ghost small deeperhelp-open", "How to go deeper");
    b.type = "button";
    b.id = "deeperHelpOpen";
    b.addEventListener("click", () => { persist(false); show(true); });
    return b;
  }
  function show(open) {
    const pane = document.querySelector("[data-pane='layers']");
    if (!pane) return;
    let box = $("deeperHelp");
    let link = $("deeperHelpOpen");
    if (open) {
      if (link) link.remove();
      if (!box) { box = card(); pane.insertBefore(box, pane.firstChild); }
      box.hidden = false;
    } else {
      if (box) box.remove();
      if (!link) { link = opener(); pane.insertBefore(link, pane.firstChild); }
    }
  }
  function init() {
    const pane = document.querySelector("[data-pane='layers']");
    if (!pane) return;
    if (suppressed()) return;
    show(!dismissed());
  }
  window.SeaHelp = { show, dismissed, key: KEY };
  window.addEventListener("seaglobe:ready", init);
})();
