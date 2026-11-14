// Test stand-in for YouTube's IFrame Player API (no network). Records what the app asks for, renders a plain box
// in place of the player, reports ready, and lets the test raise a player error to check the skip message.
(function () {
  window.__ytCalls = [];
  function Player(id, opts) {
    var el = document.getElementById(id), box = document.createElement("div");
    box.id = id; box.className = "fake-yt"; box.style.cssText = "position:absolute;inset:0;background:#222";
    el.replaceWith(box);
    this.opts = opts; this.nexts = 0; window.__ytCalls.push(opts); window.__ytPlayer = this;
    var self = this; setTimeout(function () { opts.events.onReady({ target: self }); }, 50);
  }
  Player.prototype.nextVideo = function () { this.nexts++; };
  Player.prototype.destroy = function () { window.__ytDestroyed = (window.__ytDestroyed || 0) + 1; };
  Player.prototype.fail = function (code) { this.opts.events.onError({ data: code, target: this }); };
  Player.prototype.userPlays = function () { this.opts.events.onStateChange && this.opts.events.onStateChange({ data: 1, target: this }); };
  window.YT = { Player: Player };
  setTimeout(function () { window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(); }, 10);
})();
