(function () {
  if (window.__dmExtras) return;
  window.__dmExtras = true;

  var TRACKS = [
    { title: "Spill Your Time", artist: "KatzPascale", art: "/site/assets/art-syt.jpg", src: null },
    { title: "I Wanna Be Yours", artist: "Arctic Monkeys", art: "/site/assets/art-iwby.jpg", src: "/site/assets/track-i-wanna-be-yours.mp3" },
    { title: "Blinding Lights", artist: "The Weeknd", art: "/site/assets/art-bl.jpg", src: "/site/assets/track-blinding-lights.mp3" }
  ];
  var AR = document.documentElement.lang === "ar";
  var current = 0, muted = false, bypass = false;
  var userVol = 1;
  try { userVol = Math.max(0, Math.min(1, parseFloat(localStorage.getItem("dmVol")) || 1)); } catch (e) {}
  window.__dmUserVol = userVol;
  var alt = new Audio();
  alt.loop = true; alt.preload = "none"; alt.volume = 0.6 * userVol;

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
    var inter = /^\/world(\/|$)/.test(location.pathname);
    if (b && (!b.style.getPropertyValue("--dm-art") || inter !== panel.classList.contains("is-inter"))) render();
    // Guard: an extra song is on, so the site's own song must stay silent (no two songs at once).
    if (!alt.paused && current !== 0 && !muted && !siteMuted() && Date.now() - (window.__dmMuteFixAt || 0) > 1500) { window.__dmMuteFixAt = Date.now(); setSiteMute(true); }
    if (!fx || alt.paused) return;
    var t = fx.ctx.currentTime, gd = guide(), inWorld = /^\/world/.test(location.pathname);
    if (!gd) {
      // The site stops its own song inside the World page: keep ours, but softer and dreamier.
      if (inWorld) gd = { freq: 2600, vol: 0.75, rate: 1 };
      else { keepGuidePlaying(); return; }
    }
    fx.f.frequency.setTargetAtTime(Math.max(40, Math.min(gd.freq, worldCap())), t, 0.08);
    // Interstellar owns World: the chosen song steps aside there.
    fx.g.gain.setTargetAtTime(window.__dmInterOn ? 0 : Math.max(0, Math.min(1, gd.vol)) * userVol, t, 0.08);
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
  panel.setAttribute("aria-label", AR ? "اختر الموسيقى" : "Choose music");
  panel.innerHTML =
    '<p class="dm-music__label">' + (AR ? "يعمل الآن" : "Now playing") + '</p><ul class="dm-music__list">' +
    TRACKS.map(function (t, i) {
      return '<li><button type="button" class="dm-music__track" data-i="' + i + '">' +
        '<img src="' + t.art + '" alt="" width="40" height="40">' +
        '<span><b>' + t.title + '</b><small>' + t.artist + '</small></span>' +
        '<i class="dm-music__eq" aria-hidden="true"><em></em><em></em><em></em></i></button></li>';
    }).join("") +
    '<li class="dm-music__inter"><button type="button" class="dm-music__track dm-music__track--inter is-active">' +
    '<img src="/site/assets/art-interstellar.jpg" alt="" width="40" height="40"><span><b>Interstellar</b><small>Hans Zimmer</small></span>' +
    '<i class="dm-music__eq" aria-hidden="true"><em></em><em></em><em></em></i></button></li>' +
    '</ul><div class="dm-music__vol"><span aria-hidden="true">🔈</span>' +
    '<input type="range" class="dm-music__vol-range" min="0" max="100" value="' + Math.round(userVol * 100) + '" aria-label="' + (AR ? "مستوى الصوت" : "Volume") + '">' +
    '<span aria-hidden="true">🔊</span></div>' +
    '<button type="button" class="dm-music__mute"><span class="dm-music__mute-icon" aria-hidden="true"></span><span class="dm-music__mute-text">' + (AR ? "كتم الصوت" : "Mute") + '</span></button>';
  document.body.appendChild(panel);

  function render() {
    panel.querySelectorAll(".dm-music__track").forEach(function (el) {
      if (el.dataset.i != null) el.classList.toggle("is-active", +el.dataset.i === current);
    });
    var inter = /^\/world(\/|$)/.test(location.pathname);
    panel.classList.toggle("is-inter", inter);
    panel.classList.toggle("is-muted", muted);
    panel.querySelector(".dm-music__mute-text").textContent = muted ? (AR ? "تشغيل الصوت" : "Unmute") : (AR ? "كتم الصوت" : "Mute");
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

  // Volume slider: controls the extra songs, the site's own song and Interstellar together.
  panel.querySelector(".dm-music__vol-range").addEventListener("input", function (e) {
    userVol = Math.max(0, Math.min(1, (+e.target.value || 0) / 100));
    window.__dmUserVol = userVol;
    alt.volume = 0.6 * userVol;
    var H = window.__dmHowler;
    if (H) {
      H._volume = userVol;
      if (H.masterGain && H.ctx && !H._muted && !window.__dmInterOn) {
        try { H.masterGain.gain.setTargetAtTime(userVol, H.ctx.currentTime, 0.1); } catch (err) {}
      }
    }
    try { localStorage.setItem("dmVol", String(userVol)); } catch (err) {}
  });

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
    if (!services.length) msg = AR ? "اختر خدمة واحدة على الأقل." : "Please choose at least one service.";
    else if (!name) msg = AR ? "اكتب اسمك من فضلك." : "Please enter your name.";
    else if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) msg = AR ? "اكتب رقم هاتف صحيح." : "Please enter a valid phone number.";
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) msg = AR ? "اكتب بريدًا إلكترونيًا صحيحًا." : "Please enter a valid email.";
    err.textContent = msg;
    if (msg) return;
    var lines = [AR ? "طلب مشروع جديد" : "New project request",
      (AR ? "الخدمة: " : "Service: ") + services.join(", "),
      (AR ? "الاسم: " : "Name: ") + name, (AR ? "الهاتف: " : "Phone: ") + phone, (AR ? "البريد: " : "Email: ") + email];
    var det = v("details"); if (det) lines.push((AR ? "التفاصيل: " : "Details: ") + det);
    window.open("https://wa.me/201222576172?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
    f.querySelector(".dm-brief__done").hidden = false;
  });

  render();
})();

/* Copyright notice and light copy protection */
(function () {
  try { console.log("%c© 2026 Abdelrahman Studio — All rights reserved. Unauthorized copying is prohibited.", "font-weight:bold"); } catch (e) {}
  document.addEventListener("contextmenu", function (e) {
    if (e.target && e.target.closest && e.target.closest("input, textarea")) return;
    e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });
})();
/* Projects: the filter buttons choose which service cards the water scene shows. */
(function () {
  function isPr(p) { return /^\/projects\/?$/.test(p); }
  function names() {
    return (window.projects || []).map(function (e) { return e.project.title; });
  }
  function apply() {
    var G = window.__dmG, PM = G && G.ProjectMenu;
    if (!PM || !PM.projects || !PM.projects.children.length || !window.__dmEmit) return false;
    // Wait for any running card animation, otherwise the two clash and cards stay missing.
    if (PM.animatingFilter || (G.Highway && G.Highway.running)) return false;
    // Keep the filter buttons in step with the cards: "All" is the active one.
    document.querySelectorAll(".js-project-filters\\:filterBtn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.filter === "all");
    });
    if (needs(names())) emit(names()); return true;
  }
  var lastList = null, busySince = 0;
  function emit(list) { lastList = list; window.__dmEmit("ProjectFilters:change", list); }
  // If a page change interrupts the card animation, the scene stays "busy" forever and the
  // cards freeze. Finish it ourselves so the cards and filters always keep working.
  function unstick(now) {
    var PM = window.__dmG && window.__dmG.ProjectMenu; if (!PM || !PM.projects) return;
    if (!PM.animatingFilter) { busySince = 0; return; }
    if (!busySince) { busySince = now; return; }
    if (now - busySince < 2600) return;
    busySince = 0;
    var list = lastList || names();
    try {
      PM.projects.children.forEach(function (c) {
        var on = list.indexOf(c.name) > -1; c.visible = on;
        if (on) { c.position.z = 1000; [0, 1].forEach(function (k) { var m = c.children[k] && c.children[k].material; if (m && m.uniforms && m.uniforms.u_opacity) m.uniforms.u_opacity.value = 1; }); }
      });
      PM.positionProjects && PM.positionProjects();
    } catch (e) {}
    PM.animatingFilter = false; PM.allowControl = true;
  }
  // True only when the scene is not already showing exactly these cards.
  function needs(list) {
    var PM = window.__dmG && window.__dmG.ProjectMenu; if (!PM || !PM.projects) return false;
    var vis = 0, lit = 0, wrong = false;
    PM.projects.children.forEach(function (c) {
      var want = list.indexOf(c.name) > -1;
      if (!!c.visible !== want) wrong = true;
      if (c.visible) { vis++; try { if (c.children[0].material.uniforms.u_opacity.value > 0.05) lit++; } catch (e) { lit++; } }
    });
    return wrong || (vis > 0 && lit === 0);
  }
  document.addEventListener("click", function (e) {
    if (!e.isTrusted) return; var a = e.target.closest && e.target.closest("a[href]"); if (!a || a.closest(".dm-music, .dm-sheet")) return;
    var H = window.__dmG && window.__dmG.Highway, now = Date.now();
    if ((H && H.running) || now - (window.__dmNavAt || 0) < 2200) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return; }
    if (a.href && new URL(a.href, location.href).origin === location.origin) window.__dmNavAt = now;
  }, true);
  var pending = null;
  // Filter buttons: we choose the cards ourselves and retry
  // until the scene is free, so pressing any filter — or All — always shows its cards.
  function showFilter(f, tries) {
    var G = window.__dmG, PM = G && G.ProjectMenu;
    if (!PM || !PM.projects || !PM.projects.children.length || !window.__dmEmit || PM.animatingFilter) {
      if ((tries || 0) < 40) setTimeout(function () { showFilter(f, (tries || 0) + 1); }, 120); return;
    }
    var list = (window.projects || []).filter(function (e) {
      var c = e.project.project_grid_category || [];
      return f === "all" || c.indexOf(f) > -1;
    }).map(function (e) { return e.project.title; });
    if (!list.length) list = names();
    if (needs(list)) emit(list);
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
    if (on && !prWas) [1800, 4500].forEach(function (t) { setTimeout(function () {
      if (!isPr(location.pathname)) return;
      var act = document.querySelector(".js-project-filters\\:filterBtn.is-active");
      if (!act || act.dataset.filter === "all") showFilter("all");
    }, t); });
    prWas = on;
  }, 250);
  // Every frame: service tiles only show on Projects.
  (function tiles() {
    unstick(performance.now());
    var p = location.pathname, PMg = window.__dmG && window.__dmG.ProjectMenu && window.__dmG.ProjectMenu.projects;
    var want = isPr(p);
    if (PMg && "visible" in PMg && PMg.visible !== want) {
      PMg.visible = want;
      // Coming back into view: reload the cards exactly like pressing "All", so none stay missing.
      if (want) pending = true;
    }
    requestAnimationFrame(tiles);
  })();
  var last = "";
  setInterval(function () {
    if (!document.body) return;
    var p = location.pathname;
    if (p !== last) { last = p; pending = isPr(p) ? false : null; }
    if (pending !== null && apply()) pending = null;
  }, 250);
})();

/* Interstellar: plays from 2:10 (file is pre-trimmed) and loops, ONLY on World.
   Everywhere else it is fully stopped. While it plays, the other music steps aside so two
   songs never overlap. Respects the music panel's mute.
   iPhones ignore an audio element's volume, so the level runs through a Web Audio gain:
   fades and silences then work the same on every phone. */
(function () {
  var a = new Audio();
  a.loop = true; a.preload = "none"; a.volume = 0;
  var SRC = "/site/assets/track-interstellar.mp3?v=1";
  var unlocked = false, vol = 0, ducked = false, duckAt = 0, gain = null, gctx = null;
  function here() { return /^\/world(\/|$)/.test(location.pathname); }
  function target() {
    if (document.hidden || window.__dmMusicMuted || !here()) return 0;
    return 0.55 * (window.__dmUserVol == null ? 1 : window.__dmUserVol);
  }
  function wire() {
    if (gain) return;
    try {
      var H = window.__dmHowler;
      gctx = (H && H.ctx) || new (window.AudioContext || window.webkitAudioContext)();
      var src = gctx.createMediaElementSource(a);
      gain = gctx.createGain(); gain.gain.value = vol;
      src.connect(gain); gain.connect(gctx.destination);
      a.volume = 1;
    } catch (e) { gain = null; }
  }
  function start() {
    if (!a.src) a.src = SRC;
    wire();
    if (gctx && gctx.state === "suspended") gctx.resume().catch(function () {});
    a.play().catch(function () {});
  }
  function stop() { vol = 0; if (gain) gain.gain.value = 0; else a.volume = 0; if (!a.paused) a.pause(); }
  window.__dmInterStop = stop;
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
  var lastAt = performance.now();
  setInterval(function () {
    var t = target(), now = performance.now();
    // Busy phones can delay this timer; scale the fade by the real time passed.
    var k = 1 - Math.pow(0.9, Math.min(10, (now - lastAt) / 50)); lastAt = now;
    window.__dmInterOn = t > 0;
    // Leaving World: cut straight away instead of fading over the next song.
    if (t === 0 && !here()) { if (vol > 0 || !a.paused) stop(); duck(false); return; }
    duck(t > 0);
    if (t > 0 && unlocked && a.paused) start();
    vol += (t - vol) * k; if (Math.abs(t - vol) < 0.004) vol = t;
    if (gain) gain.gain.value = Math.max(0, Math.min(1, vol)); else a.volume = Math.max(0, Math.min(1, vol));
    if (t === 0 && vol === 0 && !a.paused) a.pause();
  }, 50);
  window.addEventListener("pagehide", stop);
})();

/* Never two songs at once: if an extra song is playing, the site's own song must stay muted,
   and nothing keeps playing when the page is left or put in the background. */
(function () {
  window.addEventListener("pagehide", function () {
    document.querySelectorAll("audio").forEach(function (x) { try { x.pause(); } catch (e) {} });
    var H = window.__dmHowler; if (H && H.ctx && H.ctx.suspend) try { H.ctx.suspend(); } catch (e) {}
  });
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    var H = window.__dmHowler; if (H && H.ctx && H.ctx.resume) try { H.ctx.resume(); } catch (err) {}
  });
  document.addEventListener("visibilitychange", function () {
    var H = window.__dmHowler; if (!H || !H.ctx) return;
    try { if (document.hidden) H.ctx.suspend(); else if (!window.__dmMusicMuted) H.ctx.resume(); } catch (e) {}
  });
})();

/* Smoothness: picture sharpness follows the device. The scene starts at a level chosen from
   the phone/computer's strength, then steps down if frames drop and back up if there is room. */
(function () {
  var frames = 0, since = 0, steps = 0, good = 0, last = location.pathname, quietUntil = 0;
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
    if (now - since < 1600) return;
    var fps = frames * 1000 / (now - since); frames = 0; since = now;
    var G = gl(), pr = G.renderer.getPixelRatio(), cap = window.__dmPR || 1.5;
    var floor = matchMedia("(pointer:coarse)").matches ? 0.85 : 1.05;
    var phone = floor < 1;
    // Phones step down faster and only step up after two smooth checks in a row, so they never stutter.
    if (fps < 50 && pr > floor + 0.01) { setPR(Math.max(floor, pr - (phone && fps < 40 ? 0.35 : 0.25))); steps++; good = 0; }
    else if (fps > 58 && pr < cap - 0.01 && steps < 8) { if (!phone || ++good >= 2) { setPR(Math.min(cap, pr + 0.25)); steps++; good = 0; } }
    else good = 0;
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
    if (!oldTitle) oldTitle = document.title; document.title = nameOf(url) + " — Abdelrahman Studio Example";
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

/* Loader watchdog: Enter must appear within ~2.5s even if the 3D scene is slow */
(function () {
  function forceEnter() {
    var btn = document.querySelector('.js-enter-btn');
    if (!btn) return;
    if (getComputedStyle(btn).visibility === 'visible') return;
    btn.style.setProperty('opacity', '1', 'important');
    btn.style.setProperty('visibility', 'visible', 'important');
    var na = document.querySelector('.js-enter-no-audio-btn');
    if (na) {
      na.style.setProperty('opacity', '1', 'important');
      na.style.setProperty('visibility', 'visible', 'important');
    }
    var prog = document.querySelector('.js-loader-progress');
    if (prog) prog.style.transform = 'translateY(0%)';
    var inner = document.querySelector('.js-loader-progress-inner');
    if (inner) inner.style.transform = 'translateY(0%)';
  }
  /* After Enter: release the forced styles and make sure the loader never blocks the site */
  document.addEventListener('click', function (e) {
    if (!(e.target.closest && e.target.closest('.js-enter-btn, .js-enter-no-audio-btn'))) return;
    /* The entry flight is the heaviest moment of the whole site: drop the render
       sharpness to the floor before it starts so the page never freezes, then let
       the smoothness stepper raise it again once frames are steady. */
    try {
      var G = window.__dmG;
      if (G && G.Gl && G.Gl.renderer) {
        var floor = matchMedia('(pointer:coarse)').matches ? 0.85 : 1.05;
        G.Gl.renderer.setPixelRatio(floor);
        if (G.Gl.composer) {
          G.Gl.composer.setPixelRatio(floor);
          G.Gl.composer.setSize(G.window.w, G.window.fullHeight);
        }
        if (G.Gl.fxaaPass) G.Gl.fxaaPass.material.uniforms.resolution.value.set(1 / (G.window.w * floor), 1 / (G.window.fullHeight * floor));
        if (G.Gl.globalUniforms && G.Gl.globalUniforms.u_resolution) G.Gl.globalUniforms.u_resolution.value.set(G.window.w * floor, G.window.fullHeight * floor);
      }
    } catch (err) {}
    setTimeout(function () {
      document.querySelectorAll('.js-enter-btn, .js-enter-no-audio-btn').forEach(function (b) {
        b.style.removeProperty('opacity'); b.style.removeProperty('visibility');
        b.style.opacity = '0'; b.style.visibility = 'hidden';
      });
    }, 600);
    setTimeout(function () {
      var L = document.querySelector('.js-loader');
      if (L) L.classList.add('dm-gone');
    }, 2200);
  }, true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(forceEnter, 2000); });
  } else {
    setTimeout(forceEnter, 2000);
  }
})();

/* Colour wash only after the loader is gone */
(function () {
  function markIn() { document.documentElement.classList.add('dm-in'); }
  var loader = document.querySelector('.js-loader');
  if (!loader) { markIn(); return; }
  function check() {
    var cs = getComputedStyle(loader);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) markIn();
  }
  new MutationObserver(check).observe(loader, { attributes: true, attributeFilter: ['style', 'class'] });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.js-enter-btn, .js-enter-no-audio-btn')) markIn();
  });
  setInterval(check, 1000);
})();

/* Steady screen on phones: no pinch-zoom, no double-tap zoom, no sideways drifting. */
(function () {
  var stop = function (e) { e.preventDefault(); };
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (ev) { document.addEventListener(ev, stop, { passive: false }); });
  document.addEventListener("touchmove", function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  var lastEnd = 0;
  document.addEventListener("touchend", function (e) {
    var now = Date.now();
    if (now - lastEnd < 300 && !(e.target.closest && e.target.closest("input, textarea, select, a, button"))) e.preventDefault();
    lastEnd = now;
  }, { passive: false });
  // If anything ever nudges the page sideways, put it back.
  window.addEventListener("scroll", function () { if (window.scrollX) window.scrollTo(0, window.scrollY); }, { passive: true });
})();

/* Tilt parallax: on phones with a motion sensor, tilting the phone gently sways the 3D scene.
   Turns on with Enter (iPhones ask permission at that tap), very smooth, and pauses while a
   finger is on the screen. Phones without the sensor simply keep the normal view. */
(function () {
  if (!matchMedia("(pointer:coarse)").matches || !("DeviceOrientationEvent" in window)) return;
  var on = false, base = null, tx = 0, ty = 0, sx = 0, sy = 0, touchAt = 0, running = false;
  function allowed() { return !/^\/projects\/?$/.test(location.pathname) && !document.documentElement.classList.contains("dm-siding"); }
  function onOri(e) {
    if (e.gamma == null || e.beta == null) return;
    if (!base) base = { b: e.beta, g: e.gamma };
    var g = Math.max(-25, Math.min(25, e.gamma - base.g)), b = Math.max(-20, Math.min(20, e.beta - base.b));
    tx = g / 25 * 0.55; ty = -b / 20 * 0.4;
    // Slowly re-centre around however the phone is being held.
    base.g += (e.gamma - base.g) * 0.004; base.b += (e.beta - base.b) * 0.004;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function loop() {
    var G = window.__dmG, m = G && G.mouse && G.mouse.glNormalized;
    if (!m || document.hidden) { running = false; return; }
    sx += (tx - sx) * 0.06; sy += (ty - sy) * 0.06;
    if (allowed() && Date.now() - touchAt > 700) m.set(sx, sy);
    requestAnimationFrame(loop);
  }
  ["touchstart", "touchmove", "touchend"].forEach(function (ev) { document.addEventListener(ev, function () { touchAt = Date.now(); }, { passive: true, capture: true }); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) base = null; });
  function enable() {
    if (on) return; on = true;
    window.addEventListener("deviceorientation", onOri, { passive: true });
  }
  document.addEventListener("click", function (e) {
    if (!(e.target.closest && e.target.closest(".js-enter-btn, .js-enter-no-audio-btn"))) return;
    var D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") {
      D.requestPermission().then(function (r) { if (r === "granted") enable(); }).catch(function () {});
    } else enable();
  }, true);
  // Arriving from Story behind the veil (Enter pressed for the visitor): Android needs no permission.
  setTimeout(function () {
    var D = window.DeviceOrientationEvent;
    if (document.documentElement.classList.contains("dm-in") && !(D && typeof D.requestPermission === "function")) enable();
  }, 4000);
})();

/* Black-screen guard: if the phone drops the 3D picture (low memory after many page changes),
   reload the current page instead of leaving a black or mixed-up screen. */
(function () {
  var hooked = null;
  setInterval(function () {
    var G = window.__dmG, c = G && G.Gl && G.Gl.renderer && G.Gl.renderer.domElement;
    if (!c || c === hooked) return;
    hooked = c;
    var timer = 0;
    c.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      clearTimeout(timer);
      timer = setTimeout(function () { if (!document.hidden) location.reload(); }, 1500);
    });
    c.addEventListener("webglcontextrestored", function () { clearTimeout(timer); });
  }, 1000);
})();

/* Stronger copy protection: blocks the usual shortcuts for viewing, saving and inspecting the code,
   and text/image copying outside the form fields. */
(function () {
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (k === "f12" || (c && (k === "u" || k === "s" || k === "p")) || (c && e.shiftKey && (k === "i" || k === "j" || k === "c")) || (e.metaKey && e.altKey && (k === "i" || k === "j" || k === "c" || k === "u"))) {
      e.preventDefault(); e.stopPropagation();
    }
  }, true);
  ["copy", "cut"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!(e.target.closest && e.target.closest("input, textarea"))) e.preventDefault(); }, true);
  });
  var st = document.createElement("style");
  st.textContent = "body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}input,textarea{-webkit-user-select:text;user-select:text}img{-webkit-user-drag:none}";
  document.head.appendChild(st);
})();
