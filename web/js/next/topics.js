/* Topics navigation (flag topicNav). Glance is the owner's list; overview is a short summary
   and links to existing encyclopedia entries. This slice does not change Sampler, layers or the
   clock, and does not add a Show on the globe action. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FLAG = "topicNav";
  const st = { ready: false, open: false, selected: null, view: "list" };

  function enabled() { return window.SeaFlags && window.SeaFlags.on(FLAG); }

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

  function topicHash(id) {
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

  function make() {
    if ($("topicsPanel") || !enabled()) return;
    const list = rows();
    if (!list.length) return;

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
      st.selected = null;
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
      if (e.key === "Escape" && !panel.hidden) { open(false); e.preventDefault(); }
    });
  }

  function onClick(e) {
    const a = e.target.closest("a[href^='#/topic/']");
    if (!a) return;
    // hashchange will route; keep the default so the URL updates
  }

  function setPressed(on) {
    ["topicsBtn", "mTopicsBtn"].forEach((id) => {
      const b = $(id);
      if (b) b.setAttribute("aria-pressed", String(!!on));
    });
  }

  function open(on) {
    const panel = $("topicsPanel");
    if (!panel) return;
    if (on && window.__sg && window.__sg.log) window.__sg.log(false);
    panel.hidden = !on;
    document.body.classList.toggle("topics-open", !!on);
    setPressed(on);
    st.open = !!on;
    if (on) {
      const h = topicHash();
      if (h.hit && h.id) showOverview(h.id, true);
      else if (h.hit) renderList();
      else { setHash("", true); renderList(); }
      const body = $("topicsBody");
      if (body) setTimeout(() => body.focus(), 0);
    } else {
      st.selected = null;
      st.view = "list";
      clearTopicHash();
    }
  }

  function renderList() {
    st.view = "list";
    st.selected = null;
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
    if (count) count.textContent = "Overview";
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
    body.innerHTML = "<h2>" + esc(t.title) + "</h2><p>" + esc(t.summary) + "</p>" + eras + years + links;
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
    if (window.SeaBells && window.SeaBells.load) {
      window.SeaBells.load().then(() => {
        if (st.view === "overview" && st.selected && st.selected.id === t.id) renderOverview(t);
      });
    }
  }

  function route() {
    if (!enabled()) return;
    const h = topicHash();
    if (!h.hit) {
      if (st.open && /^#\//.test(location.hash || "")) open(false);
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

  function start() {
    if (!enabled()) {
      st.ready = true;
      window.SeaTopics.ready = true;
      return;
    }
    make();
    st.ready = true;
    window.SeaTopics.ready = true;
    route();
  }

  window.SeaTopics = {
    ready: false,
    open: (on) => open(!!on),
    rows,
    state: () => ({ ready: st.ready, open: st.open, view: st.view, selected: st.selected && st.selected.id })
  };

  start();
})();
