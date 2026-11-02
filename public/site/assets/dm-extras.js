(function () {
  if (window.__dmExtras) return;
  window.__dmExtras = true;

  var TRACKS = [
    { title: "Spill Your Time", artist: "KatzPascale", art: "/site/assets/art-syt.jpg", src: null },
    { title: "I Wanna Be Yours", artist: "Arctic Monkeys", art: "/site/assets/art-iwby.jpg", src: "/site/assets/track-i-wanna-be-yours.mp3" },
    { title: "Blinding Lights", artist: "The Weeknd", art: "/site/assets/art-bl.jpg", src: "/site/assets/track-blinding-lights.mp3" }
  ];
  var current = 0, muted = false, bypass = false;
  var alt = new Audio();
  alt.loop = true; alt.preload = "none"; alt.volume = 0.6;

  // Every extra song copies the built-in song's live sound: the same underwater
  // muffling and the same fades (View our work, Projects, Contact, World).
  // The built-in song keeps playing silently and acts as the "guide".
  var fx = null;
  function worldCap() { return /^\/world/.test(location.pathname) ? 4500 : 22000; }
  function ensureFx() {
    if (fx) return fx;
    var H = window.__dmHowler; if (!H || !H.ctx) return null;
    try {
      var ctx = H.ctx, src = ctx.createMediaElementSource(alt), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "lowpass"; f.Q.value = 1; f.frequency.value = 160; g.gain.value = 1;
      src.connect(f); f.connect(g); g.connect(ctx.destination); // skips the site's own mute
      fx = window.__dmSongFx = { ctx: ctx, f: f, g: g };
    } catch (e) { window.__dmFxErr = String(e); return null; }
    return fx;
  }
  function guide() {
    var A = window.__dmAudio; if (!A || !A.sprites || !A.sprites.audio) return null;
    var id = A.activeSounds && A.activeSounds["audio.backing"]; if (id == null) return null;
    var spr = A.sprites.audio, s = spr._soundById ? spr._soundById(id) : null; if (!s) return null;
    var bs = s._node && s._node.bufferSource;
    return { freq: s.filter ? s.filter.frequency.value : 22000, vol: spr.volume(id), rate: bs ? bs.playbackRate.value : 1 };
  }
  var guideAt = 0;
  function keepGuidePlaying() {
    var A = window.__dmAudio;
    if (Date.now() - guideAt < 2500) return;
    guideAt = Date.now();
    if (A && A.play && A.isPlaying && !A.isPlaying("audio.backing")) {
      try {
        A.play({ key: "audio.backing", fade: { from: 0, to: 1, duration: 1 } });
        // Same starting sound the site gives its own song on this page.
        var home = location.pathname === "/" || location.pathname === "";
        A.filterTo({ key: "audio.backing", duration: 1, type: "lowpass", from: { frequency: 14e3 }, to: { frequency: home ? 160 : 2e4 } });
      } catch (e) {}
    }
  }
  setInterval(function () {
    var b = muteBtn();
    var inter = /^\/(notepin|world)(\/|$)/.test(location.pathname);
    if (b && (!b.style.getPropertyValue("--dm-art") || inter !== panel.classList.contains("is-inter"))) render();
    if (!fx || alt.paused) return;
    var t = fx.ctx.currentTime, gd = guide(), inWorld = /^\/world/.test(location.pathname);
    if (!gd) {
      // The site stops its own song inside Digitmask World: keep ours, but softer and dreamier.
      if (inWorld) gd = { freq: 2600, vol: 0.75, rate: 1 };
      else { keepGuidePlaying(); return; }
    }
    fx.f.frequency.setTargetAtTime(Math.max(40, Math.min(gd.freq, worldCap())), t, 0.08);
    // Interstellar owns NotePin and World: the chosen song steps aside there.
    fx.g.gain.setTargetAtTime(window.__dmInterOn ? 0 : Math.max(0, Math.min(1, gd.vol)), t, 0.08);
    var r = Math.max(0.5, Math.min(1, gd.rate || 1));
    if (Math.abs(alt.playbackRate - r) > 0.01) { alt.preservesPitch = false; alt.playbackRate = r; }
  }, 60);

  function muteBtn() { return document.querySelector(".js-global-mute-btn"); }
  function siteMuted() { var h = window.__dmHowler; return h ? !!h._muted : false; }
  function setSiteMute(m) {
    var b = muteBtn();
    if (!b || siteMuted() === m) return;
    bypass = true; b.click(); bypass = false;
  }

  // Panel
  var panel = document.createElement("div");
  panel.className = "dm-music";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Choose music");
  panel.innerHTML =
    '<p class="dm-music__label">Now playing</p><ul class="dm-music__list">' +
    TRACKS.map(function (t, i) {
      return '<li><button type="button" class="dm-music__track" data-i="' + i + '">' +
        '<img src="' + t.art + '" alt="" width="40" height="40">' +
        '<span><b>' + t.title + '</b><small>' + t.artist + '</small></span>' +
        '<i class="dm-music__eq" aria-hidden="true"><em></em><em></em><em></em></i></button></li>';
    }).join("") +
    '<li class="dm-music__inter"><button type="button" class="dm-music__track dm-music__track--inter is-active">' +
    '<img src="/site/assets/art-interstellar.jpg" alt="" width="40" height="40"><span><b>Interstellar</b><small>Hans Zimmer</small></span>' +
    '<i class="dm-music__eq" aria-hidden="true"><em></em><em></em><em></em></i></button></li>' +
    '</ul><button type="button" class="dm-music__mute"><span class="dm-music__mute-icon" aria-hidden="true"></span><span class="dm-music__mute-text">Mute</span></button>';
  document.body.appendChild(panel);

  function render() {
    panel.querySelectorAll(".dm-music__track").forEach(function (el) {
      if (el.dataset.i != null) el.classList.toggle("is-active", +el.dataset.i === current);
    });
    var inter = /^\/(notepin|world)(\/|$)/.test(location.pathname);
    panel.classList.toggle("is-inter", inter);
    panel.classList.toggle("is-muted", muted);
    panel.querySelector(".dm-music__mute-text").textContent = muted ? "Unmute" : "Mute";
    var b = muteBtn();
    if (b) b.style.setProperty("--dm-art", "url('" + (inter ? "/site/assets/art-interstellar.jpg" : TRACKS[current].art) + "')");
  }
  function play() {
    if (muted) return;
    if (current === 0) { alt.pause(); setSiteMute(false); }
    else {
      setSiteMute(true);
      if (alt.dataset.i !== String(current)) { alt.src = TRACKS[current].src; alt.dataset.i = String(current); alt.currentTime = 0; }
      if (ensureFx() && fx.ctx.state === "suspended") fx.ctx.resume();
      keepGuidePlaying();
      alt.play().catch(function () {});
    }
  }
  function open(v) {
    panel.classList.toggle("is-open", v);
    var b = muteBtn(); if (b) b.classList.toggle("dm-open", v);
  }

  document.addEventListener("click", function (e) {
    if (bypass) return;
    var b = e.target.closest && e.target.closest(".js-global-mute-btn");
    if (b) { e.preventDefault(); e.stopImmediatePropagation(); open(!panel.classList.contains("is-open")); render(); return; }
    var t = e.target.closest && e.target.closest(".dm-music__track");
    if (t && t.classList.contains("dm-music__track--inter")) { if (muted) { muted = false; window.__dmMusicMuted = false; play(); } render(); return; }
    if (t) { current = +t.dataset.i; muted = false; play(); render(); return; }
    if (e.target.closest && e.target.closest(".dm-music__mute")) {
      muted = !muted; window.__dmMusicMuted = muted;
      if (muted) { alt.pause(); setSiteMute(true); } else play();
      render(); return;
    }
    if (!e.target.closest || !e.target.closest(".dm-music")) open(false);
  }, true);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) alt.pause();
    else if (!muted && current !== 0) alt.play().catch(function () {});
  });

  // Contact: "Start a project" tab + form
  document.addEventListener("click", function (e) {
    var tb = e.target.closest && e.target.closest(".js-content-toggle-btn");
    if (!tb) return;
    var on = tb.dataset.togglecontent === "project";
    document.querySelectorAll(".dm-brief").forEach(function (f) { f.classList.toggle("is-visible", on); });
    if (on && innerWidth < 768) openSheet();
  });

  // Phones: the 3D contact card can't scroll, so show the form as a steady full-screen sheet.
  var sheet = null, home = null;
  function openSheet() {
    var f = document.querySelector(".dm-brief"); if (!f || sheet) return;
    home = { parent: f.parentNode, next: f.nextSibling, form: f };
    sheet = document.createElement("div"); sheet.className = "dm-sheet";
    sheet.innerHTML = '<button type="button" class="dm-sheet__close" aria-label="Close">&times;</button>';
    sheet.appendChild(f); document.body.appendChild(sheet);
    document.documentElement.classList.add("dm-sheet-open");
  }
  function closeSheet() {
    if (!sheet) return;
    home.parent.insertBefore(home.form, home.next); home.form.classList.remove("is-visible");
    sheet.remove(); sheet = null;
    document.documentElement.classList.remove("dm-sheet-open");
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".dm-sheet__close")) closeSheet();
  });
  document.addEventListener("touchmove", function (e) { if (sheet) e.stopPropagation(); }, { capture: true, passive: true });
  document.addEventListener("wheel", function (e) { if (sheet) e.stopPropagation(); }, { capture: true, passive: true });
  setInterval(function () { if (sheet && !/^\/contact/.test(location.pathname)) closeSheet(); }, 500);

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.classList || !f.classList.contains("dm-brief")) return;
    e.preventDefault();
    var err = f.querySelector(".dm-brief__error");
    var services = [].slice.call(f.querySelectorAll('input[name="service"]:checked')).map(function (x) { return x.value; });
    var v = function (n) { return f.querySelector("[name=" + n + "]").value.trim(); }; var name = v("name"), phone = v("phone"), email = v("email");
    var msg = "";
    if (!services.length) msg = "Please choose at least one service.";
    else if (!name) msg = "Please enter your name.";
    else if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) msg = "Please enter a valid phone number.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) msg = "Please enter a valid email.";
    err.textContent = msg;
    if (msg) return;
    f.querySelector(".dm-brief__done").hidden = false;
    f.querySelector(".dm-brief__submit").disabled = true;
  });

  render();
})();

/* Copyright notice and light copy protection */
(function () {
  try { console.log("%c© 2026 Digitmask — All rights reserved. Unauthorized copying is prohibited.", "font-weight:bold"); } catch (e) {}
  document.addEventListener("contextmenu", function (e) {
    if (e.target && e.target.closest && e.target.closest("input, textarea")) return;
    e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });
})();
/* NotePin: the Projects water scene showing only the NotePin tiles. From Home the
   same dive plays upwards (theme flips the camera for /notepin/). */
(function () {
  var btn, last = "";
  function isNp(p) { return /^\/notepin\/?$/.test(p); }
  function isPr(p) { return /^\/projects\/?$/.test(p); }
  function names(np) {
    return (window.projects || []).filter(function (e) {
      var c = e.project.project_grid_category || [];
      return np ? c.indexOf("experiment") > -1 && /^dm-np-/.test(e.images[0].name) : !/^dm-np-/.test(e.images[0].name);
    }).map(function (e) { return e.project.title; });
  }
  function apply(np) {
    var G = window.__dmG, PM = G && G.ProjectMenu;
    if (!PM || !PM.projects || !PM.projects.children.length || !window.__dmEmit) return false;
    // Wait for any running card animation, otherwise the two clash and cards stay missing.
    if (PM.animatingFilter) return false;
    // Keep the filter buttons in step with the cards: "All" is the active one.
    if (!np) document.querySelectorAll(".js-project-filters\\:filterBtn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.filter === "all");
    });
    window.__dmEmit("ProjectFilters:change", names(np)); return true;
  }
  function make() {
    btn = document.createElement("a");
    btn.href = "/notepin/"; btn.className = "dm-rise"; btn.setAttribute("aria-label", "Rise up to PLAUD NotePin");
    btn.innerHTML = '<span class="dm-rise__arrow">↑</span><span>PLAUD NotePin</span>';
    document.body.appendChild(btn);
    var go = function (e) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (go.busy) return; go.busy = true; window.__dmGoingNp = Date.now(); setTimeout(function () { go.busy = false; }, 1500);
      var H = window.__dmG && window.__dmG.Highway;
      try { if (H && H.redirect) H.redirect(location.origin + "/notepin/"); else location.href = "/notepin/"; }
      catch (er) { location.href = "/notepin/"; }
      // If the scene ignores the request, open the page anyway.
      setTimeout(function () { if (!isNp(location.pathname)) location.href = "/notepin/"; }, 2500);
    };
    btn.addEventListener("click", go, true);
    btn.addEventListener("pointerdown", function (e) { e.stopPropagation(); }, true);
  }
  document.addEventListener("click", function (e) {
    if (!e.isTrusted) return; var a = e.target.closest && e.target.closest("a[href], .dm-rise, .dm-nav-np"); if (!a || a.closest(".dm-music, .dm-sheet")) return;
    if (a.closest(".dm-npx") && !/^\/(contact|projects|world)?\/?$/.test(new URL(a.href || location.href, location.href).pathname) && !a.classList.contains("dm-nav-np")) return;
    var H = window.__dmG && window.__dmG.Highway, now = Date.now();
    if ((H && H.running) || now - (window.__dmNavAt || 0) < 2200) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return; }
    if (a.href && new URL(a.href, location.href).origin === location.origin) window.__dmNavAt = now;
  }, true);
  // Projects <-> NotePin share one scene: switch with a normal page load.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var to = new URL(a.href, location.href).pathname, from = location.pathname;
    if ((isNp(from) && isPr(to)) || (isPr(from) && isNp(to))) { e.preventDefault(); e.stopPropagation(); location.href = to; }
  }, true);
  var pending = null, shownAt = 0;
  // Filter buttons: we choose the cards ourselves (never the hidden NotePin ones) and retry
  // until the scene is free, so pressing any filter — or All — always shows its cards.
  function showFilter(f, tries) {
    var G = window.__dmG, PM = G && G.ProjectMenu;
    if (!PM || !PM.projects || !PM.projects.children.length || !window.__dmEmit || PM.animatingFilter) {
      if ((tries || 0) < 40) setTimeout(function () { showFilter(f, (tries || 0) + 1); }, 120); return;
    }
    var list = (window.projects || []).filter(function (e) {
      var c = e.project.project_grid_category || [];
      return !/^dm-np-/.test(e.images[0].name) && (f === "all" || c.indexOf(f) > -1);
    }).map(function (e) { return e.project.title; });
    if (!list.length) list = names(false);
    window.__dmEmit("ProjectFilters:change", list);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".js-project-filters\\:filterBtn"); if (!b || !b.dataset.filter) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    document.querySelectorAll(".js-project-filters\\:filterBtn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    showFilter(b.dataset.filter);
  }, true);
  // Arriving on Projects: make sure All is loaded, checking again a few times in case the scene was busy.
  var prWas = false;
  setInterval(function () {
    var on = isPr(location.pathname);
    if (on && !prWas) [400, 1500, 3500].forEach(function (t) { setTimeout(function () {
      if (!isPr(location.pathname)) return;
      var act = document.querySelector(".js-project-filters\\:filterBtn.is-active");
      if (!act || act.dataset.filter === "all") showFilter("all");
    }, t); });
    prWas = on;
  }, 250);
  // Every frame: Services tiles only show on Projects, or on Home when not coming from / going to NotePin.
  (function tiles() {
    var p = location.pathname, PMg = window.__dmG && window.__dmG.ProjectMenu && window.__dmG.ProjectMenu.projects;
    var want = isPr(p) || (!isNp(p) && !window.__dmFromNp && !(window.__dmGoingNp && Date.now() - window.__dmGoingNp < 7000));
    if (PMg && "visible" in PMg && PMg.visible !== want) {
      PMg.visible = want;
      // Coming back into view: reload the cards exactly like pressing "All", so none stay missing.
      if (want) setTimeout(function () { if (!apply(isNp(location.pathname))) pending = isNp(location.pathname); }, 60);
    }
    requestAnimationFrame(tiles);
  })();
  setInterval(function () {
    if (!document.body) return; if (!btn) make();
    var p = location.pathname;
    if (p !== last) { last = p; pending = isNp(p) ? true : isPr(p) ? false : null; }
    if (pending !== null && apply(false)) pending = null;
    // NotePin floats over empty water: the Projects tiles are hidden there.
    var PMg = window.__dmG && window.__dmG.ProjectMenu && window.__dmG.ProjectMenu.projects;
    if (isNp(p)) window.__dmGoingNp = 0;
    var L = document.querySelector(".loader.js-loader"), cs = L && getComputedStyle(L);
    var M = document.querySelector(".js-menu"), mOpen = M && M.classList.contains("is-open");
    var show = !mOpen && p === "/" && (!L || cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < .1);
    if (show && !shownAt) shownAt = Date.now(); if (!show) shownAt = 0;
    btn.classList.toggle("is-visible", show && Date.now() - shownAt > 1500);
  }, 250);
})();

/* Interstellar: plays from 2:10 (file is pre-trimmed) and loops, ONLY on NotePin and World.
   Everywhere else it is fully stopped. While it plays, the other music steps aside so two
   songs never overlap. Respects the music panel's mute. */
(function () {
  var a = new Audio();
  a.loop = true; a.preload = "none"; a.volume = 0;
  var SRC = "/site/assets/track-interstellar.mp3?v=1";
  var unlocked = false, vol = 0, ducked = false, duckAt = 0;
  function here() { return /^\/(notepin|world)(\/|$)/.test(location.pathname); }
  function target() {
    if (document.hidden || window.__dmMusicMuted || !here()) return 0;
    return 0.55;
  }
  function start() {
    if (!a.src) a.src = SRC;
    a.play().catch(function () {});
  }
  function unlock() { unlocked = true; if (target() > 0 && a.paused) start(); }
  ["click", "touchend", "keydown"].forEach(function (ev) { document.addEventListener(ev, unlock, true); });
  function duck(on) {
    var H = window.__dmHowler; if (!H || !H.masterGain || !H.ctx) return;
    if (on === ducked && !(on && H.masterGain.gain.value > 0.05 && Date.now() - duckAt > 1500)) return;
    ducked = on; duckAt = Date.now();
    try {
      var g = H.masterGain.gain, t = H.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
      g.setTargetAtTime(on || H._muted ? 0 : (H._volume == null ? 1 : H._volume), t, 0.25);
    } catch (e) {}
  }
  setInterval(function () {
    var t = target();
    window.__dmInterOn = t > 0;
    duck(t > 0);
    if (t > 0 && unlocked && a.paused) start();
    vol += (t - vol) * 0.1; if (Math.abs(t - vol) < 0.004) vol = t;
    a.volume = Math.max(0, Math.min(1, vol));
    if (t === 0 && vol === 0 && !a.paused) a.pause();
  }, 50);
})();

/* NotePin page: its own dusk-coloured layer over the water scene. The product floats on a
   see-through background with features spread down the page (no project tiles). It opens
   on its own timer, so it never waits on the 3D scene. */
(function () {
  var el, shownAt = 0, entered = 0, leftAt = 0, doneAt = 0;
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".js-enter-btn, .js-enter-no-audio-btn, .loader button")) entered = Date.now();
  }, true);
  var F = [
    ["Records every word", "One tap. Crystal-clear audio from across the table."],
    ["Writes it for you", "Accurate transcripts in 112 languages, Arabic included."],
    ["Summaries by morning", "Key points, deadlines and action items, ready to file."],
    ["Private by design", "Encrypted end to end. Your client files stay yours."]
  ];
  var V = [["/site/assets/np-product.png", "Front"], ["/site/assets/np-product.png", "Angle"], ["/site/assets/np-product.png", "Detail"]];
  function show(i) {
    el.querySelectorAll(".dm-npx__shot").forEach(function (x, k) { x.classList.toggle("is-on", k === i); });
    el.querySelectorAll(".dm-npx__view").forEach(function (x, k) { x.classList.toggle("is-on", k === i); });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".dm-npx__view"); if (b) show(+b.dataset.v);
  });
  function build() {
    el = document.createElement("section"); el.className = "dm-npx"; el.setAttribute("aria-label", "PLAUD NotePin");
    el.innerHTML =
      '<div class="dm-npx__glow"></div>' +
      '<header class="dm-npx__hero"><div class="dm-npx__copy dm-glass"><p class="dm-npx__kicker">Digitmask × PLAUD</p>' +
      '<h2 class="dm-npx__title">PLAUD<br><em>NotePin</em></h2>' +
      '<p class="dm-npx__lead">The AI note-taker trusted by leading lawyers and law firms.</p>' +
      '<ul class="dm-npx__stats"><li><b>112</b><span>languages</span></li><li><b>20h</b><span>recording</span></li><li><b>30g</b><span>weight</span></li></ul>' +
      '<a class="dm-npx__btn" href="mailto:hello@digitmask.com?subject=NotePin%20subscription">Subscribe · AED 800 / month</a></div>' +
      '<div class="dm-npx__product"><div class="dm-npx__stage">' + V.map(function (v, i) {
        return '<img class="dm-npx__shot dm-npx__shot--' + i + (i ? '' : ' is-on') + '" src="' + v[0] + '" alt="PLAUD NotePin, ' + v[1] + '" width="1024" height="1024">';
      }).join("") + '</div><div class="dm-npx__views dm-glass" role="tablist" aria-label="Product views">' + V.map(function (v, i) {
        return '<button type="button" class="dm-npx__view' + (i ? '' : ' is-on') + '" data-v="' + i + '" aria-label="' + v[1] + '"><img src="' + v[0] + '" alt="" width="56" height="56"><span>' + v[1] + '</span></button>';
      }).join("") + '</div></div></header>' +
      '<div class="dm-npx__feats">' + F.map(function (f, i) {
        return '<div class="dm-npx__feat dm-glass dm-npx__feat--' + i + '"><span>0' + (i + 1) + '</span><h3>' + f[0] + '</h3><p>' + f[1] + '</p></div>';
      }).join("") + '</div>' +
      '<section class="dm-npx__how"><p class="dm-npx__kicker">How it works</p><h2 class="dm-npx__h2">Three steps. Zero typing.</h2><ol>' +
        '<li class="dm-glass"><b>1</b><h3>Press</h3><p>Squeeze once. A soft buzz tells you it is listening.</p></li>' +
        '<li class="dm-glass"><b>2</b><h3>Talk</h3><p>Hold the meeting as usual. NotePin catches every voice in the room.</p></li>' +
        '<li class="dm-glass"><b>3</b><h3>Read</h3><p>Open the app for a clean transcript, summary and action list.</p></li></ol></section>' +
      '<section class="dm-npx__specs dm-glass"><h2 class="dm-npx__h2">Made for the way lawyers work</h2><dl>' +
        '<div><dt>Wear it your way</dt><dd>Clip, magnetic pin, wristband or necklace</dd></div>' +
        '<div><dt>Languages</dt><dd>112, including Arabic and English</dd></div>' +
        '<div><dt>Battery</dt><dd>A full working day of recording</dd></div>' +
        '<div><dt>Weight</dt><dd>Lighter than a key</dd></div>' +
        '<div><dt>Privacy</dt><dd>Encrypted, your files stay yours</dd></div>' +
        '<div><dt>Support</dt><dd>Set up and support by Digitmask in the UAE</dd></div></dl></section>' +
      '<section class="dm-npx__faq"><h2 class="dm-npx__h2">Questions</h2>' +
        '<details class="dm-glass"><summary>Is the device included?</summary><p>Yes. The monthly plan includes the NotePin, the AI service and support.</p></details>' +
        '<details class="dm-glass"><summary>Does it understand Arabic?</summary><p>Yes, and it can mix Arabic and English in the same meeting.</p></details>' +
        '<details class="dm-glass"><summary>Can I cancel?</summary><p>Anytime. Just tell us and we collect the device.</p></details></section>' +
'<footer class="dm-npx__price dm-glass"><p class="dm-npx__kicker">One simple plan</p><p class="dm-npx__amount">AED 800<small> / month</small></p>' +
      '<p class="dm-npx__lead">Device, AI transcription and support included. Cancel anytime.</p>' +
      '<a class="dm-npx__btn" href="/contact/">Talk to us</a></footer>';
    ["wheel", "touchmove", "touchstart", "pointerdown", "mousedown"].forEach(function (ev) {
      el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
    document.body.appendChild(el);
  }
  // Top-menu NotePin link: same rise as the Home button.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".dm-nav-np"); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    if (/^\/notepin/.test(location.pathname)) return;
    var r = document.querySelector(".dm-rise");
    if (location.pathname === "/" && r) { r.click(); return; }
    location.href = "/notepin/";
  }, true);
  setInterval(function () {
    if (!document.body) return; if (!el) build();
    var on = /^\/notepin/.test(location.pathname);
    document.documentElement.classList.toggle("dm-on-np", on);
    if (on) { window.__dmFromNp = true; leftAt = 0; }
    else if (window.__dmFromNp) { if (!leftAt) leftAt = Date.now(); else if (Date.now() - leftAt > 4000) window.__dmFromNp = false; }
    if (!on) {
      shownAt = 0;
      // Projects is a different place: never let the NotePin layer linger there.
      el.classList.toggle("is-instant", /^\/projects/.test(location.pathname));
      el.classList.remove("is-visible");
      if (!window.__dmFromNp) el.scrollTop = 0;
      return;
    }
    el.classList.remove("is-instant");
    if (!shownAt) shownAt = Date.now();
    var L = document.querySelector(".loader.js-loader"), cs = L && getComputedStyle(L);
    if (L && entered && +cs.opacity < .6) L.style.visibility = "hidden";
    var ready = !L || cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < .1;
    // Show after the rise finishes, or 4s after Enter whatever the scene is doing.
    // Appear only once the rise above the water has finished (fallback if the scene stalls).
    var H = window.__dmG && window.__dmG.Highway, moving = H && H.running;
    if (moving || !ready) doneAt = 0; else if (!doneAt) doneAt = Date.now();
    if (doneAt || Date.now() - shownAt > 7000) { el.classList.add("is-visible"); if (L && ready) L.style.visibility = "hidden"; }
  }, 200);
})();


/* Smoothness: picture sharpness follows the device. The scene starts at a level chosen from
   the phone/computer's strength, then steps down if frames drop and back up if there is room. */
(function () {
  var frames = 0, since = 0, steps = 0, last = location.pathname, quietUntil = 0;
  function gl() { var G = window.__dmG; return G && G.Gl && G.Gl.renderer ? G.Gl : null; }
  function setPR(pr) {
    var G = gl(), o = window.__dmG; if (!G) return;
    try {
      G.renderer.setPixelRatio(pr); G.composer.setPixelRatio(pr);
      var w = o.window.w, h = o.window.fullHeight;
      G.composer.setSize(w, h);
      if (G.fxaaPass) G.fxaaPass.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
      if (G.globalUniforms && G.globalUniforms.u_resolution) G.globalUniforms.u_resolution.value.set(w * pr, h * pr);
    } catch (e) {}
  }
  function ready() {
    var L = document.querySelector(".loader.js-loader"), cs = L && getComputedStyle(L);
    return !L || cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < .1;
  }
  function tick(now) {
    requestAnimationFrame(tick);
    if (location.pathname !== last) { last = location.pathname; quietUntil = now + 3500; frames = 0; since = 0; }
    if (document.hidden || now < quietUntil || !ready() || !gl()) { frames = 0; since = 0; return; }
    if (!since) { since = now; frames = 0; return; }
    frames++;
    if (now - since < 3000) return;
    var fps = frames * 1000 / (now - since); frames = 0; since = now;
    var G = gl(), pr = G.renderer.getPixelRatio(), cap = window.__dmPR || 1.5;
    var floor = matchMedia("(pointer:coarse)").matches ? 0.75 : 1;
    if (fps < 45 && pr > floor + 0.01) { setPR(Math.max(floor, pr - 0.25)); steps++; }
    else if (fps > 58 && pr < cap - 0.01 && steps < 6) { setPR(Math.min(cap, pr + 0.25)); steps++; }
  }
  requestAnimationFrame(tick);
})();

/* Examples open inside the site: the water slides away to the left and the example glides in from the right. */
(function () {
  var box = null, busy = 0, oldTitle = "", fetched = {};
  var NAMES = { "feather-atlas": "Feather Atlas", "planet-jumping": "Planet Jumping", "freight-line": "Freight Line", "world-model": "World Model" };
  var ORDER = ["feather-atlas", "planet-jumping", "freight-line", "world-model"];
  function nextOf() { var f = box && box.querySelector("iframe:last-of-type"), k = f ? f.getAttribute("src").split("/").pop().replace(/\.html$/, "") : ""; return "/examples/" + ORDER[(ORDER.indexOf(k) + 1) % ORDER.length] + ".html"; }
  function nameOf(u) { var k = u.split("/").pop().replace(/\.html$/, ""); return NAMES[k] || k.replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  // Warm the example up as soon as a finger or mouse gets near its card, so it opens fast.
  function warm(u) {
    u = new URL(u, location.href).pathname; if (fetched[u]) return; fetched[u] = 1;
    var l = document.createElement("link"); l.rel = "prefetch"; l.href = u; document.head.appendChild(l);
    if (/feather/.test(u)) ["https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"].forEach(function (h) {
      var m = document.createElement("link"); m.rel = "modulepreload"; m.href = h; m.crossOrigin = "anonymous"; document.head.appendChild(m);
    });
  }
  ["pointerover", "touchstart", "focusin"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { var a = e.target.closest && e.target.closest("a[href]"); if (a && isEx(a.href)) warm(a.href); }, { passive: true, capture: true });
  });
  function isEx(u) { try { return /^\/examples\//.test(new URL(u, location.href).pathname); } catch (e) { return false; } }
  function close() {
    if (!box) return; var b = box; box = null;
    b.classList.remove("is-on"); document.documentElement.classList.remove("dm-siding");
    if (oldTitle) { document.title = oldTitle; oldTitle = ""; }
    setTimeout(function () { b.remove(); }, 1200);
  }
  function open(url) {
    if (Date.now() - busy < 1300) return; busy = Date.now();
    url = new URL(url, location.href).pathname;
    if (!oldTitle) oldTitle = document.title; document.title = nameOf(url) + " — Digitmask Example";
    if (box) { // next example: slide the current one away, the next one in
      var old = box.querySelector("iframe"), f = document.createElement("iframe");
      f.src = url; f.title = "Example"; f.className = "dm-ex__f is-next"; box.appendChild(f);
      requestAnimationFrame(function () { requestAnimationFrame(function () { old.classList.add("is-out"); f.classList.remove("is-next"); }); });
      setTimeout(function () { old.remove(); }, 1300); return;
    }
    box = document.createElement("div"); box.className = "dm-ex";
    box.innerHTML = '<iframe class="dm-ex__f" title="Example" allow="autoplay; fullscreen"></iframe><button class="dm-ex__back" type="button">← Back to Examples</button>';
    box.querySelector("iframe").src = url;
    box.querySelector("button").addEventListener("click", close);
    document.body.appendChild(box); document.documentElement.classList.add("dm-siding");
    requestAnimationFrame(function () { requestAnimationFrame(function () { box && box.classList.add("is-on"); }); });
  }
  window.__dmOpenExample = open;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && isEx(a.href) && !a.closest(".dm-ex")) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); open(a.href); }
  }, true);
  ["pushState", "replaceState"].forEach(function (k) {
    var f = history[k];
    history[k] = function (st, t, u) { if (u && isEx(u)) { open(u); return; } return f.apply(this, arguments); };
  });
  var hooked = setInterval(function () {
    var H = window.__dmG && window.__dmG.Highway; if (!H || !H.redirect || H.redirect.__dm) return;
    var r = H.redirect; H.redirect = function (u) { if (u && isEx(u)) return open(u); return r.apply(this, arguments); }; H.redirect.__dm = 1; clearInterval(hooked);
  }, 300);
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.dm === "next-example") open(typeof e.data.url === "string" && isEx(e.data.url) ? e.data.url : nextOf());
    if (e.data.dm === "close-example") close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
})();
