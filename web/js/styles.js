/* The page's Content-Security-Policy allows no inline style attributes. Markup built in code carries
   data-style="..." instead, and this applies it through the DOM (el.style), which the policy allows. */
(function () {
  "use strict";
  function apply(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.hasAttribute("data-style")) { root.style.cssText = root.getAttribute("data-style"); root.removeAttribute("data-style"); }
    root.querySelectorAll("[data-style]").forEach((el) => { el.style.cssText = el.getAttribute("data-style"); el.removeAttribute("data-style"); });
  }
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(apply))).observe(document.documentElement, { childList: true, subtree: true });
  window.SeaStyles = { apply };
})();
