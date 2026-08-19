/* Vista Forgy — Visual QA matrix (playwright): 7 viewport × 4 layar + runner.
   - Overflow check: tidak boleh ada scroll horizontal
   - Zero JS error
   - Screenshot tersimpan di design/ (materi usulan + regresi visual manual)
   Jalankan: cd /home/user/e2e-work && node ../vista-forgy/tests/visual.js */
'use strict';
const { chromium } = require('/home/user/e2e-work/node_modules/playwright-core');
const fs = require('fs');
const APP = 'file:///home/user/vista-forgy/VistaForgy-standalone.html';
const OUT = '/home/user/vista-forgy/design';
const seedSave = require('/home/user/vista-forgy/tests/visual-seed.js');
fs.mkdirSync(OUT, { recursive: true });

/* save "demo kaya" agar screenshot mewakili kondisi pemakaian nyata */
const VIEWPORTS = [
  [360, 800, '360-android-kecil'], [390, 844, '390-iphone'],
  [414, 896, '414-android'], [768, 1024, '768-tablet'],
  [1024, 768, '1024-laptop'], [1440, 900, '1440-desktop'], [1920, 1080, '1920-lebar']
];
const SCREENS = [['#/home', 'home'], ['#/map', 'map'], ['#/stats', 'stats'], ['#/data', 'data']];

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n); } };

(async () => {
  const browser = await chromium.launch({ headless: true });
  let errors = [];
  for (const [w, h, label] of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', e => errors.push(label + ': ' + e.message));
    await page.addInitScript(s => { try { localStorage.setItem('vf.save', s); } catch (e) {} }, JSON.stringify(seedSave()));
    for (const [hash, name] of SCREENS) {
      await page.goto(APP + hash);
      await page.waitForSelector(name === 'home' ? '#btnStart' : (name === 'map' ? '.tier-sec' : (name === 'stats' ? '.heatmap' : '#btnExport')), { timeout: 6000 });
      await page.waitForTimeout(450);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(overflow <= 1, label + ' · ' + name + ' tanpa overflow horizontal (' + overflow + 'px)');
      if (['360-android-kecil', '390-iphone', '768-tablet', '1440-desktop'].includes(label)) {
        await page.screenshot({ path: OUT + '/' + name + '-' + label + '.png', fullPage: name === 'stats' });
      }
    }
    // runner di 2 ukuran representatif
    if (label === '390-iphone' || label === '1440-desktop') {
      await page.goto(APP + '#/run?mode=zeno&node=rso.lp-grafis');
      await page.waitForSelector('.qcard', { timeout: 8000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: OUT + '/runner-lp-' + label + '.png' });
      ok(true, label + ' · soal LP grafis (visual interaktif) render');
    }
    await page.close();
  }
  // feedback pembahasan + steps (untuk materi usulan)
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => errors.push('feedback: ' + e.message));
  await page.addInitScript(s => { try { localStorage.setItem('vf.save', s); } catch (e) {} }, JSON.stringify(seedSave()));
  await page.goto(APP + '#/run?mode=zeno&node=ant.mm1');
  await page.waitForSelector('.qcard', { timeout: 8000 });
  const mc = await page.$('.mc-opt');
  if (mc) { await mc.click(); } else { await page.keyboard.type('3'); await page.keyboard.press('Enter'); }
  await page.waitForSelector('#fbNext', { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/feedback-mm1-390.png', fullPage: true });
  ok(true, 'layar pembahasan (antrean M/M/1 + animasi) terpotret');

  await browser.close();
  ok(errors.length === 0, 'NOL error JS di seluruh matriks visual' + (errors.length ? ' → ' + errors.slice(0, 3).join(' | ') : ''));
  console.log('\n== VISUAL QA: ' + pass + ' OK, ' + fail + ' GAGAL ==');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
