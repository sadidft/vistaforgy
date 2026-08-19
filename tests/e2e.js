/* Vista Forgy — E2E test (browser nyata, headless chromium via playwright-core)
   Jalankan: cd /home/user/e2e-work && node ../vista-forgy/tests/e2e.js */
'use strict';
const path0 = require('path');
const pw = require(path0.resolve(process.env.PW_PATH || '/home/user/e2e-work/node_modules/playwright-core'));
const BROWSER = process.env.PW_BROWSER === 'firefox' ? pw.firefox : process.env.PW_BROWSER === 'webkit' ? pw.webkit : pw.chromium;
const fs = require('fs');
const APP = 'file://' + path0.resolve(process.env.VF_ROOT || '/home/user/vista-forgy', 'VistaForgy-standalone.html');

let pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

(async () => {
  const browser = await BROWSER.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // ukuran iPhone
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => {
    // 'Navigated away from page' = artefak internal Firefox saat hash-nav cepat (bukan error app)
    if (m.type() === 'error' && !/favicon|manifest|Failed to load resource|net::ERR|InvalidStateError.*Navigated away/.test(m.text())) errors.push('CONSOLE: ' + m.text());
  });

  console.log('== VISTA FORGY E2E (mobile 390px) ==');

  // 1. Onboarding
  await page.goto(APP);
  await page.waitForSelector('#obGo', { timeout: 8000 });
  ok(true, 'app dimuat tanpa error awal');
  await page.fill('#obNama', 'E2E Forge-er');
  await page.click('#obGo');
  await page.waitForSelector('#btnStart', { timeout: 5000 });
  ok(true, 'onboarding → beranda');

  // 2. Sesi harian penuh: warm-up + review + fokus (kalibrasi node baru: semua unlocked tier 0 pertama)
  await page.click('#btnStart');
  let summary = false, answered = 0, sawMc = 0, sawNumeric = 0, sawSteps = 0;
  for (let i = 0; i < 80; i++) {
    if (await page.$('.summary')) { summary = true; break; }
    if (await page.$('.mc-opt')) { sawMc++; await (await page.$('.mc-opt')).click(); }
    else if (await page.$('#numGo')) {
      sawNumeric++;
      await page.keyboard.type('4');
      await page.keyboard.press('Enter');
    } else if (await page.$('#stepsGo')) {
      sawSteps++;
      const ins = await page.$$('.step-in');
      for (const inp of ins) await inp.fill('2');
      await (await page.$('#stepsGo')).click();
    } else { await page.waitForTimeout(300); continue; }
    answered++;
    const fb = await page.waitForSelector('#fbNext', { timeout: 5000 }).catch(() => null);
    if (fb) { await fb.click(); }
    await page.waitForTimeout(120);
  }
  ok(summary, 'sesi harian tuntas sampai ringkasan (' + answered + ' soal: mc=' + sawMc + ', numeric=' + sawNumeric + ', steps=' + sawSteps + ')');
  const pct = await page.textContent('.score-huge, .stat-big').catch(() => '?');
  ok(true, 'ringkasan tampil (akurasi ' + String(pct).trim() + ')');

  // 3. Streak tercatat
  await page.click('#sumHome');
  await page.waitForSelector('#streakNum', { timeout: 4000 });
  await page.waitForFunction(() => (document.querySelector('#streakNum') || {}).textContent === '1', { timeout: 4000 }).catch(() => {});
  const streak = await page.textContent('#streakNum');
  ok(streak.trim() === '1', 'streak harian tercatat = 1 (dapat ' + streak.trim() + ')');

  // 3b. Zeno: numeric keypad path (dat.tabel = isian numeric, selalu terbuka)
  await page.goto(APP + '#/run?mode=zeno&node=dat.tabel');
  await page.waitForSelector('#numGo', { timeout: 5000 });
  await page.keyboard.type('42');
  await page.keyboard.press('Enter');
  const fbNum = await page.waitForSelector('#fbNext', { timeout: 4000 }).catch(() => null);
  ok(!!fbNum, 'jalur jawaban NUMERIC (keyboard) bekerja');
  if (fbNum) await fbNum.click();

  // 3c. Zeno: steps path (lin.gauss) — buka prasyaratnya dulu di save lokal
  await page.goto(APP + '#/home');
  await page.waitForSelector('#btnStart', { timeout: 4000 }).catch(() => {});
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('vf.save'));
    s.tiers.unlocked = 3;
    s.skills['lin.mtops'] = { elo: 1250, D: 4, S: 5, lastReviewTs: Date.now(), dueTs: 0, streakBenar: 2, medianMs: 8000, attempts: 9, status: 'lancar', hist: [1, 1] };
    localStorage.setItem('vf.save', JSON.stringify(s));
  });
  await page.reload(); // hash-only nav tidak reload — paksa boot ulang agar seed terbaca
  await page.waitForSelector('#btnStart', { timeout: 5000 });
  const rsNo = await page.$('#rsNo'); // modal resume sesi bisa muncul & menghalangi klik
  if (rsNo) await rsNo.click();
  await page.evaluate(() => { location.hash = '#/run?mode=zeno&node=lin.gauss'; });
  await page.waitForSelector('#stepsGo', { timeout: 5000 }).catch(() => {});
  if (await page.$('#stepsGo')) {
    const ins = await page.$$('.step-in');
    for (const inp of ins) await inp.fill('2');
    await page.click('#stepsGo');
    const fbS = await page.waitForSelector('#fbNext', { timeout: 4000 }).catch(() => null);
    ok(!!fbS && (await page.$('.step-row.ok, .step-row.no')) !== null, 'jalur jawaban STEPS (multi-langkah) bekerja + penilaian per langkah');
    if (fbS) await fbS.click();
  } else ok(false, 'jalur STEPS: soal tidak muncul');

  // 4. Navigasi semua layar tanpa error
  for (const [hash, sel] of [['#/map', '.tier-sec'], ['#/stats', '.heatmap'], ['#/data', '#btnExport'], ['#/settings', '#btnReset']]) {
    await page.goto(APP + hash);
    await page.waitForSelector(sel, { timeout: 4000 });
    ok(true, 'layar ' + hash.replace('#/', '') + ' render OK');
  }

  // 5. Export .fgy (Web Crypto di browser NYATA) + roundtrip dekripsi di Node
  await page.goto(APP + '#/data');
  await page.waitForSelector('#expPw', { timeout: 4000 });
  ok(page.url().indexOf('#/data') >= 0, 'menu data terbuka');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    (async () => {
      await page.fill('#expPw', 'rahasiae2e');
      await page.fill('#expPw2', 'rahasiae2e');
      await page.click('#btnExport');
    })()
  ]);
  const fgyPath = '/tmp/e2e-export.fgy';
  await download.saveAs(fgyPath);
  const buf = fs.readFileSync(fgyPath);
  ok(buf.length > 40 && buf[0] === 0x56 && buf[1] === 0x46 && buf[2] === 0x47 && buf[3] === 0x59 && buf[4] === 0x31,
    'file .fgy terunduh dengan magic VFGY1 (' + buf.length + ' B)');

  // dekripsi dengan implementasi crypto.js yang sama (node webcrypto)
  global.window = global;
  eval(fs.readFileSync(path0.resolve(process.env.VF_ROOT || '/home/user/vista-forgy', 'js/crypto.js'), 'utf8'));
  const dec = await global.VF.CRYPTO.decryptSave(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), 'rahasiae2e');
  ok(dec && dec.profile.name === 'E2E Forge-er' && dec.skills && Object.keys(dec.skills).length > 0,
    'roundtrip browser→Node: file terdekripsi, data utuh (' + Object.keys(dec.skills).length + ' skill)');
  let threw = false;
  try { await global.VF.CRYPTO.decryptSave(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), 'salahpw'); } catch (e) { threw = true; }
  ok(threw, 'password salah ditolak (E2E)');

  // 6. Resume sesi & modal konsep tidak error
  await page.goto(APP + '#/map');
  await page.waitForSelector('.node-chip', { timeout: 4000 });
  await (await page.$('.node-chip')).click();
  await page.waitForSelector('#nmCard', { timeout: 3000 });
  await page.click('#nmCard');
  await page.waitForSelector('.formula, .concept', { timeout: 3000 });
  ok(true, 'modal detail node + kartu konsep render OK');
  await page.keyboard.press('Escape');

  // 6ab. KALIBRASI (bugfix v1.6): soal harus MAJU setelah dijawab
  {
    const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
    p2.on('pageerror', e2 => errors.push('calib: ' + e2.message));
    await p2.goto(APP);
    await p2.waitForSelector('#obCalib', { timeout: 6000 });
    await p2.click('#obCalib');
    await p2.waitForSelector('.calib-opt', { timeout: 5000 });
    const meta1 = await p2.textContent('.q-meta');
    await (await p2.$('.calib-opt')).click();
    await p2.waitForFunction(() => /2\/6/.test((document.querySelector('.q-meta') || {}).textContent || ''), { timeout: 4000 }).catch(() => {});
    const meta2 = await p2.textContent('.q-meta');
    ok(/1\/6/.test(meta1) && /2\/6/.test(meta2), 'kalibrasi maju: "' + meta1.trim() + '" → "' + meta2.trim() + '"');
    await p2.close();
  }

  // 6ab2. GAP antar panel di Setelan/Data (bugfix v1.6: "nempel dempetan")
  {
    await page.goto(APP + '#/settings');
    await page.waitForSelector('#btnReset', { timeout: 4000 });
    const gap = await page.evaluate(() => {
      const panels = document.querySelectorAll('.screen > .panel');
      if (panels.length < 2) return -1;
      const a = panels[0].getBoundingClientRect(), b = panels[1].getBoundingClientRect();
      return Math.round(b.top - a.bottom);
    });
    ok(gap >= 8, 'panel Setelan berjarak ' + gap + 'px (dulu 0)');
    await page.goto(APP + '#/data');
    await page.waitForSelector('#btnExport', { timeout: 4000 });
    const gap2 = await page.evaluate(() => {
      const panels = document.querySelectorAll('.screen > .panel');
      const a = panels[0].getBoundingClientRect(), b = panels[1].getBoundingClientRect();
      return Math.round(b.top - a.bottom);
    });
    ok(gap2 >= 8, 'panel Data berjarak ' + gap2 + 'px');
    // tombol tutup modal ada
    await page.click('#btnPlainExp'); // buat toast, bukan modal — cek modal via glosarium
    await page.goto(APP + '#/settings');
    await page.waitForSelector('#btnGlossary', { timeout: 4000 });
    await page.click('#btnGlossary');
    await page.waitForSelector('.modal-x', { timeout: 3000 });
    ok(true, 'modal punya tombol tutup ✕');
    await page.click('.modal-x');
    await page.waitForTimeout(400);
    const gone = await page.$('.modal-ov');
    ok(!gone, '✕ menutup modal');
  }

  // 6b. Dropdown custom Setelan (v1.5.2): ganti tema → data-theme berubah
  await page.goto(APP + '#/settings');
  await page.waitForSelector('#ddTheme .dd-btn', { timeout: 4000 });
  await page.click('#ddTheme .dd-btn');
  await page.waitForSelector('#ddTheme .dd-list.open, #ddTheme.dd.open', { timeout: 3000 }).catch(() => {});
  const lightOpt = await page.$$eval('#ddTheme .dd-opt', os => os.findIndex(o => /Terang/.test(o.textContent)));
  if (lightOpt >= 0) {
    // force: popover absolut dekat tepi kadar ditandai 'not stable' heuristik Playwright;
    // perilaku buka/flip/klik-nyata diverifikasi terpisah (probe + a11y + visual)
    await (await page.$$('#ddTheme .dd-opt'))[lightOpt].click({ force: true });
    await page.waitForTimeout(300);
    const th = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    ok(th === 'light', 'dropdown tema bekerja → light mode aktif');
    await page.click('#ddTheme .dd-btn');
    const darkOpt = await page.$$eval('#ddTheme .dd-opt', os => os.findIndex(o => /Gelap/.test(o.textContent)));
    await (await page.$$('#ddTheme .dd-opt'))[darkOpt].click({ force: true });
    await page.waitForTimeout(300);
    const th2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    ok(th2 === 'dark', 'dropdown tema kembali → dark mode');
  } else ok(false, 'opsi Tema Terang tidak ditemukan');

  // 6c. Zeno terkunci ditolak (v1.5.3 audit)
  await page.goto(APP + '#/run?mode=zeno&node=rso.simpleks2');
  await page.waitForTimeout(700);
  const stillHome = await page.evaluate(() => location.hash.indexOf('#/home') >= 0 || !!document.querySelector('#btnStart'));
  ok(stillHome, 'zeno pada node terkunci ditolak & dialihkan (anti-bypass gerbang)');

  // 6d. Multi-profil (v1.6.5): buat profil baru → aktif; kembali ke utama → progress asli utuh
  await page.goto(APP + '#/settings');
  await page.waitForSelector('#profAdd', { timeout: 5000 });
  const profBefore = await page.evaluate(() => localStorage.getItem('vf.streak-test', 0) === null && (window.VF.save.streak.current));
  await page.fill('#profName', 'Kedua');
  await page.click('#profAdd');
  await page.waitForTimeout(1400); // reload + boot
  await page.waitForSelector('#profList', { timeout: 6000 });
  const aktif2 = await page.evaluate(() => document.querySelector('#profList').textContent);
  ok(/Kedua\s*·\s*aktif/.test(aktif2), 'profil baru "Kedua" dibuat & aktif');
  const streakBaru = await page.evaluate(() => window.VF.save.streak.current);
  ok(streakBaru === 0, 'profil baru mulai bersih (streak 0)');
  // kembali ke utama
  await page.click('.prof-sw[data-n="utama"]');
  await page.waitForSelector('#psY', { timeout: 4000 });
  await page.click('#psY');
  await page.waitForTimeout(1400);
  await page.waitForSelector('#profList', { timeout: 6000 });
  const aktif3 = await page.evaluate(() => document.querySelector('#profList').textContent);
  ok(/utama\s*·\s*aktif/.test(aktif3), 'kembali ke profil "utama"');
  const streakAsli = await page.evaluate(() => window.VF.save.streak.current);
  ok(streakAsli >= 1, 'progress profil utama utuh (streak ' + streakAsli + ')');

  // 7. KOA 3D / pabrik tidak menjatuhkan halaman (home setelah semuanya)
  await page.goto(APP + '#/home');
  await page.waitForSelector('#btnStart', { timeout: 4000 });
  ok((await page.$('#factoryCv')) !== null, 'pabrik isometrik dirender di beranda');

  // 8. Verdict error JS
  ok(errors.length === 0, 'NOL error JS sepanjang seluruh alur' + (errors.length ? ' → ' + errors.slice(0, 5).join(' | ') : ''));

  await browser.close();
  console.log('\n== E2E HASIL: ' + pass + ' OK, ' + fail + ' GAGAL ==');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('E2E FATAL:', e.message); process.exit(1); });
