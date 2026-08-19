/* Vista Forgy — tests/audit.js (BUG RECON statis)
   Scan semua node × N seed: deteksi kelas kesalahan konten SEBELUM pemakai menemukannya.
   Kelas deteksi:
   A1. Prompt merujuk visual ("lihat tabel/grafik/gambar/jaringan", "di bawah") tetapi
       TIDAK punya q.visual DAN tidak punya promptLatex → soal tidak bisa dijawab.
   A2. q.visual ada tetapi type-nya tak dikenal renderer → visual takkan muncul.
   A3. String kotor: 'undefined' / 'NaN' / '[object' di prompt/pilihan/pembahasan/jawaban.
   A4. MC: label kosong / duplikat / jawaban benar bukan satu.
   A5. Numeric/steps: jawaban tak hingga atau toleransi <= 0.
   A6. Pembahasan tanpa langkah / final kosong / takeaway hilang.
   A7. Angka jawaban & final pembahasan tidak konsisten (numeric). */
'use strict';
global.window = global;
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..');
['js/rng.js', 'js/engine.js', 'js/generators-core.js', 'js/generators-mid.js', 'js/generators-adv.js', 'js/generators-t3.js', 'js/generators-t4.js', 'js/tables.js', 'js/content.js'].forEach(f => eval(fs.readFileSync(path.join(BASE, f), 'utf8')));
const E = global.VF.ENGINE;

const N = 60;
const findings = [];
const seen = {}; // dedup (nodeId + kode temuan)
function flag(nodeId, code, detail) {
  const key = nodeId + '|' + code;
  if (seen[key]) { seen[key].n++; return; }
  seen[key] = { nodeId, code, detail, n: 1 };
  findings.push(seen[key]);
}
const RE_VISUAL = /(lihat\s+(tabel|grafik|gambar|jaringan|boxplot|control\s*chart|kurva)|tabel\s+di\s+bawah|di\s+tabel|pada\s+tabel|grafik\.|perhatikan\s+grafik)/i;
const RE_DI_BAWAH = /di\s+bawah/i;
const KNOWN_VISUALS = ['table', 'bars', 'bars2', 'line', 'parabola', 'box', 'queue', 'eoq', 'lp', 'pert', 'graph', 'spc'];

let checked = 0;
for (const nd of E.allNodes()) {
  for (let i = 0; i < N; i++) {
    let q = null;
    try { q = E.make(nd.id, 1000 + (i * 7) % 600); } catch (e) { flag(nd.id, 'GEN-THROW', e.message); continue; }
    if (!q) continue;
    checked++;
    const textAll = [q.promptText, q.promptLatex, JSON.stringify(q.choices || []), JSON.stringify(q.solution || {})].join(' ');
    // A1
    if (RE_VISUAL.test(q.promptText) && !q.visual && !q.promptLatex) flag(nd.id, 'A1-VISUAL-HILANG', q.promptText.slice(0, 90));
    if (RE_DI_BAWAH.test(q.promptText) && /tabel|kurva|grafik/i.test(q.promptText) && !q.visual && !q.promptLatex) flag(nd.id, 'A1b-DIBAWAH', q.promptText.slice(0, 90));
    // A2
    if (q.visual && KNOWN_VISUALS.indexOf(q.visual.type) < 0) flag(nd.id, 'A2-VISUAL-TAK-DIKENAL', String(q.visual.type));
    // A3
    if (/undefined|\[object|NaN/.test(textAll)) flag(nd.id, 'A3-STRING-KOTOR', (textAll.match(/.{0,40}(undefined|\[object|NaN).{0,20}/) || [''])[0]);
    // A4
    if (q.format === 'mc') {
      const labels = q.choices.map(c => String(c.label || c.latex || ''));
      if (labels.some(l => !l.trim())) flag(nd.id, 'A4-LABEL-KOSONG', '');
      if (new Set(labels).size !== labels.length) flag(nd.id, 'A4-DUPLIKAT', labels.join('|').slice(0, 80));
      if (q.choices.filter(c => c.correct).length !== 1) flag(nd.id, 'A4-BENAR-BUKAN-SATU', '');
    }
    // A5
    if (q.format === 'numeric' || q.format === 'steps') {
      const vals = q.format === 'steps' ? q.steps.map(s => s.value) : [q.answer.value];
      if (vals.some(v => !Number.isFinite(v))) flag(nd.id, 'A5-NON-FINITE', '');
      if (q.format === 'numeric' && !(q.answer.tol > 0)) flag(nd.id, 'A5-TOL', String(q.answer.tol));
    }
    // A6
    if (!q.solution.steps || !q.solution.steps.length) flag(nd.id, 'A6-TANPA-LANGKAH', '');
    if (String(q.solution.final || '').trim() === '') flag(nd.id, 'A6-FINAL-KOSONG', '');
    if (!q.solution.takeaway) flag(nd.id, 'A6-TAKEAWAY', '');
    // A7 (numeric): final pembahasan harus memuat angka yang cocok dgn jawaban (toleransi)
    if (q.format === 'numeric' && Number.isFinite(q.answer.value)) {
      const fin = String(q.solution.final);
      const nums = (fin.match(/[\u2212-]?\d[\d.,]*/g) || []).map(tok => {
        tok = tok.replace(/\u2212/g, '-');
        if (tok.indexOf('.') >= 0 && tok.indexOf(',') >= 0) tok = tok.replace(/\./g, '').replace(',', '.'); // 1.250,5
        else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(tok)) tok = tok.replace(/\./g, '');      // 11.576.250
        else tok = tok.replace(',', '.');                                                   // 3,14
        return parseFloat(tok);
      }).filter(n2 => Number.isFinite(n2));
      const v = q.answer.value;
      const tol = Math.max(q.answer.tol || 0.01, Math.abs(v) * 0.006);
      if (nums.length && !nums.some(n2 => Math.abs(n2 - v) <= tol)) flag(nd.id, 'A7-FINAL≠ANSWER', fin.slice(0, 40) + ' vs ' + v);
    }
  }
}
console.log('== AUDIT STATIS: ' + E.allNodes().length + ' node × ' + N + ' seed = ' + checked + ' soal dicek ==');
if (!findings.length) console.log('BERSIH — nol temuan.');
else findings.forEach(f => console.log('  [' + f.code + '] ' + f.nodeId + ' ×' + f.n + ' :: ' + f.detail));
process.exit(findings.length ? 1 : 0);
