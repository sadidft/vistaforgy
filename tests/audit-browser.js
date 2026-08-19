/* Vista Forgy — tests/audit-browser.js (BUG RECON browser)
   Merender SATU soal dari SETIAP node di browser nyata dan menjamin:
   B1. Nol error JS pada semua node.
   B2. Jika prompt merujuk visual ("lihat tabel/grafik/gambar/jaringan") → elemen .qvisual
       BENAR-BENAR dirender (bug kelas "soal butuh visual tapi tak tampil").
   B3. Jalur kalibrasi onboarding: 6 soal maju + visual ikut dirender.
   Jalankan: cd /home/user/e2e-work && node ../vista-forgy/tests/audit-browser.js */
'use strict';
const { chromium } = require(process.env.PW_PATH || '/home/user/e2e-work/node_modules/playwright-core');
const fs = require('fs');
const APP = 'file:///home/user/vista-forgy/VistaForgy-standalone.html';

let pass = 0, fail = 0;
const findings = [];
const ok = (c, n) => { if (c) pass++; else { fail++; findings.push(n); console.log('  ✗ ' + n); } };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // ---- siapkan save dengan SEMUA node terbuka ----
  await page.goto(APP);
  await page.waitForSelector('#obGo', { timeout: 8000 });
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('vf.save')) || {};
    s.version = 1;
    s.profile = { name: 'Auditor', track: 'ti', dailyGoalMin: 25 };
    s.tiers = { current: 4, unlocked: 4, examHistory: [] };
    s.skills = s.skills || {};
    window.VF.ENGINE.allNodes().forEach(n => {
      if (!s.skills[n.id]) s.skills[n.id] = { elo: 1200, D: 4, S: 3, lastReviewTs: Date.now(), dueTs: 0, streakBenar: 2, medianMs: 30000, attempts: 4, status: 'lancar', hist: [1, 1] };
    });
    s.streak = { current: 1, best: 1, shields: 0, lastSessionDate: '' };
    s.stats = { totalQuestions: 10, totalSessions: 1, dailyLog: [], lastBossTs: 0, sessionsSinceBoss: 0, sharpHistory: [], bestCombo: 2 };
    s.badges = [];
    s.settings = { sound: false, volume: 0.3, serious: true, motion: 'reduced', theme: 'dark' };
    s.schemaMigrations = [1];
    localStorage.setItem('vf.save', JSON.stringify(s));
    history.replaceState(null, '', location.pathname); // buang hash #/onboarding agar boot ke beranda
  });
  await page.reload();
  await page.waitForSelector('#btnStart', { timeout: 8000 });
  const rs = await page.$('#rsNo'); if (rs) await rs.click();

  const nodes = await page.evaluate(() => window.VF.ENGINE.allNodes().map(n => n.id));
  ok(nodes.length >= 140, 'jumlah node terbaca: ' + nodes.length);
  const RE_VISUAL = /(lihat\s+(tabel|grafik|gambar|jaringan|boxplot|control\s*chart|kurva)|tabel\s+di\s+bawah|di\s+tabel)/i;
  let audited = 0, withVisual = 0;

  for (const id of nodes) {
    // jawaban salah di soal sebelumnya dapat menurunkan status prasyarat (perilaku by design);
    // audit harus independen: pulihkan status prasyarat node ini sebelum akses
    await page.evaluate(nid => {
      const n = window.VF.ENGINE.getNode(nid);
      n.prereq.forEach(pid => {
        const st = VF.save.skills[pid];
        if (st) { st.status = 'lancar'; st.streakBenar = 3; }
      });
    }, id);
    await page.evaluate(nid => { location.hash = '#/run?mode=zeno&node=' + nid; }, id);
    await page.waitForSelector('.qcard, #btnStart', { timeout: 8000 });
    if (await page.$('#btnStart')) {
      const dbg = await page.evaluate(() => ({
        hash: location.hash,
        sess: !!(window.VF.RUNNER && VF.RUNNER.sess),
        toast: Array.from(document.querySelectorAll('.toast')).map(t => t.textContent).join('|').slice(0, 120)
      }));
      ok(false, 'B0 ' + id + ': dialihkan :: ' + JSON.stringify(dbg));
      continue;
    }
    const info = await page.evaluate(() => {
      const q = document.querySelector('.q-prompt');
      return { prompt: q ? q.textContent : '', visual: !!document.querySelector('.qvisual') };
    });
    audited++;
    if (info.visual) withVisual++;
    if (RE_VISUAL.test(info.prompt)) ok(info.visual, 'B2 ' + id + ': prompt merujuk visual tapi TIDAK dirender :: ' + info.prompt.slice(0, 70));
    // lanjut ke soal ke-2 utk memastikan generator tak macet
    const mc = await page.$('.mc-opt');
    if (mc) { await mc.click(); const fb = await page.waitForSelector('#fbNext', { timeout: 4000 }).catch(() => null); ok(!!fb, 'B1 ' + id + ': feedback tak muncul'); if (fb) await fb.click(); }
    else {
      const num = await page.$('#numGo');
      if (num) { await page.keyboard.type('1'); await page.keyboard.press('Enter'); const fb = await page.waitForSelector('#fbNext', { timeout: 4000 }).catch(() => null); ok(!!fb, 'B1 ' + id + ': feedback tak muncul'); if (fb) await fb.click(); }
      else {
        const st = await page.$('#stepsGo');
        if (st) { const ins = await page.$$('.step-in'); for (const i of ins) await i.fill('1'); await st.click(); const fb = await page.waitForSelector('#fbNext', { timeout: 4000 }).catch(() => null); ok(!!fb, 'B1 ' + id + ': feedback tak muncul'); if (fb) await fb.click(); }
      }
    }
  }
  ok(audited === nodes.length, 'semua node ter-audit: ' + audited + '/' + nodes.length + ' (dgn visual: ' + withVisual + ')');
  ok(errors.length === 0, 'B1 nol error JS di seluruh ' + audited + ' node' + (errors.length ? ' → ' + errors.slice(0, 3).join(' | ') : ''));

  // ---- B3: jalur kalibrasi (bug yang dilaporkan pemakai) ----
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const err2 = [];
  p2.on('pageerror', e => err2.push(e.message));
  await p2.goto(APP);
  await p2.waitForSelector('#obCalib', { timeout: 8000 });
  await p2.click('#obCalib');
  let calibN = 0, calibVisualOk = true, calibDetail = '';
  for (let i = 0; i < 8; i++) {
    const done = await p2.$('.ok-box');
    if (done) break;
    await p2.waitForSelector('.calib-opt', { timeout: 5000 });
    const st = await p2.evaluate(() => {
      const q = document.querySelector('.q-prompt');
      return { prompt: q ? q.textContent : '', visual: !!document.querySelector('.qvisual'), meta: (document.querySelector('.q-meta') || {}).textContent || '' };
    });
    calibN++;
    if (RE_VISUAL.test(st.prompt) && !st.visual) { calibVisualOk = false; calibDetail = st.meta + ' :: ' + st.prompt.slice(0, 60); }
    await (await p2.$('.calib-opt')).click();
    await p2.waitForTimeout(450);
  }
  ok(calibN === 6, 'B3 kalibrasi menampilkan 6 soal (dapat ' + calibN + ')');
  ok(calibVisualOk, 'B3 kalibrasi: semua soal ber-visual menampilkan visualnya' + (calibVisualOk ? '' : ' :: ' + calibDetail));
  ok(err2.length === 0, 'B3 kalibrasi nol error JS');
  await p2.close();

  await browser.close();
  console.log('\n== AUDIT BROWSER: ' + pass + ' OK, ' + fail + ' GAGAL ==');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
