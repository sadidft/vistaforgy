/* Vista Forgy — tests/a11y.js (audit aksesibilitas axe-core, browser nyata)
   Memeriksa 5 layar utama + runner: pelanggaran serious/critical harus NOL.
   Jalankan: cd /home/user/e2e-work && node ../vista-forgy/tests/a11y.js */
'use strict';
const pw = require(process.env.PW_PATH || '/home/user/e2e-work/node_modules/playwright-core');
const fs = require('fs');
const axeSrc = fs.readFileSync(process.env.AXE_PATH || '/home/user/e2e-work/node_modules/axe-core/axe.min.js', 'utf8');
const APP = 'file:///home/user/vista-forgy/VistaForgy-standalone.html';
const seed = require('/home/user/vista-forgy/tests/visual-seed.js')();

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n); } };

(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(s => { try { localStorage.setItem('vf.save', s); } catch (e) {} }, JSON.stringify(seed));
  const screens = [
    ['#/home', '#btnStart', 'Beranda'],
    ['#/map', '.tier-sec', 'Peta'],
    ['#/stats', '.heatmap', 'Statistik'],
    ['#/data', '#btnExport', 'Data'],
    ['#/settings', '#btnReset', 'Setelan'],
    ['#/run?mode=zeno&node=rso.lp-grafis', '.qcard', 'Runner (soal LP)']
  ];
  let totalSerious = 0;
  for (const [hash, sel, label] of screens) {
    await page.goto(APP + hash);
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.waitForTimeout(400);
    await page.evaluate(axe => { window.eval(axe); }, axeSrc);
    const res = await page.evaluate(() =>
      window.axe.run(document, { resultTypes: ['violations'] }).then(r => r.violations.map(v => ({
        id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help
      })))
    );
    const serious = res.filter(v => v.impact === 'serious' || v.impact === 'critical');
    totalSerious += serious.length;
    ok(serious.length === 0, label + ': nol pelanggaran serious/critical' +
      (serious.length ? ' → ' + serious.map(s => s.id + '×' + s.nodes).join(', ') : '') +
      (res.length ? ' (minor: ' + res.filter(v => v.impact !== 'serious' && v.impact !== 'critical').map(v => v.id).join(',') + ')' : ''));
  }
  await browser.close();
  console.log('\n== A11Y AUDIT: ' + pass + ' OK, ' + fail + ' GAGAL (total serious/critical: ' + totalSerious + ') ==');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
