/* NAGI — liquid page transition shared by every page.
   Leaving: an ivory surface rises from the bottom with a soft liquid edge and the
   wordmark settles in the centre. The next page starts on the exact same frame and
   lifts the surface away once it is ready, so the jump between pages is invisible. */
(function () {
  'use strict';
  var KEY = 'dmVeil', D = document, H = D.documentElement;
  var isStory = location.pathname.indexOf('/story') === 0;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ov = D.getElementById('dmv');
  if (!ov) {
    ov = D.createElement('div');
    ov.id = 'dmv';
    ov.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H100V100H0Z"/></svg>' +
      '<div class="dmv-mark"><img src="/__l5e/assets-v1/4df3b493-dda2-4fb4-b200-8da7d095d8c9/abdelrahman-logo.webp" alt=""><span>NAGI</span><i></i></div>';
    D.body.insertBefore(ov, D.body.firstChild);
  }
  var path = ov.querySelector('path'), mark = ov.querySelector('.dmv-mark');
  var busy = false;

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function anim(ms, fn, done) {
    if (reduced) { fn(1); done && done(); return; }
    var t0 = performance.now();
    (function f(now) {
      var p = Math.min(1, (now - t0) / ms);
      fn(p);
      if (p < 1) requestAnimationFrame(f); else done && done();
    })(t0);
  }
  function setMark(o, y) { mark.style.opacity = o; mark.style.transform = 'translate(-50%,calc(-50% + ' + y + 'px))'; }

  /* ---------- leave ---------- */
  function leave(url) {
    if (busy) return;
    busy = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    prefetch(url);
    ov.classList.add('on');
    setMark(0, 26);
    if (window.dmvOnLeave) try { window.dmvOnLeave(); } catch (e) {}
    anim(1000, function (p) {
      var e = ease(p), y = 100 - 100 * e, b = 22 * Math.sin(Math.PI * Math.min(1, p * 1.05));
      path.setAttribute('d', 'M0 100L0 ' + y.toFixed(2) + 'Q50 ' + (y - b).toFixed(2) + ' 100 ' + y.toFixed(2) + 'L100 100Z');
      var m = Math.max(0, (p - .45) / .55);
      setMark(ease(m), 26 * (1 - ease(m)));
    }, function () {
      path.setAttribute('d', 'M0 0H100V100H0Z');
      location.href = url;
    });
    // never strand the visitor on the veil
    setTimeout(function () { location.href = url; }, 4000);
  }

  /* ---------- arrive ---------- */
  function lift() {
    H.classList.remove('dm-veiling');
    ov.classList.add('on');
    setMark(1, 0);
    if (window.dmvOnArrive) try { window.dmvOnArrive(); } catch (e) {}
    anim(1150, function (p) {
      var e = ease(p), y = 100 - 100 * e, b = 24 * Math.sin(Math.PI * p);
      path.setAttribute('d', 'M0 0L0 ' + y.toFixed(2) + 'Q50 ' + (y - b).toFixed(2) + ' 100 ' + y.toFixed(2) + 'L100 0Z');
      var m = Math.min(1, p / .5);
      setMark(1 - ease(m), -34 * ease(m));
    }, function () {
      ov.classList.remove('on');
      path.setAttribute('d', 'M0 0H100V100H0Z');
      busy = false;
    });
  }

  var arriving = H.classList.contains('dm-veiling');
  try { sessionStorage.removeItem(KEY); } catch (e) {}

  function whenReady(cb) {
    var done = false, go = function () { if (!done) { done = true; cb(); } };
    setTimeout(go, isStory ? 3500 : 9000);
    if (isStory) {
      (window.dmvReady || Promise.resolve()).then(function () { setTimeout(go, 250); });
      return;
    }
    // Theme pages: hide their own loader behind the veil and step in automatically.
    var loader = D.querySelector('.js-loader');
    if (!loader) { go(); return; }
    var tries = 0;
    (function poll() {
      var btn = D.querySelector('.js-enter-btn');
      var cs = btn && getComputedStyle(btn);
      var lcs = getComputedStyle(loader);
      if (lcs.display === 'none' || lcs.visibility === 'hidden' || +lcs.opacity === 0) { go(); return; }
      if (btn && cs.visibility !== 'hidden' && +cs.opacity > .6 && cs.pointerEvents !== 'none') {
        btn.click();
        setTimeout(go, 900);
        return;
      }
      if (++tries < 80) setTimeout(poll, 120); else go();
    })();
  }
  if (arriving) whenReady(lift);

  // Back/forward cache: never come back to a covered page.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { busy = false; H.classList.remove('dm-veiling'); ov.classList.remove('on'); }
  });

  /* ---------- prefetch ---------- */
  var fetched = {};
  function prefetch(url) {
    if (fetched[url]) return;
    fetched[url] = 1;
    var l = D.createElement('link'); l.rel = 'prefetch'; l.href = url; D.head.appendChild(l);
    if (url.indexOf('/story') === 0) {
      var i = new Image(); i.src = '/__l5e/assets-v1/443f1d33-8df4-4291-9229-7be886b3003a/story-flowers.jpg';
    }
  }

  /* ---------- which links use it ---------- */
  function wanted(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return false; }
    if (u.origin !== location.origin || u.pathname === location.pathname) return false;
    var toStory = u.pathname.indexOf('/story') === 0;
    // Theme pages keep their own transitions between each other; anything touching Story uses ours.
    return isStory ? /^\/(projects|contact|world)?\/?$/.test(u.pathname) : toStory;
  }

  // Keep the theme router away from Story links.
  D.querySelectorAll('a[href^="/story"]').forEach(function (a) { a.setAttribute('data-router-disabled', ''); });

  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!wanted(a)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    leave(new URL(a.href, location.href).pathname);
  }, true);

  ['pointerenter', 'touchstart', 'focusin'].forEach(function (ev) {
    D.addEventListener(ev, function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (wanted(a)) prefetch(new URL(a.href, location.href).pathname);
    }, { capture: true, passive: true });
  });

  window.dmvLeave = leave;
})();
