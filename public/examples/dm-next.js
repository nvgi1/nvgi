/* "Other example" strip shared by every example website.
   A small glass strip (not a full section) sits at the bottom once you reach the end of the page.
   Keep scrolling down (or swipe up) a few times to fill it and you glide into the next example.
   Pages that don't scroll can tell it when they're at their end with: window.dmAtEnd = function () { return true/false; }
   Add <script src="/examples/dm-next.js" defer></script> to any new example and add it to LIST below. */
(function () {
  var LIST = [
    ["feather-atlas", "Feather Atlas"],
    ["planet-jumping", "Planet Jumping"],
    ["freight-line", "Freight Line"],
    ["world-model", "World Model"]
  ];
  var me = location.pathname.split("/").pop().replace(/\.html$/, ""), i = 0;
  for (var k = 0; k < LIST.length; k++) if (LIST[k][0] === me) i = k;
  var nx = LIST[(i + 1) % LIST.length], url = "/examples/" + nx[0] + ".html";
  var css =
    ".dmn{position:fixed;left:50%;bottom:18px;z-index:2147483590;width:min(420px,calc(100vw - 32px));transform:translate(-50%,30px);opacity:0;visibility:hidden;" +
    "display:flex;align-items:center;gap:14px;padding:10px 16px;border-radius:20px;border:1px solid rgba(255,255,255,.32);" +
    "background:rgba(20,16,28,.42);-webkit-backdrop-filter:blur(16px) saturate(1.3);backdrop-filter:blur(16px) saturate(1.3);" +
    "box-shadow:0 12px 40px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.25);color:#fff;font:500 13px/1.25 system-ui,-apple-system,Segoe UI,sans-serif;" +
    "cursor:pointer!important;text-align:left;transition:opacity .5s,transform .6s cubic-bezier(.22,1,.36,1),visibility .5s}" +
    ".dmn.is-on{opacity:1;visibility:visible;transform:translate(-50%,0)}" +
    ".dmn__t{flex:1;min-width:0}.dmn__t small{display:block;opacity:.7;font-size:11px;letter-spacing:.12em;text-transform:uppercase}" +
    ".dmn__t b{display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".dmn__bar{display:block;height:3px;margin-top:7px;border-radius:3px;background:rgba(255,255,255,.2);overflow:hidden}" +
    ".dmn__bar i{display:block;height:100%;width:100%;transform-origin:left;transform:scaleX(0);border-radius:3px;background:linear-gradient(90deg,#a78bfa,#f0abfc,#fdba74)}" +
    ".dmn__a{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.4);animation:dmn-bob 1.6s ease-in-out infinite}" +
    ".dmn:hover .dmn__a{background:rgba(255,255,255,.18)}" +
    "@keyframes dmn-bob{50%{transform:translateY(4px)}}" +
    ".dmn.is-mini{width:auto;padding:6px 8px 6px 16px;gap:10px;border-radius:999px;bottom:12px}.dmn.is-mini .dmn__t small,.dmn.is-mini .dmn__bar{display:none}" +
    ".dmn.is-mini .dmn__t b{font-size:13px;font-weight:500}.dmn.is-mini .dmn__t b:before{content:\"Other example: \";opacity:.75}.dmn.is-mini .dmn__a{width:26px;height:26px}" +
    "@media(max-width:640px){.dmn.is-mini{bottom:64px}.dmn{bottom:68px;width:min(340px,calc(100vw - 24px));padding:8px 12px}.dmn__t b{font-size:14px}}";
  var el, bar, p = 0, shown = false, gone = false, idleT = 0;
  function atEnd() {
    if (typeof window.dmAtEnd === "function") return !!window.dmAtEnd();
    var s = document.scrollingElement || document.documentElement;
    return s.scrollTop + window.innerHeight >= s.scrollHeight - 6;
  }
  function go() {
    if (gone) return; gone = true; set(1);
    if (window.parent !== window) window.parent.postMessage({ dm: "next-example", url: url }, location.origin);
    else location.href = url;
    setTimeout(function () { gone = false; set(0); }, 2500);
  }
  function set(v) { p = Math.max(0, Math.min(1, v)); if (bar) bar.style.transform = "scaleX(" + p + ")"; }
  function push(d) {
    if (!atEnd()) { set(0); return; }
    el.classList.remove("is-mini"); set(p + d); if (p >= 1) go();
    clearTimeout(idleT); idleT = setTimeout(function relax() { if (p > 0 && !gone) { set(p - .02); idleT = setTimeout(relax, 30); } else if (!gone) el.classList.add("is-mini"); }, 1500);
  }
  function check() { var want = atEnd(); if (want !== shown) { shown = want; el.classList.toggle("is-on", want); if (!want) set(0); } }
  function add() {
    var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
    el = document.createElement("button"); el.type = "button"; el.className = "dmn is-mini";
    el.setAttribute("aria-label", "Go to the other example: " + nx[1]);
    el.innerHTML = '<span class="dmn__t"><small>Other example · keep scrolling ↓</small><b>' + nx[1] + '</b><span class="dmn__bar"><i></i></span></span><span class="dmn__a" aria-hidden="true">↓</span>';
    bar = el.querySelector("i");
    el.addEventListener("click", function (e) { e.stopPropagation(); go(); });
    document.body.appendChild(el);
    setInterval(check, 400); check();
  }
  window.addEventListener("wheel", function (e) { if (e.deltaY > 0) push(Math.min(e.deltaY, 120) / 600); else if (e.deltaY < 0) set(p - .2); }, { passive: true });
  var ty = null;
  window.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchmove", function (e) { if (ty === null) return; var y = e.touches[0].clientY, d = ty - y; ty = y; if (d > 0) push(d / 260); }, { passive: true });
  window.addEventListener("touchend", function () { ty = null; }, { passive: true });
  window.addEventListener("keydown", function (e) { if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { if (e.target && /input|textarea|button/i.test(e.target.tagName)) return; push(.34); } });
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
})();
