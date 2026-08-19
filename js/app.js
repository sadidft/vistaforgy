/* Vista Forgy — app.js (bootstrap: load, rollover, tema, motion, nav, PWA) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var STORE = VF.STORE, UI = VF.UI;

  VF.persist = function () {
    if (VF.save) STORE.save(VF.save);
  };

  VF.reduceMotion = function () {
    var s = VF.save && VF.save.settings;
    if (s && s.motion === 'reduced') return true;
    if (s && s.motion === 'full') return false;
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };

  VF.applyTheme = function () {
    var t = (VF.save && VF.save.settings.theme) || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  };
  VF.applyMotion = function () {
    document.documentElement.classList.toggle('rm', VF.reduceMotion());
  };

  /* Rollover harian: shield otomatis untuk satu hari bolong */
  function rollover() {
    var save = VF.save;
    if (!save) return;
    var today = VF.todayStr();
    var last = save.streak.lastSessionDate;
    if (!last || last === today) return;
    // cek apakah kemarin tidak ada aktivitas
    var logs = save.stats.dailyLog;
    var yLog = logs.some(function (d) { return d.date === VF.yesterdayStr(); });
    var gapDay = daysBetween(last, today);
    if (gapDay >= 2 && save.streak.current >= 3 && save.streak.shields > 0 && !save.stats.shieldUsedOn) {
      save.streak.shields -= 1;
      save.stats.shieldUsedOn = today;
      save.streak.current = Math.max(0, save.streak.current - 1) + 1; // streak bertahan
      setTimeout(function () { UI.toast('🛡 Satu streak shield terpakai — streak ' + save.streak.current + ' hari tetap hidup.', 'ok', 4000); }, 1200);
      VF.persist();
    } else if (gapDay >= 2 && !yLog) {
      save.streak.current = 0;
      VF.persist();
    }
    function daysBetween(a, b) {
      var pa = a.split('-'), pb = b.split('-');
      return Math.round((new Date(pb[0], pb[1] - 1, pb[2]) - new Date(pa[0], pa[1] - 1, pa[2])) / 86400000);
    }
  }

  function sizeCanvas() {
    var cv = document.getElementById('particles');
    if (!cv) return;
    cv.width = window.innerWidth; cv.height = window.innerHeight;
  }

  function boot() {
    VF.save = STORE.load();
    if (VF.save) {
      rollover();
      VF.applyTheme(); VF.applyMotion();
    } else if (location.hash !== '#/onboarding') {
      location.hash = '#/onboarding';
    }
    // seed engine per hari
    VF.ENGINE.sessionSeed = 'd' + VF.todayStr();
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    // nav
    var navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        VF.AUDIO.click(VF.save);
        UI.nav(b.getAttribute('data-path'));
      });
    });
    window.addEventListener('hashchange', function () {
      if (VF.RUNNER && VF.RUNNER.sess && VF.currentPath !== 'run') VF.RUNNER.teardown();
      UI.render();
      window.scrollTo(0, 0);
    });

    STORE.onExternalChange(function () {
      UI.toast('Perubahan terdeteksi dari tab lain — memuat ulang data…', 'warn');
      VF.save = STORE.load();
      UI.render();
    });

    UI.render();
    if (VF.save && location.hash.indexOf('home') >= 0 || !location.hash) {
      if (VF.save) VF.RUNNER.offerResume();
    }

    // PWA (hanya via http/https)
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      try { navigator.serviceWorker.register('./sw.js').catch(function () {}); } catch (e) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
