/* Topics navigation (flag topicNav). Glance is the owner's list; overview is a short
   summary and links to existing encyclopedia entries. "Show on the globe" is a second
   press: it applies named time, camera, Focus, light layers and heavy layers. Heavy
   layers go through SeaLayers.request. If a wanted heavy layer would pass the cap,
   the topic asks which active layer to turn off first and never drops one silently.
   Terrain and Census are skipped with a short note when their flags are off. Clear
   restores the prior time, camera, Focus and light layers, and turns off only the
   heavy layers this topic turned on. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FLAG = "topicNav";
  const st = { ready: false, open: false, selected: null, view: "list", applied: null, prior: null, ask: null, skipped: [], pendingHeavies: [], heavyOn: [] };

  function enabled() { return window.SeaFlags && window.SeaFlags.on(FLAG); }
  function phone() { return window.matchMedia("(max-width: 820px)").matches; }
  function testMode() {
    const q = new URLSearchParams(location.search);
    return q.get("capture") === "1" || q.get("shot") === "1";
  }

  function rows() {
    const allowExample = window.SeaFlags && window.SeaFlags.exampleData;
    const list = ((window.SEAGLOBE_DATA || {}).topics) || [];
    return list.filter((t) => t && t.id && t.title && (t.example !== true || allowExample))
      .slice()
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.title).localeCompare(String(b.title)));
  }

  function byId(id) { return rows().find((t) => t.id === id) || null; }

  function oneLine(t) {
    const s = String((t && t.summary) || "").replace(/\s+/g, " ").trim();
    const m = s.match(/^.*?[.!?](?=\s|$)/);
    return (m ? m[0] : s).trim();
  }

  function topicHash() {
    const h = decodeURIComponent(location.hash || "");
    const m = /^#\/topic\/?(.*)$/.exec(h);
    if (!m) return { hit: false, id: "" };
    return { hit: true, id: decodeURIComponent(m[1] || "").trim() };
  }

  function setHash(id, replace) {
    const next = id ? "#/topic/" + encodeURIComponent(id) : "#/topic";
    if (location.hash === next) return;
    if (replace) history.replaceState(null, "", next);
    else location.hash = next;
  }

  function clearTopicHash() {
    if (topicHash().hit) history.replaceState(null, "", location.pathname + location.search);
  }

  function entryTitle(id) {
    const e = window.SeaAtlas && window.SeaAtlas.get && window.SeaAtlas.get(id);
    return (e && e.title) || id;
  }

  function eraById(id) {
    const eras = ((window.SEAGLOBE_DATA || {}).schema || {}).eras || [];
    return eras.find((e) => e.id === id) || null;
  }

  function namedTime(t) {
    if (t.time && t.time.start != null && t.time.start !== "") return t.time.start;
    if (t.time && t.time.end != null && t.time.end !== "") return t.time.end;
    const eraId = (t.eras && t.eras[0]) || (t.focus && t.focus.era) || "";
    const e = eraId && eraById(eraId);
    return (e && e.showcase) || null;
  }

  function namedCamera(t) {
    const c = t.camera;
    if (!c || typeof c !== "object") return null;
    if (![c.lat, c.lng, c.altitude].every((n) => typeof n === "number" && isFinite(n))) return null;
    return { lat: c.lat, lng: c.lng, altitude: c.altitude };
  }

  function namedFocus(t) {
    const f = t.focus;
    if (!f || typeof f !== "object") return null;
    const out = {};
    if (f.family) out.family = f.family;
    if (f.era) out.era = f.era;
    if (Array.isArray(f.ids) && f.ids.filter(Boolean).length) out.ids = f.ids.filter(Boolean);
    return Object.keys(out).length ? out : null;
  }

  function namedLights(t) {
    const reg = (window.SeaLayers && SeaLayers.registry) || {};
    return (Array.isArray(t.layersLight) ? t.layersLight : []).filter((id) => id && reg[id] && reg[id].weight === "light");
  }

  function namedHeavies(t) {
    const reg = (window.SeaLayers && SeaLayers.registry) || {};
    return (Array.isArray(t.layersHeavy) ? t.layersHeavy : []).filter((id) => id && reg[id] && reg[id].weight === "heavy");
  }

  function canShow(t) {
    return !!(namedTime(t) || namedCamera(t) || namedFocus(t) || namedLights(t).length || namedHeavies(t).length);
  }

  const HEAVY_TITLE = {
    wind: "Wind belts",
    regions: "Borders and regions",
    live: "Live US town boundaries",
    hubs: "Air hubs",
    launch: "Launch sites",
    pmtilesBorders: "US Census boundaries",
    terrain: "US terrain"
  };

  function layerTitle(id) { return HEAVY_TITLE[id] || id; }

  function flagSkipNote(id) {
    const flag = id === "pmtilesBorders" ? "pmtilesBorders" : (id === "terrain" ? "terrain" : null);
    if (!flag) return null;
    if (window.SeaFlags && window.SeaFlags.on(flag)) return null;
    return id === "terrain"
      ? "US terrain was skipped because the terrain flag is off."
      : "US Census boundaries were skipped because the Census boundaries flag is off.";
  }

  function heavyActive() {
    return (window.SeaLayers && window.SeaLayers.active) ? window.SeaLayers.active().slice() : [];
  }

  function heavyCap() {
    return (window.SeaLayers && window.SeaLayers.cap) ? window.SeaLayers.cap() : 5;
  }

  function needSlots(id) {
    const active = heavyActive();
    const need = [id];
    if (id === "live" && active.indexOf("regions") < 0) need.push("regions");
    return need.filter((x) => active.indexOf(x) < 0);
  }

  function wouldFit(id) {
    return heavyActive().length + needSlots(id).length <= heavyCap();
  }

  function capWhere() {
    if (window.SeaLayers && window.SeaLayers.isLite && window.SeaLayers.isLite() && !phone()) return " in the lite edition";
    if (phone() || (window.SeaLayers && window.SeaLayers.isPhone && window.SeaLayers.isPhone())) return " on a phone";
    return "";
  }

  function setHeavy(id, on) {
    const reg = window.SeaLayers && SeaLayers.registry && SeaLayers.registry[id];
    if (!reg || reg.weight !== "heavy") return false;
    const el = $(reg.toggle);
    if (!el) return false;
    if (!!el.checked === !!on) return true;
    if (on && !wouldFit(id)) return false;
    el.checked = !!on;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return on ? (heavyActive().indexOf(id) >= 0 || !!el.checked) : !el.checked;
  }

  function skipText(s) {
    if (s.text) return s.text;
    if (s.reason === "flag") return flagSkipNote(s.id) || (layerTitle(s.id) + " was skipped because its flag is off.");
    if (s.reason === "cap") return layerTitle(s.id) + " was not added. Turn a heavier layer off first to add it.";
    return layerTitle(s.id) + " was not added.";
  }

  function notesHtml() {
    if (!st.skipped || !st.skipped.length) return "";
    return "<ul class='small' id='topicsSkipped'>" + st.skipped.map((s) => "<li>" + esc(skipText(s)) + "</li>").join("") + "</ul>";
  }

  function askHtml() {
    if (!st.ask) return "";
    const n = heavyCap();
    const want = layerTitle(st.ask.want);
    const btns = heavyActive().map((id) =>
      "<li><button class='btn' type='button' data-act='cap-off' data-layer='" + esc(id) + "'>Turn off " + esc(layerTitle(id)) + "</button></li>"
    ).join("");
    return "<div class='topics-ask' id='topicsCapAsk' role='region' aria-live='polite'>" +
      "<p>This topic wants " + esc(want) + ", but only " + n + " heavier layers can be on at once" + esc(capWhere()) +
      ". Turn one off first to add it.</p>" +
      "<ul class='alist'>" + btns + "</ul>" +
      "<button class='btn ghost' type='button' data-act='cap-cancel' id='topicsCapCancel'>Not now</button>" +
      "</div>";
  }

  function lightOn(id) {
    const reg = window.SeaLayers && SeaLayers.registry && SeaLayers.registry[id];
    if (id === "bells" && window.SeaBells) return !!SeaBells.enabled();
    const el = reg && $(reg.toggle);
    return !!(el && el.checked);
  }

  function setLight(id, on) {
    const reg = window.SeaLayers && SeaLayers.registry && SeaLayers.registry[id];
    if (!reg || reg.weight !== "light") return Promise.resolve();
    if (id === "bells" && window.SeaBells && SeaBells.enable) return Promise.resolve(SeaBells.enable(!!on));
    const el = $(reg.toggle);
    if (el && el.checked !== !!on) {
      el.checked = !!on;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return Promise.resolve();
  }

  function snapshot() {
    const sg = window.__sg;
    const pov = sg && sg.pov ? sg.pov() : null;
    const lights = {};
    const reg = (window.SeaLayers && SeaLayers.registry) || {};
    Object.keys(reg).forEach((id) => { if (reg[id].weight === "light") lights[id] = lightOn(id); });
    return {
      idle: !!(document.body.classList.contains("idle")),
      t: sg && sg.state ? sg.state().t : null,
      playing: sg && sg.state ? !!sg.state().playing : false,
      pov: pov ? { lat: pov.lat, lng: pov.lng, altitude: pov.altitude } : null,
      lights,
      focusText: (($("focusText") && $("focusText").textContent) || "").trim(),
      focusOn: !!($("focusChip") && !$("focusChip").hidden)
    };
  }

  function makeChip() {
    if ($("topicChip")) return;
    const chip = document.createElement("div");
    chip.className = "focuschip topicchip";
    chip.id = "topicChip";
    chip.hidden = true;
    chip.innerHTML = "<button type='button' class='topicchip-open' id='topicChipOpen'><span class='kicker'>Topic</span> <span id='topicChipText'></span></button>" +
      "<button class='x' type='button' id='topicChipClear' aria-label='Clear topic' title='Clear topic'>×</button>";
    const after = $("focusChip");
    if (after && after.parentNode) after.parentNode.insertBefore(chip, after.nextSibling);
    else {
      const bar = document.querySelector(".modebar") || $("topbar") || document.body;
      bar.appendChild(chip);
    }
    $("topicChipOpen").addEventListener("click", () => {
      if (st.applied) { setHash(st.applied.id, true); open(true); }
    });
    $("topicChipClear").addEventListener("click", () => { clearApplied(); });
  }

  function syncChip() {
    const chip = $("topicChip");
    if (!chip) return;
    const t = st.applied;
    chip.hidden = !t;
    const label = $("topicChipText");
    if (label) label.textContent = t ? t.title : "";
    document.body.classList.toggle("topic-applied", !!t);
  }

  function make() {
    if ($("topicsPanel") || !enabled()) return;
    const list = rows();
    if (!list.length) return;

    makeChip();

    const panel = document.createElement("aside");
    panel.className = "panel glass atlaspanel topicspanel";
    panel.id = "topicsPanel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Topics");
    panel.innerHTML = "<div class='loghead'><div><div class='kicker'>Topics</div><div class='psub' id='topicsCount'>—</div></div>" +
      "<div class='row'><button class='btn ghost icon' id='topicsBack' type='button' aria-label='Back' title='Back'>‹</button>" +
      "<button class='btn ghost icon' id='topicsClose' type='button' aria-label='Close topics'>×</button></div></div>" +
      "<div class='abody' id='topicsBody' tabindex='0'></div>";
    document.body.appendChild(panel);

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.id = "topicsBtn";
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-controls", "topicsPanel");
    btn.title = "Topics: a short list of subjects (flag topicNav)";
    btn.textContent = "Topics";
    const after = $("helpBtn") || $("atlasBtn") || $("logBtn");
    if (after && after.parentNode) after.parentNode.insertBefore(btn, after.nextSibling);
    else document.body.appendChild(btn);

    const mq = $("mQuick");
    if (mq && !$("mTopicsBtn")) {
      const m = document.createElement("button");
      m.className = "btn";
      m.id = "mTopicsBtn";
      m.type = "button";
      m.textContent = "Topics";
      m.addEventListener("click", () => { if (window.__sgMobile) window.__sgMobile.sheet(null); open(true); });
      const mAtlas = $("mAtlasBtn");
      if (mAtlas && mAtlas.parentNode) mAtlas.parentNode.insertBefore(m, mAtlas.nextSibling);
      else mq.appendChild(m);
    }

    btn.addEventListener("click", () => {
      if (window.SeaWindows && window.SeaWindows.state && window.SeaWindows.state("topics") && window.SeaWindows.state("topics").minimized) {
        window.SeaWindows.expand("topics");
        open(true);
        return;
      }
      open(panel.hidden);
    });
    $("topicsClose").addEventListener("click", () => open(false));
    $("topicsBack").addEventListener("click", () => {
      st.selected = st.applied || null;
      st.view = "list";
      setHash("", true);
      renderList();
    });
    $("topicsBody").addEventListener("click", onClick);
    if (window.SeaWindows) window.SeaWindows.register("topics", panel, {
      title: "Topics", minW: 320, minH: 240, sheet: true,
      onMinimize: () => { document.body.classList.remove("topics-open"); },
      onExpand: () => { if (panel.hidden) open(true); else document.body.classList.add("topics-open"); }
    });
    window.addEventListener("hashchange", route);
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.key === "Escape" && st.ask) { cancelAsk(); e.preventDefault(); return; }
      if (e.key === "Escape" && !panel.hidden) { open(false); e.preventDefault(); }
    });
  }

  function onClick(e) {
    const off = e.target.closest("[data-act='cap-off']");
    if (off && off.getAttribute("data-layer")) { e.preventDefault(); pickCapOff(off.getAttribute("data-layer")); return; }
    const cancel = e.target.closest("#topicsCapCancel, [data-act='cap-cancel']");
    if (cancel) { e.preventDefault(); cancelAsk(); return; }
    const show = e.target.closest("#topicsShow, [data-act='show']");
    if (show && st.selected) { e.preventDefault(); apply(st.selected); return; }
    const clr = e.target.closest("#topicsClear, [data-act='clear']");
    if (clr) { e.preventDefault(); clearApplied(); return; }
  }

  function setPressed(on) {
    ["topicsBtn", "mTopicsBtn"].forEach((id) => {
      const b = $(id);
      if (b) b.setAttribute("aria-pressed", String(!!on));
    });
  }

  function hidePanel() {
    const panel = $("topicsPanel");
    if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove("topics-open");
    setPressed(false);
    st.open = false;
  }

  function open(on) {
    const panel = $("topicsPanel");
    if (!panel) return;
    if (on && window.__sg && window.__sg.log) window.__sg.log(false);
    if (!on) {
      hidePanel();
      if (!st.applied) {
        st.selected = null;
        st.view = "list";
        clearTopicHash();
      }
      return;
    }
    panel.hidden = false;
    document.body.classList.add("topics-open");
    setPressed(true);
    st.open = true;
    const h = topicHash();
    if (h.hit && h.id) showOverview(h.id, true);
    else if (st.applied) showOverview(st.applied.id, true);
    else if (h.hit) renderList();
    else { setHash("", true); renderList(); }
    const body = $("topicsBody");
    if (body) setTimeout(() => body.focus(), 0);
  }

  function renderList() {
    st.view = "list";
    if (!st.applied) st.selected = null;
    const body = $("topicsBody");
    const back = $("topicsBack");
    const count = $("topicsCount");
    const list = rows();
    if (back) back.hidden = true;
    if (count) count.textContent = list.length === 1 ? "1 topic" : list.length + " topics";
    if (!body) return;
    if (!list.length) {
      body.innerHTML = "<p class='small'>No topics yet.</p>";
      return;
    }
    body.innerHTML = "<ul class='alist'>" + list.map((t) =>
      "<li><a href='#/topic/" + encodeURIComponent(t.id) + "'><b>" + esc(t.title) + "</b><div class='asum'>" + esc(oneLine(t)) + "</div></a></li>"
    ).join("") + "</ul>";
    body.scrollTop = 0;
  }

  function renderOverview(t) {
    st.view = "overview";
    st.selected = t;
    const body = $("topicsBody");
    const back = $("topicsBack");
    const count = $("topicsCount");
    if (back) back.hidden = false;
    if (count) count.textContent = st.applied && st.applied.id === t.id ? "On the globe" : "Overview";
    if (!body) return;
    const eras = (t.eras && t.eras.length) ? "<p class='small'>" + esc(t.eras.join(" · ")) + "</p>" : "";
    const years = t.time && (t.time.start != null || t.time.end != null)
      ? "<p class='small'>" + esc([t.time.start, t.time.end].filter((x) => x != null && x !== "").join(" – ")) + "</p>"
      : "";
    const ids = Array.isArray(t.entities) ? t.entities.filter(Boolean) : [];
    const links = ids.length
      ? "<div class='psub'>Encyclopedia entries</div><ul class='alist'>" + ids.map((id) =>
        "<li><a href='#/entry/" + encodeURIComponent(id) + "'>" + esc(entryTitle(id)) + "</a></li>"
      ).join("") + "</ul>"
      : "";
    const applied = !!(st.applied && st.applied.id === t.id);
    const asking = !!(st.ask && st.ask.topic && st.ask.topic.id === t.id);
    const actions = canShow(t)
      ? "<div class='row aact'>" +
        (applied && !asking
          ? "<button class='btn' id='topicsClear' type='button' data-act='clear'>" + (st.prior && st.prior.idle ? "Back to Sampler" : "Clear") + "</button>"
          : asking ? "" : "<button class='btn' id='topicsShow' type='button' data-act='show'>Show on the globe</button>") +
        "</div>"
      : "";
    body.innerHTML = "<h2>" + esc(t.title) + "</h2><p>" + esc(t.summary) + "</p>" + eras + years + actions + askHtml() + notesHtml() + links;
    body.scrollTop = 0;
  }

  function showOverview(id, fromHash) {
    const t = byId(id);
    if (!t) {
      st.view = "overview";
      st.selected = null;
      const body = $("topicsBody");
      const back = $("topicsBack");
      if (back) back.hidden = false;
      if (body) body.innerHTML = "<p class='small'>That topic is not in this list.</p>";
      return;
    }
    if (!fromHash) setHash(t.id);
    renderOverview(t);
  }

  function apply(t) {
    if (!t || !canShow(t)) return Promise.resolve();
    if (st.applied && st.applied.id !== t.id) clearApplied(true);
    if (!st.prior) st.prior = snapshot();
    const sg = window.__sg;
    const time = namedTime(t);
    if (time && sg) {
      if (sg.idle) sg.idle(false);
      if (sg.play) sg.play(false);
      if (sg.setTime) sg.setTime(time);
    }
    const focus = namedFocus(t);
    if (focus && sg && sg.focus) {
      const f = {};
      if (focus.era) f.era = focus.era;
      if (focus.family) f.family = focus.family;
      sg.focus(f);
    }
    const cam = namedCamera(t);
    if (cam && sg) {
      if (testMode() && sg.pov) sg.pov(cam);
      else if (sg.flyTo) sg.flyTo(cam, 2.6, 0);
    }
    if (window.SeaLayers && SeaLayers.reapply && focus) SeaLayers.reapply();
    const lights = namedLights(t);
    return Promise.all(lights.map((id) => setLight(id, true))).then(() => {
      if (sg && sg.advance) sg.advance(0);
      startHeavies(t);
      finishApply(t);
    });
  }

  function startHeavies(t) {
    const plan = { skipped: [], pending: [] };
    namedHeavies(t).forEach((id) => {
      const note = flagSkipNote(id);
      if (note) { plan.skipped.push({ id, reason: "flag", text: note }); return; }
      if (heavyActive().indexOf(id) >= 0) return;
      plan.pending.push(id);
    });
    st.skipped = plan.skipped;
    st.pendingHeavies = plan.pending;
    st.heavyOn = [];
    st.ask = null;
    stepHeavies(t);
  }

  function stepHeavies(t) {
    while (st.pendingHeavies.length) {
      const id = st.pendingHeavies[0];
      if (heavyActive().indexOf(id) >= 0) { st.pendingHeavies.shift(); continue; }
      if (!wouldFit(id)) {
        st.ask = { want: id, topic: t };
        return;
      }
      if (setHeavy(id, true)) st.heavyOn.push(id);
      st.pendingHeavies.shift();
    }
    st.ask = null;
  }

  function finishApply(t) {
    const sg = window.__sg;
    if (window.SeaLayers && SeaLayers.reapply) SeaLayers.reapply();
    if (sg && sg.advance) sg.advance(0);
    st.applied = t;
    st.selected = t;
    syncChip();
    if (phone() && !st.ask) hidePanel();
    else {
      if (phone() && st.ask) {
        const panel = $("topicsPanel");
        if (panel && panel.hidden) {
          panel.hidden = false;
          document.body.classList.add("topics-open");
          setPressed(true);
          st.open = true;
        }
      }
      renderOverview(t);
    }
  }

  function pickCapOff(id) {
    if (!st.ask) return;
    const t = st.ask.topic;
    setHeavy(id, false);
    st.ask = null;
    stepHeavies(t);
    finishApply(t);
  }

  function cancelAsk() {
    if (!st.ask) return;
    const t = st.ask.topic;
    st.pendingHeavies.forEach((id) => st.skipped.push({ id, reason: "cap" }));
    st.pendingHeavies = [];
    st.ask = null;
    finishApply(t);
  }

  function clearApplied(switching) {
    const prior = st.prior;
    const was = st.applied;
    const heavyOn = st.heavyOn.slice();
    st.applied = null;
    st.ask = null;
    st.pendingHeavies = [];
    st.skipped = [];
    st.heavyOn = [];
    syncChip();
    const jobs = [];
    if (was && prior && prior.lights) {
      namedLights(was).forEach((id) => {
        jobs.push(setLight(id, !!prior.lights[id]));
      });
    }
    heavyOn.forEach((id) => { setHeavy(id, false); });
    const sg = window.__sg;
    if (prior && sg) {
      if (prior.idle) {
        if (sg.idle) sg.idle(true);
        if (prior.t != null && sg.setTime) sg.setTime(prior.t);
      } else {
        if (sg.idle) sg.idle(false);
        if (prior.t != null && sg.setTime) sg.setTime(prior.t);
        if (sg.play) sg.play(!!prior.playing);
        if (prior.focusOn === false && $("focusClear")) $("focusClear").click();
      }
      if (prior.pov) {
        if (testMode() && sg.pov) sg.pov(prior.pov);
        else if (sg.flyTo) sg.flyTo(prior.pov, 2, 0);
        else if (sg.pov) sg.pov(prior.pov);
      }
    }
    if (window.SeaLayers && SeaLayers.reapply) SeaLayers.reapply();
    if (sg && sg.advance) sg.advance(0);
    if (!switching) st.prior = null;
    if (!switching && st.selected) renderOverview(st.selected);
    return Promise.all(jobs);
  }

  function route() {
    if (!enabled()) return;
    const h = topicHash();
    if (!h.hit) {
      if (st.open && /^#\//.test(location.hash || "") && !st.applied) open(false);
      return;
    }
    if (!$("topicsPanel")) return;
    if ($("topicsPanel").hidden) {
      $("topicsPanel").hidden = false;
      document.body.classList.add("topics-open");
      setPressed(true);
      st.open = true;
    }
    if (h.id) showOverview(h.id, true);
    else renderList();
  }

  function loadExamples() {
    if (!(window.SeaFlags && window.SeaFlags.exampleData)) return Promise.resolve();
    if (st.examplesLoaded) return Promise.resolve();
    return fetch("data/next/topics/example.json").then((res) => {
      if (!res.ok) throw new Error("topics example " + res.status);
      return res.json();
    }).then((data) => {
      const extra = (data && Array.isArray(data.topics)) ? data.topics : (Array.isArray(data) ? data : []);
      const root = (window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {});
      const list = Array.isArray(root.topics) ? root.topics : (root.topics = []);
      extra.forEach((row) => {
        if (!row || row.example !== true || !row.id || !row.title) return;
        if (!list.some((t) => t && t.id === row.id)) list.push(row);
      });
      st.examplesLoaded = true;
    }).catch((e) => { console.warn("SeaTopics:", e); });
  }

  function markReady() {
    st.ready = true;
    window.SeaTopics.ready = true;
  }

  function start() {
    if (!enabled()) {
      markReady();
      return;
    }
    loadExamples().then(() => {
      make();
      markReady();
      route();
    });
  }

  window.SeaTopics = {
    ready: false,
    open: (on) => open(!!on),
    rows,
    apply: (id) => apply(typeof id === "string" ? byId(id) : id),
    clear: () => clearApplied(),
    state: () => ({
      ready: st.ready,
      open: st.open,
      view: st.view,
      selected: st.selected && st.selected.id,
      applied: st.applied && st.applied.id,
      ask: st.ask && st.ask.want,
      skipped: (st.skipped || []).map((s) => s.id),
      heavyOn: st.heavyOn.slice()
    })
  };

  start();
})();
