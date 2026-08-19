/* Vista Forgy — progression.js (Elo per node, mastery, tier gate, ujian promosi & boss, Sharpness) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var P = (VF.PROG = VF.PROG || {});
  var E = VF.ENGINE;

  /* ---------- Elo per node ---------- */
  P.K = 24;
  P.updateElo = function (state, question, correct, fast) {
    var q = question.difficultyRating || 1200;
    var u = state.elo || 1200;
    var expected = 1 / (1 + Math.pow(10, (q - u) / 400));
    var score = correct ? (fast ? 1 : 0.75) : 0;
    state.elo = Math.round(Math.max(800, Math.min(1800, u + P.K * (score - expected))));
    return state;
  };

  /* ---------- Tier ---------- */
  P.nodesInTier = function (tier, track) {
    return E.allNodes().filter(function (n) {
      return n.tier === tier && (track === 'both' || n.track === track || n.track === 'ti');
    });
  };
  P.tierStats = function (save, tier) {
    var nodes = P.nodesInTier(tier, save.profile.track);
    var mastered = 0, learned = 0, attemptsInTier = 0;
    nodes.forEach(function (n) {
      var st = save.skills[n.id];
      if (st) {
        if (st.status === 'mastered' || st.status === 'memudar') mastered++;
        if (st.attempts > 0) learned++;
        attemptsInTier += st.attempts || 0;
      }
    });
    return { total: nodes.length, mastered: mastered, learned: learned, attempts: attemptsInTier, required: Math.ceil(nodes.length * 0.9) };
  };
  P.tierGate = function (save, tier) {
    var t = P.tierStats(save, tier);
    var fading = P.nodesInTier(tier, save.profile.track).filter(function (n) {
      var st = save.skills[n.id];
      return st && st.attempts > 0 && st.status === 'memudar';
    }).length;
    var cooldownOk = true, cooldownMsg = '';
    var lastFail = null;
    (save.tiers.examHistory || []).forEach(function (h) { if (h.tier === tier && !h.passed) lastFail = h; });
    if (lastFail) {
      var until = lastFail.ts + 48 * 3600 * 1000;
      if (Date.now() < until) { cooldownOk = false; cooldownMsg = until; }
    }
    var hasContent = P.nodesInTier(tier + 1, save.profile.track).length > 0 || tier === 4;
    return {
      tier: tier,
      masteredOk: t.mastered >= t.required,
      masteredTxt: t.mastered + '/' + t.required + ' (' + t.total + ' node)',
      healthyOk: fading === 0,
      fading: fading,
      volumeOk: t.attempts >= VF.TIERS[tier].volume,
      volumeTxt: t.attempts + '/' + VF.TIERS[tier].volume + ' soal',
      cooldownOk: cooldownOk, cooldownUntil: cooldownMsg,
      nextContentOk: hasContent,
      allOk: t.mastered >= t.required && fading === 0 && t.attempts >= VF.TIERS[tier].volume && cooldownOk
    };
  };

  /* ---------- Ujian promosi ---------- */
  P.buildExam = function (save, tier) {
    var nodes = P.nodesInTier(tier, save.profile.track).filter(function (n) {
      var st = save.skills[n.id]; return st && st.attempts > 0;
    });
    var size = Math.min(VF.TIERS[tier].examSize, Math.max(6, nodes.length * 2));
    var items = [];
    // berat ke node terlemah (elo rendah)
    var sorted = nodes.slice().sort(function (a, b) {
      var ea = (save.skills[a.id] || {}).elo || 1200, eb = (save.skills[b.id] || {}).elo || 1200;
      return ea - eb;
    });
    var i = 0;
    while (items.length < size) {
      var nd = sorted[i % sorted.length];
      items.push(nd.id);
      i++;
      if (i > size * 3) break;
    }
    var totalMs = items.reduce(function (acc, id) { return acc + E.getNode(id).targetMs * 1.5; }, 0);
    return { tier: tier, items: items, totalMs: totalMs, size: items.length };
  };
  P.gradeExam = function (save, tier, results) {
    // results: [{skillId, correct}]
    var correct = 0;
    var byDomain = {};
    var items = results.map(function (r) {
      var nd = E.getNode(r.skillId);
      var dom = nd ? nd.domain : '?';
      byDomain[dom] = byDomain[dom] || { c: 0, n: 0 };
      byDomain[dom].n++; if (r.correct) { byDomain[dom].c++; correct++; }
      return r;
    });
    var pct = items.length ? Math.round(correct / items.length * 1000) / 10 : 0;
    var domainsOk = true;
    var domList = [];
    Object.keys(byDomain).forEach(function (d) {
      var dp = byDomain[d].c / byDomain[d].n;
      if (dp < 0.7) domainsOk = false;
      domList.push({ domain: d, pct: Math.round(dp * 100), n: byDomain[d].n });
    });
    var passed = pct >= VF.TIERS[tier].passPct && domainsOk;
    save.tiers.examHistory.push({ tier: tier, ts: Date.now(), score: pct, passed: passed, breakdown: domList });
    if (passed && save.tiers.unlocked < tier + 1) save.tiers.unlocked = Math.min(4, tier + 1);
    return { passed: passed, pct: pct, domains: domList };
  };

  /* ---------- Boss mingguan ---------- */
  P.bossAvailable = function (save) {
    var hist = save.stats.dailyLog || [];
    if (!hist.length) return false;
    var lastBoss = save.stats.lastBossTs || 0;
    if (Date.now() - lastBoss < 7 * 24 * 3600 * 1000) return false;
    return (save.stats.sessionsSinceBoss || 0) >= 3;
  };
  P.buildBoss = function (save) {
    var nodes = E.allNodes().filter(function (n) {
      var st = save.skills[n.id]; return st && st.attempts > 0 && n.track !== 'uni';
    });
    var sorted = nodes.slice().sort(function (a, b) {
      var ea = (save.skills[a.id] || {}).elo || 1200, eb = (save.skills[b.id] || {}).elo || 1200;
      return ea - eb;
    });
    var items = [];
    var i = 0;
    while (items.length < Math.min(15, sorted.length)) { items.push(sorted[i % sorted.length].id); i++; }
    var totalMs = items.reduce(function (acc, id) { return acc + E.getNode(id).targetMs * 1.5; }, 0);
    return { items: items, totalMs: totalMs, size: items.length };
  };

  /* ---------- Sharpness Score 0–1000 ---------- */
  P.sharpness = function (save, now) {
    now = now || Date.now();
    var nodes = E.allNodes().filter(function (n) { return n.track === 'ti'; });
    if (!nodes.length) return 0;
    var cov = 0, stab = 0, stabN = 0, spd = 0, spdN = 0;
    nodes.forEach(function (n) {
      var st = save.skills[n.id];
      if (!st) return;
      if (st.status === 'mastered' || st.status === 'memudar') cov += 1;
      else if (st.status === 'lancar') cov += 0.5;
      if (st.S) { stab += Math.min(st.S, 180) / 180; stabN++; }
      if (st.status === 'mastered' && st.medianMs) { spd += Math.min(1, n.targetMs / st.medianMs); spdN++; }
    });
    var coverage = cov / nodes.length;
    var avgStab = stabN ? stab / stabN : 0;
    var speed = spdN ? spd / spdN : 0;
    var weekAgo = now - 7 * 24 * 3600 * 1000;
    var sessions = (save.stats.dailyLog || []).filter(function (d) { return d.ts >= weekAgo; }).length;
    var consistency = Math.min(1, (save.streak.current || 0) / 21) * Math.min(1, sessions / 5);
    return Math.round(400 * coverage + 300 * avgStab + 200 * speed + 100 * consistency);
  };

  /* ---------- Proyeksi selesai jalur TI ---------- */
  P.projection = function (save) {
    var nodes = E.allNodes().filter(function (n) { return n.track === 'ti'; });
    var remaining = nodes.filter(function (n) {
      var st = save.skills[n.id];
      return !st || st.status !== 'mastered';
    }).length;
    var logs = save.stats.dailyLog || [];
    var active = logs.slice(-14);
    if (active.length < 3) return null;
    var masteredRate = 0;
    var done = nodes.length - remaining;
    var firstTs = logs.length ? logs[0].ts : Date.now();
    var days = Math.max(1, (Date.now() - firstTs) / (24 * 3600 * 1000));
    masteredRate = done / days;
    if (masteredRate <= 0) return null;
    var etaDays = Math.ceil(remaining / masteredRate);
    return { remaining: remaining, etaDays: etaDays, etaDate: new Date(Date.now() + etaDays * 24 * 3600 * 1000) };
  };

  /* ---------- Unlock node ---------- */
  P.isUnlocked = function (save, node) {
    if (node.track === 'uni') {
      return save.profile.track !== 'ti' ? true : true; // universal selalu terlihat
    }
    if (node.tier > save.tiers.unlocked) return false;
    return node.prereq.every(function (pid) {
      var st = save.skills[pid];
      return st && st.attempts > 0 && (st.status === 'lancar' || st.status === 'mastered' || st.status === 'memudar');
    });
  };
})();
