/* seed save "demo kaya" untuk visual QA — dipakai tests/visual.js & debug */
'use strict';
function seedSave() {
  const today = new Date();
  const dstr = d => d.toISOString().slice(0, 10);
  const skills = {};
  const mk = (id, elo, st, hist) => { skills[id] = { elo, D: 4.2, S: st === 'mastered' ? 21 : 6, lastReviewTs: Date.now(), dueTs: Date.now() + 86400000, streakBenar: 3, medianMs: 12000, attempts: 24, status: st, hist: hist || [1, 1, 1, 1, 1] }; };
  ['ari.tambah','ari.kurang','ari.kali','ari.bagi','ari.campur','ari.negatif','ari.pecahan','ari.desimal','ari.bulat','ari.persen','ari.rasio','ari.satuan',
   'alj.substitusi','alj.sukusejenis','alj.linear1','alj.linear2','alj.distributif','alj.pertidaksamaan','alj.sistem',
   'log.negasi','log.danau','log.implikasi','log.tabel','log.silogisme','log.deduksi','log.pola',
   'dat.tabel','dat.barchart','dat.mean','dat.medianmodus','dat.banding'].forEach(id => mk(id, 1360, 'mastered'));
  ['ari2.persen-naik','ari2.diskon','ari2.rasio3','fng.gradien','fng.bacagrafik','mm.campur2','mm.persen-cepat'].forEach(id => mk(id, 1290, 'lancar'));
  ['kald.power','kald.limit'].forEach(id => mk(id, 1220, 'belajar'));
  // v1.5.3: guard anti-bypass zeno — buka prasyarat node demo visual
  ['rso.lp-model','pro.bayes'].forEach(id => mk(id, 1310, 'lancar'));
  const dailyLog = [];
  for (let i = 40; i >= 0; i--) {
    if (i % 7 === 3) continue; // beberapa hari bolong
    const d = new Date(today.getTime() - i * 86400000);
    dailyLog.push({ date: dstr(d), ts: d.getTime(), minutes: 18 + (i % 3) * 6, questions: 22 + (i % 5) * 6, correct: 15 + (i % 4) * 4 });
  }
  return {
    version: 1, createdAt: Date.now() - 40 * 86400000, updatedAt: Date.now(),
    profile: { name: 'Vista Forger', track: 'ti', dailyGoalMin: 25 },
    skills,
    tiers: { current: 1, unlocked: 4, examHistory: [{ tier: 0, ts: Date.now() - 20 * 86400000, score: 87.5, passed: true, breakdown: [{ domain: 'aritmetika', pct: 90, n: 8 }, { domain: 'logika', pct: 88, n: 7 }] }] },
    streak: { current: 12, best: 19, shields: 1, lastSessionDate: dstr(today) },
    stats: { totalQuestions: 1284, totalSessions: 38, dailyLog, lastBossTs: Date.now() - 8 * 86400000, sessionsSinceBoss: 4, bestCombo: 14, bossWins: 2, sharpHistory: Array.from({ length: 12 }, (_, i) => ({ date: dstr(new Date(today.getTime() - (11 - i) * 3 * 86400000)), ts: 0, s: 420 + i * 26 })) },
    badges: ['first', 'streak7', 'q100', 'q500', 'boss1', 'tier1'],
    settings: { sound: true, volume: 0.5, serious: false, motion: 'auto', theme: 'dark' },
    schemaMigrations: [1]
  };
}

module.exports = seedSave;
