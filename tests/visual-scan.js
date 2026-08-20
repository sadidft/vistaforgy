/* Vista Forgy — tests/visual-scan.js (VISUAL SCANNER — mode QA, bukan pass/fail test)
   Merender state aplikasi × viewport, lalu MENGUKUR:
   V1 teks terpotong (scrollWidth > clientWidth pada elemen daun)
   V2 overlap teks (perpotongan bbox antar elemen teks non-pewaris)
   V3 tap target < 40px (interaktif)
   V4 kontras WCAG < 4.5:1 (teks vs bg leluhur solid terdekat)
   V5 elemen keluar viewport horizontal / tertutup bottom-nav
   V6 font < 12px
   V7 inkonsistensi token (border-radius tombol, padding panel)
   Output: JSON findings + screenshot per state di design/scan/
   Jalankan: cd /home/user/e2e-work && node ../vista-forgy/tests/visual-scan.js */
'use strict';
const path0 = require('path');
const pw = require(path0.resolve(process.env.PW_PATH || '/home/user/e2e-work/node_modules/playwright-core'));
const fs = require('fs');
const ROOT = path0.resolve(process.env.VF_ROOT || '/home/user/vista-forgy');
const APP = 'file://' + path0.join(ROOT, 'VistaForgy-standalone.html');
const seedSave = require(path0.join(ROOT, 'tests/visual-seed.js'));
const OUT = path0.join(ROOT, 'design', 'scan');
fs.mkdirSync(OUT, { recursive: true });

const FINDINGS = [];
function add(state, code, sev, detail) {
  FINDINGS.push({ state, code, sev, detail });
}

const COLLECT = `(() => {
  const iw = window.innerWidth, ih = window.innerHeight;
  const out = { clipped: [], overlaps: [], tinyTap: [], lowContrast: [], outOfView: [], navCover: [], tinyFont: [] };
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 4 && r.height > 4 && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity || 1) > 0.05; };
  const textLeaves = [];
  document.querySelectorAll('body *').forEach(el => {
    if (!vis(el)) return;
    const s = getComputedStyle(el);
    // V1 clipped
    if (el.scrollWidth - el.clientWidth > 2 && s.overflowX !== 'auto' && s.overflowX !== 'scroll' && el.clientWidth > 10) {
      const direct = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
      if (direct || el.children.length === 0) {
        out.clipped.push({ tag: el.tagName, cls: (el.className + '').slice(0, 34), sw: el.scrollWidth, cw: el.clientWidth, txt: (el.textContent || '').trim().slice(0, 36) });
      }
    }
    // V6 font
    const fs2 = parseFloat(s.fontSize);
    const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText && fs2 < 12) out.tinyFont.push({ cls: (el.className + '').slice(0, 30), fs: fs2, txt: (el.textContent || '').trim().slice(0, 30) });
    if (hasText && fs2 > 0) textLeaves.push({ el, r: el.getBoundingClientRect(), fs: fs2, fw: s.fontWeight, col: s.color });
    // V3 tap target
    const interactive = el.matches('button,[role=button],input,select,a[href],.key,.mc-opt,.mini-btn,.nav-btn,.dd-opt,label.dd-btn');
    if (interactive && !el.disabled && !el.hidden && vis(el)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && Math.min(r.width, r.height) < 40) {
        out.tinyTap.push({ cls: (el.className + '').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), txt: (el.textContent || '').trim().slice(0, 24) });
      }
    }
  });
  // V2 overlap antar teks (beda orang tua langsung)
  for (let i = 0; i < textLeaves.length && i < 900; i++) {
    for (let j = i + 1; j < Math.min(textLeaves.length, i + 40); j++) {
      const a = textLeaves[i], b = textLeaves[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.el.parentElement === b.el.parentElement) continue;
      const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ox > 6 && oy > 6) {
        // abaiki parent-layout wajar (kolom tabel, flex berdampingan dgn gap)
        const pa = a.el.parentElement.getBoundingClientRect(), pb = b.el.parentElement.getBoundingClientRect();
        const sameRow = Math.abs(pa.top - pb.top) < 3 && pa.right <= pb.left + 4 || Math.abs(pa.top - pb.top) < 3 && pb.right <= pa.left + 4;
        if (!sameRow) out.overlaps.push({ a: (a.el.className + '').slice(0, 26) || a.el.tagName, b: (b.el.className + '').slice(0, 26) || b.el.tagName, ax: Math.round(ox), ay: Math.round(oy) });
      }
    }
  }
  // V4 kontras
  function parseC(c) { const m = c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
  function lum(rgb) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); }
  const seen = new Set();
  textLeaves.forEach(t => {
    let el = t.el, bg = null;
    while (el) { const c = parseC(getComputedStyle(el).backgroundColor); if (c && c[3] > 0.85) { bg = c; break; } el = el.parentElement; }
    if (!bg) bg = [11, 18, 32, 1];
    const fg = parseC(t.col); if (!fg) return;
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = t.fs >= 24 || (t.fs >= 18.66 && (+t.fw >= 700));
    const min = large ? 3 : 4.5;
    if (ratio < min - 0.05) {
      const key = (t.el.className + '') + Math.round(ratio * 10);
      if (!seen.has(key) && seen.size < 4000) { seen.add(key); out.lowContrast.push({ cls: (t.el.className + '').slice(0, 30), ratio: Math.round(ratio * 100) / 100, fs: Math.round(t.fs), txt: (t.el.textContent || '').trim().slice(0, 26) }); }
    }
  });
  // V5 keluar viewport horizontal + tertutup nav bawah
  const nav = document.querySelector('nav.bottom');
  const navR = nav ? nav.getBoundingClientRect() : null;
  document.querySelectorAll('body *').forEach(el => {
    if (!vis(el)) return;
    const s = getComputedStyle(el);
    if (s.position === 'fixed') return;
    const r = el.getBoundingClientRect();
    if (r.width > 6 && (r.right > iw + 1.5 || r.left < -1.5)) out.outOfView.push({ cls: (el.className + '').slice(0, 30), right: Math.round(r.right), left: Math.round(r.left), iw });
    if (navR && el.matches('button,.mc-opt,.key,input,[role=button]') && !el.disabled) {
      const oy = Math.min(r.bottom, navR.bottom) - Math.max(r.top, navR.top);
      if (oy > 4) out.navCover.push({ cls: (el.className + '').slice(0, 28), oy: Math.round(oy), txt: (el.textContent || '').trim().slice(0, 20) });
    }
  });
  // V7 konsistensi token
  const radii = new Set(), pads = new Set();
  document.querySelectorAll('.btn').forEach(b => radii.add(getComputedStyle(b).borderRadius));
  document.querySelectorAll('.screen > .panel').forEach(p => pads.add(getComputedStyle(p).padding));
  out.tokenConsistency = { btnRadii: Array.from(radii), panelPads: Array.from(pads) };
  return out;
})()`;

const STATES = [
  { id: 'home-390-dark', vp: [390, 844], nav: '#/home', wait: '#factoryCv' },
  { id: 'home-360-dark', vp: [360, 800], nav: '#/home', wait: '#factoryCv' },
  { id: 'home-768-dark', vp: [768, 1024], nav: '#/home', wait: '#factoryCv' },
  { id: 'home-1440-dark', vp: [1440, 900], nav: '#/home', wait: '#factoryCv' },
  { id: 'home-390-light', vp: [390, 844], nav: '#/home', wait: '#factoryCv', light: true },
  { id: 'map-390', vp: [390, 844], nav: '#/map', wait: '.tier-sec' },
  { id: 'map-1440', vp: [1440, 900], nav: '#/map', wait: '.tier-sec' },
  { id: 'map-390-search', vp: [390, 844], nav: '#/map', wait: '#mapSearch', act: async p => { await p.fill('#mapSearch', 'LP'); await p.waitForTimeout(300); } },
  { id: 'stats-390', vp: [390, 844], nav: '#/stats', wait: '.heatmap' },
  { id: 'stats-1440', vp: [1440, 900], nav: '#/stats', wait: '.heatmap' },
  { id: 'data-390', vp: [390, 844], nav: '#/data', wait: '#btnExport' },
  { id: 'settings-390', vp: [390, 844], nav: '#/settings', wait: '#btnReset' },
  { id: 'settings-dd-open-down-390', vp: [390, 844], nav: '#/settings', wait: '#ddGoal', act: async p => { await p.click('#ddGoal .dd-btn'); await p.waitForTimeout(450); } },
  { id: 'settings-dd-open-up-390', vp: [390, 844], nav: '#/settings', wait: '#ddTheme', act: async p => { await p.evaluate(() => document.querySelector('#ddTheme').scrollIntoView({ block: 'center' })); await p.click('#ddTheme .dd-btn'); await p.waitForTimeout(450); } },
  { id: 'settings-1440', vp: [1440, 900], nav: '#/settings', wait: '#btnReset' },
  { id: 'onboarding-390', vp: [390, 844], fresh: true, wait: '#obGo' },
  { id: 'onboarding-calib-390', vp: [390, 844], fresh: true, wait: '#obCalib', act: async p => { await p.click('#obCalib'); await p.waitForSelector('.calib-opt', { timeout: 5000 }); await p.waitForTimeout(400); } },
  { id: 'runner-mc-390', vp: [390, 844], nav: '#/run?mode=zeno&node=log.implikasi', wait: '.qcard' },
  { id: 'runner-numeric-390', vp: [390, 844], nav: '#/run?mode=zeno&node=kald.power', wait: '#numGo' },
  { id: 'runner-numeric-1440', vp: [1440, 900], nav: '#/run?mode=zeno&node=kald.power', wait: '#numGo' },
  { id: 'runner-steps-390', vp: [390, 844], nav: '#/run?mode=zeno&node=lin.gauss', wait: '#stepsGo' },
  { id: 'runner-lp-390', vp: [390, 844], nav: '#/run?mode=zeno&node=rso.lp-grafis', wait: '.qcard' },
  { id: 'runner-queue-390', vp: [390, 844], nav: '#/run?mode=zeno&node=ant.mm1', wait: '.qcard', settle: 2500 },
  { id: 'feedback-390', vp: [390, 844], nav: '#/run?mode=zeno&node=kald.power', wait: '#numGo', act: async p => { await p.keyboard.type('999'); await p.keyboard.press('Enter'); await p.waitForSelector('#fbNext', { timeout: 5000 }); await p.waitForTimeout(600); } },
  { id: 'concept-modal-390', vp: [390, 844], nav: '#/map', wait: '.node-chip', act: async p => { await p.evaluate(() => document.querySelector('.node-chip').click()); await p.waitForSelector('#nmCard', { timeout: 4000 }); await p.click('#nmCard'); await p.waitForSelector('.concept', { timeout: 4000 }); await p.waitForTimeout(500); } }
];

(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  const seed = seedSave();
  for (const st of STATES) {
    const page = await browser.newPage({ viewport: { width: st.vp[0], height: st.vp[1] } });
    try {
      if (st.fresh) {
        await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
      } else {
        const s = JSON.parse(JSON.stringify(seed));
        // scanner butuh SEMUA jalur soal terbuka: paksa seluruh skill lancar + tier 4
        Object.keys(s.skills).forEach(k => { s.skills[k].status = 'lancar'; s.skills[k].streakBenar = 3; });
        s.tiers.unlocked = 4;
        ['rso.lp-model','pro.bayes','alj2.sistem','lin.mtops','lin.determinan','kald.integral-tak-tentu','dat2.sebaran','kald.limit','alj2.kuadrat-faktor'].forEach(id => {
          if (!s.skills[id]) s.skills[id] = { elo: 1300, D: 4, S: 5, lastReviewTs: Date.now(), dueTs: 0, streakBenar: 3, medianMs: 20000, attempts: 9, status: 'lancar', hist: [1, 1] };
        });
        if (st.light) s.settings.theme = 'light';
        await page.addInitScript(sv => { try { localStorage.setItem('vf.save', sv); } catch (e) {} }, JSON.stringify(s));
      }
      await page.goto(APP + (st.nav || ''));
      await page.waitForSelector(st.wait, { timeout: 9000 });
      if (st.act) await st.act(page);
      await page.waitForTimeout(st.settle || 700);
      await page.screenshot({ path: path0.join(OUT, st.id + '.png'), fullPage: st.id.startsWith('map') || st.id.startsWith('stats') });
      const res = await page.evaluate(COLLECT);
      // agregasi
      res.clipped.slice(0, 4).forEach(c => add(st.id, 'V1-CLIP', 'high', JSON.stringify(c)));
      res.overlaps.slice(0, 4).forEach(o => add(st.id, 'V2-OVERLAP', 'high', JSON.stringify(o)));
      res.tinyTap.slice(0, 5).forEach(t => add(st.id, 'V3-TAP', 'med', JSON.stringify(t)));
      res.lowContrast.slice(0, 6).forEach(c => add(st.id, 'V4-CONTRAST', 'med', JSON.stringify(c)));
      res.outOfView.slice(0, 3).forEach(o => add(st.id, 'V5-OUTVIEW', 'high', JSON.stringify(o)));
      res.navCover.slice(0, 3).forEach(o => add(st.id, 'V5-NAVCover', 'high', JSON.stringify(o)));
      res.tinyFont.slice(0, 3).forEach(o => add(st.id, 'V6-FONT', 'low', JSON.stringify(o)));
      const tc = res.tokenConsistency;
      if (tc.btnRadii.length > 2) add(st.id, 'V7-TOKEN', 'low', 'radius tombol campur: ' + tc.btnRadii.join(' | '));
      if (tc.panelPads.length > 1) add(st.id, 'V7-TOKEN', 'low', 'padding panel campur: ' + tc.panelPads.join(' | '));
      console.log('scan:', st.id, '✓');
    } catch (e) {
      add(st.id, 'V0-RENDER', 'high', 'state gagal dirender: ' + e.message.split('\n')[0]);
      console.log('scan:', st.id, 'GAGAL —', e.message.split('\n')[0]);
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path0.join(OUT, 'findings.json'), JSON.stringify(FINDINGS, null, 1));
  console.log('\n=== TEMUAN: ' + FINDINGS.length + ' ===');
  const byCode = {};
  FINDINGS.forEach(f => { byCode[f.code] = (byCode[f.code] || 0) + 1; });
  console.log(JSON.stringify(byCode, null, 1));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
