/* Digitmask badge shown on every example website: "Want a website like this?" with our logo.
   Add <script src="/examples/dm-promo.js" defer></script> to any new example page. */
(function () {
  var css = ".dmp{position:fixed;right:18px;bottom:18px;z-index:2147483600;display:flex;align-items:center;gap:12px;padding:10px 18px 10px 10px;" +
    "border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);-webkit-backdrop-filter:blur(18px) saturate(1.4);" +
    "backdrop-filter:blur(18px) saturate(1.4);box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.4);color:#fff;" +
    "font:500 14px/1.25 system-ui,-apple-system,Segoe UI,sans-serif;text-decoration:none;cursor:pointer!important;text-shadow:0 1px 6px rgba(0,0,0,.5);" +
    "animation:dmp-in .8s cubic-bezier(.22,1,.36,1) 1.2s both,dmp-glow 3.2s ease-in-out 2s infinite;transition:transform .3s}" +
    ".dmp:hover{transform:translateY(-3px) scale(1.03)}.dmp img{width:38px;height:38px;border-radius:50%;background:#120a1f;object-fit:contain;padding:4px}" +
    ".dmp b{display:block;font-size:15px}.dmp small{opacity:.85;font-size:12px}" +
    "@keyframes dmp-in{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}" +
    "@keyframes dmp-glow{50%{box-shadow:0 10px 46px rgba(160,90,255,.55),inset 0 1px 0 rgba(255,255,255,.4)}}" +
    "@media(max-width:640px){.dmp{right:10px;bottom:10px;padding:8px 14px 8px 8px;font-size:12px}.dmp b{font-size:13px}.dmp img{width:30px;height:30px}}";
  function add() {
    var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
    var a = document.createElement("a"); a.className = "dmp"; a.href = "/contact/"; a.target = "_top";
    a.innerHTML = '<img src="/site/assets/digitmask-mark.png" alt="Digitmask"><span><b>Want a website like this?</b><small>Contact Digitmask →</small></span>';
    document.body.appendChild(a);
  }
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
})();
