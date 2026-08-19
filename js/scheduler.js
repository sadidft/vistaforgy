/* Vista Forgy — scheduler.js (FSRS-lite: Difficulty–Stability–Retrievability per skill node) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var S = (VF.SCHED = VF.SCHED || {});
  var DECAY = -0.5, FACTOR = 19 / 81, DESIRED_R = 0.90;

  S.DAY = 24 * 3600 * 1000;

  /* Retrievability: peluang masih ingat */
  S.retrievability = function (state, now) {
    if (!state || !state.attempts || state.S <= 0) return 0;
    var elapsedDays = Math.max(0, (now - state.lastReviewTs) / S.DAY);
    return Math.pow(1 + FACTOR * elapsedDays / state.S, DECAY);
  };

  /* Interval hari berikutnya agar R turun ke desired */
  S.nextIntervalDays = function (Sval) {
    var d = (Sval / FACTOR) * (Math.pow(DESIRED_R, 1 / DECAY) - 1);
    return Math.max(0.25, Math.min(365, d));
  };

  /* Rating dari performa: 1 salah/timeout, 2 benar lambat, 3 benar, 4 benar kilat */
  S.rate = function (correct, ms, targetMs, streak) {
    if (!correct) return 1;
    if (ms > 1.5 * targetMs) return 2;
    if (ms < 0.6 * targetMs && (streak || 0) >= 2) return 4;
    return 3;
  };

  var DD = { 1: 1.2, 2: 0.3, 3: -0.1, 4: -0.6 };
  var S_INIT = { 1: 0.6, 2: 1.2, 3: 3.0, 4: 6.0 };

  /* Update state node setelah satu jawaban. state = {elo,D,S,streakBenar,medianMs,attempts,status,lastReviewTs,dueTs} */
  S.update = function (state, rating, ms, targetMs, now) {
    now = now || Date.now();
    var R = S.retrievability(state, now);
    state.attempts = (state.attempts || 0) + 1;
    if (!state.D || state.attempts === 1) {
      state.D = Math.max(1, Math.min(10, 5.5 + (3 - rating) * 0.7));
      state.S = S_INIT[rating];
    } else {
      var d = state.D + DD[rating];
      d = Math.min(10, Math.max(1, d));
      state.D = d + 0.05 * (5 - d); // mean reversion
      if (rating >= 2) {
        var grow = 1 + 0.42 * (11 - state.D) * Math.pow(state.S, -0.22) * (1 / Math.max(0.02, R) - 1);
        grow = Math.min(grow, 2.5);
        if (rating === 4) grow *= 1.15;
        state.S = state.S * grow;
      } else {
        state.S = Math.max(0.4, state.S * 0.35);
      }
    }
    state.S = Math.min(state.S, 365);
    state.lastReviewTs = now;
    state.dueTs = now + S.nextIntervalDays(state.S) * S.DAY;
    if (rating === 1) state.streakBenar = 0;
    else state.streakBenar = (state.streakBenar || 0) + 1;
    state.hist = state.hist || [];
    state.hist.push(rating >= 2 ? 1 : 0);
    if (state.hist.length > 10) state.hist.shift();
    // median waktu EMA
    state.medianMs = state.medianMs ? Math.round(state.medianMs * 0.7 + ms * 0.3) : ms;
    // status
    state.status = S.status(state, targetMs);
    return state;
  };

  S.status = function (state, targetMs) {
    if (!state.attempts) return 'baru';
    if (state.streakBenar >= 3 && state.elo >= 1300 && state.medianMs <= targetMs) return 'mastered';
    if (state.streakBenar >= 2) return 'lancar';
    return 'belajar';
  };

  S.isDue = function (state, now) {
    if (!state || !state.attempts) return false;
    return (state.dueTs || 0) <= now || S.retrievability(state, now) < DESIRED_R - 0.02;
  };

  S.isFading = function (state, now) {
    if (!state || state.status !== 'mastered') return false;
    return S.retrievability(state, now) < 0.7;
  };

  /* Komposisi antrian harian */
  S.dailyQueue = function (save, nodes, now) {
    now = now || Date.now();
    var due = [];
    nodes.forEach(function (nd) {
      var st = save.skills[nd.id];
      if (!st) return;
      if (st.status === 'memudar' || S.isDue(st, now)) due.push({ node: nd, st: st });
    });
    due.sort(function (a, b) {
      var fa = a.st.status === 'memudar' ? -1 : 0, fb = b.st.status === 'memudar' ? -1 : 0;
      if (fa !== fb) return fa - fb;
      return S.retrievability(a.st, now) - S.retrievability(b.st, now);
    });
    return due.slice(0, 25).map(function (x) { return x.node; });
  };

  /* Tanggal lokal YYYY-MM-DD */
  VF.todayStr = function (d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  };
  VF.yesterdayStr = function () {
    return VF.todayStr(new Date(Date.now() - 24 * 3600 * 1000));
  };
})();
