/* Vista Forgy — tests/visual-scan2.js (RONDE 2 — state tak-tercover + probe matematika)
   Fokus: landscape, 320px, light-theme ALL screens, dynamic content ekstrem,
   matematika ring timer, alignment heatmap & desktop, font nyata, tinggi baris. */
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
const add = (code, sev, detail) => { F.push({ code, sev, detail }); console.log('  [' + code + '/' + sev + '] ' + detail.slice(0, 120)); };

function prepSeed(light, extra) {
  const s = seedSave();
  Object.keys(s.skills).forEach(k => { s.skills[k].status = 'lancar'; s.skills[k].streakBenar = 3; });
  s.tiers.unlocked = 4;
  s.settings.motion = 'reduced'; s.settings.serious = true; s.settings.sound = false;
  if (light) s.settings.theme = 'light';
  if (extra === 'gate') { // buka panel gerbang promosi di home
    Object.keys(s.skills).forEach(k => { if (s.skills[k]) s.skills[k].attempts = 15; });
    s.stats.lastBossTs = Date.now() - 9 * 86400000; s.stats.sessionsSinceBoss = 4;
  }
  if (extra === 'longname') s.profile.name = 'Muhammad Rizky PratamaWijaya';
  return s;
}

(async () => {
  const browser = await pw.chromium.launch({ headless: true });

  async function shot(id, vp, nav, waitSel, opts = {}) {
    const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] } });
    try {
      await page.addInitScript(sv => localStorage.setItem('vf.save', sv), JSON.stringify(prepSeed(opts.light, opts.extra)));
      await page.goto(APP + nav);
      await page.waitForSelector(waitSel, { timeout: 9000 });
      if (opts.act) await opts.act(page);
      await page.waitForTimeout(opts.settle || 700);
      await page.screenshot({ path: path0.join(OUT, id + '.png'), fullPage: !!opts.full });
      return page;
    } catch (e) {
      add('V0', 'high', id + ' gagal render: ' + e.message.split('\n')[0]);
      await page.close();
      return null;
    }
  }

  // ===== R1: LANDSCAPE =====
  let p = await shot('r2-landscape-home-740x360', [740, 360], '#/home', '#btnStart');
  if (p) {
    const m = await p.evaluate(() => {
      const nav = document.querySelector('nav.bottom').getBoundingClientRect();
      const app = document.querySelector('#app').getBoundingClientRect();
      const start = document.querySelector('#btnStart').getBoundingClientRect();
      return { navH: Math.round(nav.height), vh: innerHeight, appBottom: Math.round(app.bottom), startBottom: Math.round(start.bottom), startVisible: start.bottom <= nav.top + 1 || scrollY > 0, contentBehindNav: app.bottom > nav.top };
    });
    add('R1-LANDSCAPE', 'med', 'home 740×360: nav=' + m.navH + 'px dari ' + m.vh + 'px (' + Math.round(m.navH / m.vh * 100) + '% layar), konten=behind nav: ' + m.contentBehindNav);
    await p.close();
  }
  p = await shot('r2-landscape-runner-740x360', [740, 360], '#/run?mode=zeno&node=kald.power', '#numGo');
  if (p) {
    const m = await p.evaluate(() => {
      const kp = document.querySelector('.keypad').getBoundingClientRect();
      const nav = document.querySelector('nav.bottom').getBoundingClientRect();
      const card = document.querySelector('.qcard').getBoundingClientRect();
      const sh = document.documentElement.scrollHeight;
      return { vh: innerHeight, sh, keypadBottom: Math.round(kp.bottom), navTop: Math.round(nav.top), keypadBehindNav: kp.bottom > nav.top && sh <= innerHeight, cardH: Math.round(card.height) };
    });
    add('R1-LANDSCAPE', 'med', 'runner 740×360: tinggi kartu=' + m.cardH + ' dari viewport ' + m.vh + ', keypad bottom=' + m.keypadBottom + ' vs navTop=' + m.navTop + ', halaman tak-bisa-scroll=' + (m.sh <= m.vh));
    await p.close();
  }

  // ===== R2: 320px =====
  p = await shot('r2-home-320', [320, 568], '#/home', '#btnStart');
  if (p) {
    const m = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nav-btn'));
      const r0 = btns[0].getBoundingClientRect(), r4 = btns[4].getBoundingClientRect();
      const gap = Math.max(0, r4.left - btns.slice(0, 4).reduce((a, b) => Math.max(a, b.getBoundingClientRect().right), 0));
      const greet = document.querySelector('.greet h1');
      return { navGapPx: Math.round(gap), navBtnW: Math.round(r0.width), greetWraps: greet ? greet.getClientRects().length : 0, overflowX: document.documentElement.scrollWidth > innerWidth };
    });
    add('R2-320', 'med', '320px: jarak antar tombol nav=' + m.navGapPx + 'px (lebar ' + m.navBtnW + '), judul multi-baris=' + (m.greetWraps > 1) + ', overflowX=' + m.overflowX);
    await p.close();
  }

  // ===== R3: LIGHT THEME semua layar + chart =====
  for (const st of [
    ['r2-light-map', '#/map', '.tier-sec'],
    ['r2-light-stats', '#/stats', '.heatmap'],
    ['r2-light-settings', '#/settings', '#btnReset'],
    ['r2-light-runner-lp', '#/run?mode=zeno&node=rso.lp-grafis', '.qcard']
  ]) {
    p = await shot(st[0], [390, 844], st[1], st[2], { light: true });
    if (!p) continue;
    if (st[0] === 'r2-light-runner-lp') {
      const m = await p.evaluate(() => {
        // gridline chart: hitung rasio kontras stroke putih-alpha vs bg light
        function lum(c) { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
        const bg = [242, 244, 248]; // --bg light
        const blend = (a, alpha) => a.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)));
        const ratio = (c1, c2) => { const L = c => lum(c); return Math.round(((Math.max(L(c1), L(c2)) + .05) / (Math.min(L(c1), L(c2)) + .05)) * 100) / 100; };
        return {
          gridline: ratio(blend([255, 255, 255], 0.06), bg),
          axis: ratio(blend([255, 255, 255], 0.2), bg),
          hmCellKosong: ratio(blend([255, 255, 255], 0.06), bg),
          runTrack: ratio(blend([255, 255, 255], 0.07), bg),
          qWaitBorder: ratio(blend([255, 255, 255], 0.15), bg)
        };
      });
      add('R3-LIGHT-CHART', 'high', 'gridline/axis chart putih-alpha di atas bg terang: rasio gridline=' + m.gridline + ':1, axis=' + m.axis + ':1, sel heatmap kosong=' + m.hmCellKosong + ':1, track progress=' + m.runTrack + ':1, garis antre=' + m.qWaitBorder + ':1 (nyaris tak terlihat; standar grafik ≥3:1)');
    }
    if (st[0] === 'r2-light-map') {
      const m = await p.evaluate(() => {
        const badge = document.querySelector('.tier-badge');
        const cs = getComputedStyle(badge);
        return { badgeColor: cs.color, badgeBg: cs.backgroundImage.slice(0, 60) };
      });
      add('R3-LIGHT', 'med', 'tier-badge: teks ' + m.badgeColor + ' di atas ' + m.badgeBg + ' — angka gelap di badge gradient tetap, tapi kontras dengan panel terang di sekitar perlu dicek visual');
    }
    await p.close();
  }

  // ===== R4: ring timer matematika =====
  p = await shot('r2-runner-numeric-390b', [390, 844], '#/run?mode=zeno&node=kald.power', '#numGo');
  if (p) {
    const m = await p.evaluate(() => {
      const circ = document.querySelector('.run-timer .ring circle:last-child');
      const da = circ.getAttribute('stroke-dasharray');
      const r = circ.getAttribute('r');
      const realC = 2 * Math.PI * parseFloat(r);
      return { dasharray: parseFloat(da), r: parseFloat(r), realCircumference: Math.round(realC * 100) / 100, hardcodedCIRC: 2 * Math.PI * 16 };
    });
    const sisa = Math.round((1 - m.hardcodedCIRC / m.realCircumference) * 100);
    add('R4-TIMER-RING', 'med', 'dasharray SVG=' + m.dasharray.toFixed(1) + ' (r=' + m.r + ') tapi JS pakai CIRC=' + m.hardcodedCIRC.toFixed(1) + ' → di detik terakhir ring MASIH terisi ~' + sisa + '% (tidak pernah kosong; skala menit detik meleset)');
    await p.close();
  }

  // ===== R5: heatmap alignment hari =====
  p = await shot('r2-home-heatmap', [390, 844], '#/home', '#factoryCv');
  if (p) {
    const m = await p.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.hm-cell'));
      const first = cells[0].title; // tanggal sel tertua
      const d = new Date(first.split(':')[0]);
      const colOfFirst = 0; // kolom pertama
      const weekdayFirst = d.getDay(); // 0=minggu
      const todayCol = (cells.length - 1) % 7;
      const todayWd = new Date().getDay();
      return { selPertama: first.split(':')[0], hariPertama: weekdayFirst, kolomTerakhir: todayCol, hariIni: todayWd, sejajar: (weekdayFirst + ((cells.length - 1) % 7)) % 7 === todayWd, jumlahSel: cells.length, lebarGridPx: Math.round(document.querySelector('.heatmap').scrollWidth) };
    });
    add('R5-HEATMAP', 'low', 'heatmap ' + m.jumlahSel + ' sel mulai hari-' + m.hariPertama + ' (kolom1) tapi hari ini jatuh di kolom-' + m.kolomTerakhir + ' vs weekday asli ' + m.hariIni + ' → kolom TIDAK mewakili hari tetap (pola terlihat miring); grid=' + m.lebarGridPx + 'px di panel ~330px → selalu scroll horizontal di mobile');
    await p.close();
  }

  // ===== R6: desktop alignment settings vs stats =====
  p = await shot('r2-desktop-1440-settings', [1440, 900], '#/settings', '#btnReset');
  if (p) {
    const sOff = await p.evaluate(() => Math.round(document.querySelector('.screen.narrow').getBoundingClientRect().left));
    await p.goto(APP + '#/stats'); await p.waitForSelector('.heatmap');
    const stOff = await p.evaluate(() => Math.round(document.querySelector('.screen').getBoundingClientRect().left));
    add('R6-DESKTOP-ALIGN', 'low', 'Setelan/Data container kiri=' + sOff + 'px lebar-maks 640 KIRI- aligned; Statistik/Peta kiri=' + stOff + 'px lebar penuh → dua sistem lebar berdampingan tak konsisten di desktop (biasanya narrow di-tengah)');
    await p.close();
  }

  // ===== R7: font tokens nyata =====
  p = await shot('r2-font-check', [390, 844], '#/home', '#btnStart');
  if (p) {
    const m = await p.evaluate(() => ({
      grotesk: document.fonts.check('16px "Space Grotesk"'),
      inter: document.fonts.check('16px "Inter"'),
      jetbrains: document.fonts.check('16px "JetBrains Mono"'),
      loadedFonts: Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i)
    }));
    add('R7-TYPOGRAPHY', 'med', 'token font "Space Grotesk/Inter/JetBrains Mono" TIDAK pernah dimuat (' + JSON.stringify(m) + ') → seluruh app render fallback sistem (Segoe/Roboto/SF) — identitas tipografi brand tidak pernah terealisasi');
    await p.close();
  }

  // ===== R8: opsi MC super panjang (LP model) di 360 =====
  p = await shot('r2-lpmodel-360', [360, 800], '#/run?mode=zeno&node=rso.lp-model', '.mc', { settle: 900 });
  if (p) {
    const m = await p.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('.mc-opt'));
      const hs = opts.map(o => Math.round(o.getBoundingClientRect().height));
      const lines = opts.map(o => Math.round(o.querySelector('.mc-lab').getClientRects().length));
      const card = document.querySelector('.qcard').getBoundingClientRect();
      return { tinggiOpsi: hs, jumlahBaris: lines, tinggiKartu: Math.round(card.height), vh: innerHeight };
    });
    add('R8-LONG-MC', 'med', 'opsi LP-model di 360px: tinggi ' + m.tinggiOpsi.join('/') + 'px (' + m.jumlahBaris.join('/') + ' baris teks per opsi), kartu total ' + m.tinggiKartu + 'px vs viewport ' + m.vh + ' → soal jadi "dinding teks", opsi kehilangan bentuk tombol');
    await p.close();
  }

  // ===== R9: summary (quick5 dijawab asal) =====
  p = await shot('r2-summary-390', [390, 844], '#/run?mode=quick', '#numGo, .mc-opt', {
    act: async page => {
      for (let i = 0; i < 8; i++) {
        if (await page.$('.summary')) break;
        const mc = await page.$('.mc-opt');
        if (mc) await mc.click();
        else { await page.keyboard.type('1'); await page.keyboard.press('Enter'); }
        const fb = await page.waitForSelector('#fbNext', { timeout: 5000 }).catch(() => null);
        if (fb) await fb.click();
        await page.waitForTimeout(200);
      }
      await page.waitForSelector('.summary', { timeout: 6000 });
    }
  });
  if (p) {
    const m = await p.evaluate(() => {
      const panels = Array.from(document.querySelectorAll('.summary .panel')).map(pn => Math.round(pn.getBoundingClientRect().height));
      const hero = document.querySelector('.sum-hero');
      return { panelHeights: panels, heroH: Math.round(hero.getBoundingClientRect().height) };
    });
    add('R9-SUMMARY', 'info', 'summary panel tinggi=' + m.panelHeights.join('/') + ' hero=' + m.heroH + ' — arsip visual');
    await p.close();
  }

  // ===== R10: gate + boss + nama panjang + kalibrasi done =====
  await shot('r2-home-gate-boss-390', [390, 844], '#/home', '#btnStart', { extra: 'gate' }).then(x => x && x.close());
  await shot('r2-home-longname-390', [390, 844], '#/home', '#btnStart', { extra: 'longname' }).then(async x => {
    if (x) {
      const m = await x.evaluate(() => {
        const h1 = document.querySelector('.greet h1');
        return { baris: h1.getClientRects().length, h1H: Math.round(h1.getBoundingClientRect().height) };
      });
      add('R10-LONGNAME', 'low', 'nama 26 karakter → judul salam jadi ' + m.baris + ' baris (' + m.h1H + 'px), hero mepet dengan panel bawah');
      await x.close();
    }
  });
  p = await shot('r2-calib-done-390', [390, 844], '', '#obCalib', { fresh: true, act: async page => {
    await page.click('#obCalib');
    for (let i = 0; i < 7; i++) {
      const done = await page.$('.ok-box');
      if (done) break;
      await page.waitForSelector('.calib-opt', { timeout: 5000 });
      await (await page.$('.calib-opt')).click();
      await page.waitForTimeout(500);
    }
    await page.waitForSelector('.ok-box', { timeout: 4000 });
  } });
  if (p) { await p.close(); }

  // ===== R11: tinggi baris domain statistik (misalign bar) =====
  p = await shot('r2-stats-rows-390', [390, 844], '#/stats', '.heatmap');
  if (p) {
    const m = await p.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.s-dom .dombar'));
      return rows.map(r => ({ dom: r.querySelector('.domname').textContent.trim().slice(0, 14), h: Math.round(r.getBoundingClientRect().height) }));
    });
    const hs = [...new Set(m.map(x => x.h))];
    add('R11-STATS-ROWS', 'low', 'baris domain tinggi bervariasi ' + hs.join('/') + 'px (domain panjang seperti "keandalan-kualitas" wrap 2 baris) → track bar tidak sejajar antar baris');
    await p.close();
  }

  await browser.close();
  fs.writeFileSync(path0.join(OUT, 'findings-r2.json'), JSON.stringify(F, null, 1));
  console.log('\n=== RONDE 2: ' + F.length + ' temuan (belum difilter FP) ===');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
