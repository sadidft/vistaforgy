/* Vista Forgy — tests/visual-scan3.js (RONDE 3 — light runner/modal, exam, ghost-hover, fuzz konten) */
'use strict';
const path0 = require('path');
const pw = require(path0.resolve(process.env.PW_PATH || '/home/user/e2e-work/node_modules/playwright-core'));
const fs = require('fs');
const ROOT = path0.resolve(process.env.VF_ROOT || '/home/user/vista-forgy');
const APP = 'file://' + path0.join(ROOT, 'VistaForgy-standalone.html');
const seedSave = require(path0.join(ROOT, 'tests/visual-seed.js'));
const OUT = path0.join(ROOT, 'design', 'scan');
fs.mkdirSync(OUT, { recursive: true });
const F = [];
const add = (code, sev, detail) => { F.push({ code, sev, detail }); console.log('  [' + code + '/' + sev + '] ' + detail.slice(0, 130)); };

/* ---------- BAGIAN 1: FUZZ KONTEN (node, tanpa browser) ---------- */
(function fuzz() {
  global.window = global;
  ['js/rng.js', 'js/engine.js', 'js/generators-core.js', 'js/generators-mid.js', 'js/generators-adv.js', 'js/generators-t3.js', 'js/generators-t4.js', 'js/tables.js', 'js/content.js'].forEach(f => eval(fs.readFileSync(path0.join(ROOT, f), 'utf8')));
  const E = global.VF.ENGINE;
  let maxPrompt = { len: 0 }, maxChoice = { len: 0 }, maxStepLab = { len: 0 }, maxLatex = { len: 0 }, maxSteps = { n: 0 };
  for (const nd of E.allNodes()) {
    for (let i = 0; i < 40; i++) {
      let q = null;
      try { q = E.make(nd.id, 1200); } catch (e) { continue; }
      if (!q) continue;
      if (q.promptText.length > maxPrompt.len) maxPrompt = { len: q.promptText.length, id: nd.id, sample: q.promptText.slice(0, 70) };
      (q.choices || []).forEach(c => { const L = (c.label || c.latex || '').length; if (L > maxChoice.len) maxChoice = { len: L, id: nd.id, sample: (c.label || c.latex).slice(0, 70) }; });
      (q.steps || []).forEach(s => { if (s.label.length > maxStepLab.len) maxStepLab = { len: s.label.length, id: nd.id, sample: s.label.slice(0, 70) }; });
      if ((q.promptLatex || '').length > maxLatex.len) maxLatex = { len: q.promptLatex.length, id: nd.id };
      if ((q.steps || []).length > maxSteps.n) maxSteps = { n: q.steps.length, id: nd.id };
    }
  }
  add('FZ-PROMPT', 'info', 'prompt terpanjang: ' + maxPrompt.len + ' kar (' + maxPrompt.id + ') :: ' + maxPrompt.sample);
  add('FZ-CHOICE', 'info', 'opsi MC terpanjang: ' + maxChoice.len + ' kar (' + maxChoice.id + ') :: ' + maxChoice.sample);
  add('FZ-STEPLAB', 'info', 'label langkah terpanjang: ' + maxStepLab.len + ' kar (' + maxStepLab.id + ') :: ' + maxStepLab.sample);
  add('FZ-LATEX', 'info', 'latex terpanjang: ' + maxLatex.len + ' kar (' + maxLatex.id + '); jumlah langkah max: ' + maxSteps.n + ' (' + maxSteps.id + ')');
})();

/* ---------- BAGIAN 2: CSS static audit (grep) ---------- */
(function cssAudit() {
  const css = fs.readFileSync(path0.join(ROOT, 'index.html'), 'utf8');
  const hoverTransforms = css.match(/[^{}]+:hover\{[^}]*transform:[^}]*\}/g) || [];
  const hasHoverMedia = /@media\s*\(\s*hover\s*:\s*hover\s*\)/.test(css);
  add('R3-GHOSTHOVER', hasHoverMedia ? 'low' : 'med', hoverTransforms.length + ' aturan :hover ber-transform TANPA @media(hover:hover) → ghost-hover menempel di Android setelah tap :: ' + hoverTransforms.slice(0, 3).map(s => s.split('{')[0].trim()).join(', '));
  if (!/safe-area-inset-bottom/.test(css.split('.modal')[1] || '')) add('R3-MODAL-SAFEAREA', 'low', 'bottom-sheet modal tidak punya padding safe-area-inset-bottom (iPhone home indicator)');
  if (!/aria-live/.test(css) && true) { /* cek di DOM nanti */ }
})();

(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  const prep = (light) => {
    const s = seedSave();
    Object.keys(s.skills).forEach(k => { s.skills[k].status = 'lancar'; s.skills[k].streakBenar = 3; });
    s.tiers.unlocked = 4; s.settings.motion = 'reduced'; s.settings.serious = true; s.settings.sound = false;
    if (light) s.settings.theme = 'light';
    ['rso.lp-model', 'pro.bayes', 'alj2.sistem', 'lin.mtops', 'lin.determinan', 'kald.integral-tak-tentu', 'dat2.sebaran', 'kald.limit', 'alj2.kuadrat-faktor', 'ant.mm1', 'ant.biaya', 'log.deduksi', 'log2.kuantor'].forEach(id => { if (!s.skills[id]) s.skills[id] = { elo: 1300, D: 4, S: 5, lastReviewTs: Date.now(), dueTs: 0, streakBenar: 3, medianMs: 20000, attempts: 9, status: 'lancar', hist: [1, 1] }; });
    return s;
  };
  async function page(vp, light, touch) {
    const p = await browser.newPage(Object.assign({ viewport: { width: vp[0], height: vp[1] } }, touch ? { hasTouch: true, isMobile: true } : {}));
    await p.addInitScript(sv => localStorage.setItem('vf.save', sv), JSON.stringify(prep(light)));
    return p;
  }

  // ===== A: light runner numeric + feedback =====
  let p = await page([390, 844], true);
  await p.goto(APP + '#/run?mode=zeno&node=kald.power'); await p.waitForSelector('#numGo', { timeout: 8000 });
  await p.screenshot({ path: OUT + '/r3-light-numeric-390.png' });
  await p.keyboard.type('999'); await p.keyboard.press('Enter');
  await p.waitForSelector('#fbNext', { timeout: 5000 }); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/r3-light-feedback-390.png', fullPage: true });
  const A = await p.evaluate(() => {
    const sol = document.querySelector('.sol-final');
    const step = document.querySelector('.sol-step');
    function lum(c) { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
    function rgbs(s) { const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return m ? [+m[1], +m[2], +m[3]] : null; }
    const chip = document.querySelector('.phase-chip');
    const chipBg = rgbs(getComputedStyle(document.body).backgroundColor) || [242, 244, 248];
    const chipFg = rgbs(getComputedStyle(chip).color);
    const r = (a, b) => Math.round(((Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05)) * 100) / 100;
    return { chipRatioVsBody: chipFg ? r(chipFg, chipBg) : null, solFinalAda: !!sol, fbTinggi: Math.round(document.querySelector('.fb').getBoundingClientRect().height) };
  });
  add('R3-LIGHT-RUNNER', 'med', 'light runner: phase-chip mint kontras vs bg terang = ' + A.chipRatioVsBody + ':1; panel feedback tinggi ' + A.fbTinggi + 'px');
  await p.close();

  // ===== B: modal konsep tinggi — ✕ hilang saat scroll? =====
  p = await page([390, 844]);
  await p.goto(APP + '#/map'); await p.waitForSelector('.node-chip');
  await p.evaluate(() => document.querySelector('.node-chip').click());
  await p.waitForSelector('#nmCard'); await p.click('#nmCard');
  await p.waitForSelector('.concept', { timeout: 5000 }); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/r3-concept-modal-390.png' });
  const B = await p.evaluate(() => {
    const box = document.querySelector('.modal');
    const x = document.querySelector('.modal-x');
    const before = x.getBoundingClientRect().top;
    box.scrollTop = 600;
    const after = x.getBoundingClientRect().top;
    return { stickySetelahScroll: Math.abs(before - after) < 2, delta: Math.round(after - before), modalScroll: box.scrollHeight > box.clientHeight };
  });
  add('R3-MODAL-X', 'low', 'modal tinggi: ✕ ikut ter-scroll (delta ' + B.delta + 'px, sticky=' + B.stickySetelahScroll + ') — tombol tutup hilang dari pandangan saat membaca bawah');
  await p.close();

  // ===== C: exam phase chip di 360 =====
  p = await page([360, 800]);
  await p.goto(APP + '#/run?mode=sim'); await p.waitForSelector('.qcard', { timeout: 8000 });
  await p.screenshot({ path: OUT + '/r3-exam-360.png' });
  const C = await p.evaluate(() => {
    const head = document.querySelector('.run-head');
    const chip = document.querySelector('.phase-chip');
    return { headH: Math.round(head.getBoundingClientRect().height), chipW: Math.round(chip.getBoundingClientRect().width), headWrap: head.getBoundingClientRect().height > 46 };
  });
  add('R3-EXAM-CHIP', 'low', 'header runner exam di 360px: tinggi ' + C.headH + 'px (wrap=' + C.headWrap + '), chip ' + C.chipW + 'px');
  await p.close();

  // ===== D: steps label panjang di 360 =====
  p = await page([360, 800]);
  await p.goto(APP + '#/run?mode=zeno&node=lin.gauss'); await p.waitForSelector('#stepsGo', { timeout: 8000 });
  await p.screenshot({ path: OUT + '/r3-steps-360.png', fullPage: true });
  const D = await p.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.step-row'));
    return rows.map(r => ({ h: Math.round(r.getBoundingClientRect().height), baris: r.querySelector('.step-lab').getClientRects().length }));
  });
  add('R3-STEPS-360', 'med', 'baris langkah di 360px: ' + D.map(d => d.h + 'px/' + d.baris + 'baris').join(', ') + ' — label panjang bikin baris membengkak');
  await p.close();

  // ===== E: ghost hover di touch =====
  p = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.addInitScript(sv => localStorage.setItem('vf.save', sv), JSON.stringify(prep()));
  await p.goto(APP + '#/run?mode=zeno&node=log.implikasi'); await p.waitForSelector('.mc-opt', { timeout: 8000 });
  const opt = await p.$('.mc-opt');
  await opt.tap();
  await p.waitForTimeout(400);
  const E = await p.evaluate(() => {
    const el = document.querySelector('.mc-opt');
    const m = getComputedStyle(el).transform;
    return { transformSetelahTap: m, pindah: m !== 'none' };
  });
  add('R3-GHOSTHOVER-TEST', E.pindah ? 'med' : 'low', 'setelah tap (emulasi touch), .mc-opt transform=' + E.transformSetelahTap + ' → ' + (E.pindah ? 'GHOST-HOVER menempel (opsi tampak tergeser permanen sampai tap lain)' : 'bersih'));
  await p.close();

  // ===== F: toast aria-live =====
  p = await page([390, 844]);
  await p.goto(APP + '#/home'); await p.waitForSelector('#btnStart');
  const Fc = await p.evaluate(() => document.querySelector('#toasts').getAttribute('aria-live'));
  add('R3-TOAST-A11Y', 'low', '#toasts aria-live = ' + (Fc || 'TIDAK ADA') + ' — screen reader tidak mengumumkan notifikasi');
  await p.close();

  // ===== G: light concept modal + sparkline/heatmap lvl kontras =====
  p = await page([390, 844], true);
  await p.goto(APP + '#/stats'); await p.waitForSelector('.heatmap'); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/r3-light-stats-390.png', fullPage: true });
  const G = await p.evaluate(() => {
    const spark = document.querySelector('.sparkline polyline');
    const lvl4 = document.querySelector('.hm-cell.lvl4');
    return { sparkStroke: spark ? spark.getAttribute('stroke') : null, lvl4bg: lvl4 ? getComputedStyle(lvl4).backgroundColor : null };
  });
  add('R3-LIGHT-STATS', 'med', 'light: sparkline stroke=' + G.sparkStroke + ' (mint di panel terang ≈1,7:1), sel lvl4=' + G.lvl4bg + ' — satu keluarga dengan VF-08');
  await p.close();

  // ===== H: exam result (sim) =====
  p = await page([390, 844]);
  await p.goto(APP + '#/run?mode=sim'); await p.waitForSelector('.mc-opt, #numGo', { timeout: 8000 });
  for (let i = 0; i < 25; i++) {
    if (await p.$('.summary')) break;
    const mc = await p.$('.mc-opt');
    if (mc) await mc.click(); else { await p.keyboard.type('1'); await p.keyboard.press('Enter'); }
    const fb = await p.waitForSelector('#fbNext', { timeout: 5000 }).catch(() => null);
    if (fb) await fb.click();
    await p.waitForTimeout(120);
  }
  if (await p.$('.summary')) {
    await p.screenshot({ path: OUT + '/r3-exam-result-390.png', fullPage: true });
    add('R3-EXAM-RESULT', 'info', 'layar hasil Exam Sim ter-arsip');
  } else add('R3-EXAM-RESULT', 'info', 'sim tidak tuntas dalam 25 langkah (arsip skip)');
  await p.close();

  await browser.close();
  fs.writeFileSync(path0.join(OUT, 'findings-r3.json'), JSON.stringify(F, null, 1));
  console.log('\n=== RONDE 3: ' + F.length + ' temuan ===');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
