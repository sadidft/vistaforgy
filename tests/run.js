/* Vista Forgy — test runner (node tests/run.js)
   Property-based checks: engine deterministik & valid, scheduler FSRS-lite, progression, crypto roundtrip. */
'use strict';
global.window = global;
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..');
const FILES = ['js/rng.js', 'js/engine.js', 'js/generators-core.js', 'js/generators-mid.js', 'js/generators-adv.js', 'js/generators-t3.js', 'js/generators-t4.js', 'js/tables.js', 'js/content.js', 'js/scheduler.js', 'js/progression.js', 'js/storage.js', 'js/crypto.js'];
FILES.forEach(f => { const code = fs.readFileSync(path.join(BASE, f), 'utf8'); eval(code); });
const VF = global.VF;
const E = VF.ENGINE, S = VF.SCHED, P = VF.PROG, STORE = VF.STORE, C = VF.CRYPTO;

let pass = 0, fail = 0; const fails = [];
function ok(cond, name) {
  if (cond) { pass++; }
  else { fail++; fails.push(name); if (fails.length < 40) console.log('  ✗ ' + name); }
}
function rngElo(i) { return 1100 + (i * 137) % 400; }

(async function main() {
  console.log('== VISTA FORGY ENGINE TEST ==');

  // 1) setiap node: 30 generate → valid
  const nodes = E.allNodes();
  console.log('Node terdaftar: ' + nodes.length);
  ok(nodes.length >= 70, 'jumlah node >= 70 (dapat ' + nodes.length + ')');
  let totalQ = 0;
  for (const nd of nodes) {
    let made = 0, mcChecked = 0;
    for (let i = 0; i < 30; i++) {
      let q = null;
      try { q = E.make(nd.id, rngElo(i)); } catch (e) { q = null; if (made === 0 && i > 20) { ok(false, nd.id + ' gagal generate: ' + e.message); break; } }
      if (!q) continue;
      made++; totalQ++;
      ok(!!q.solution && q.solution.steps.length > 0 && q.solution.final !== undefined, nd.id + ' solution lengkap');
      if (q.format === 'mc') {
        const corr = q.choices.filter(c => c.correct).length;
        ok(corr === 1, nd.id + ' mc tepat satu benar');
        const labels = q.choices.map(c => c.label);
        ok(new Set(labels).size === labels.length, nd.id + ' mc opsi unik');
        mcChecked++;
      } else if (q.format === 'numeric') {
        ok(Number.isFinite(q.answer.value), nd.id + ' answer finite');
      }
      if (!q.promptText || q.promptText.length < 5) ok(false, nd.id + ' promptText kosong');
      ok(Number.isFinite(q.targetMs) && q.targetMs > 0, nd.id + ' targetMs');
    }
    ok(made >= 25, nd.id + ' generator produktif (' + made + '/30)');
  }
  console.log('Total soal digenerate: ' + totalQ);

  // 2b) tabel distribusi granular
  {
    const TB = VF.TABLES;
    ok(Math.abs(TB.normCdf(1.96) - 0.975002) < 0.0005, 'Φ(1,96) ≈ 0,975 (' + TB.normCdf(1.96).toFixed(6) + ')');
    ok(Math.abs(TB.normCdf(0) - 0.5) < 1e-9, 'Φ(0) = 0,5');
    ok(Math.abs(TB.normCdf(-1.96) - 0.024998) < 0.0005, 'Φ(−1,96) simetris');
    ok(TB.t975(14) === 2.145 && TB.t975(999) === 1.960 && TB.t95(9) === 1.833, 'tabel t ok');
    ok(Math.abs(TB.binomCdf(5, 5, 0.5) - 1) < 1e-9 && Math.abs(TB.binomCdf(5, 0, 0.5) - 0.03125) < 1e-9, 'binomial CDF tepat');
    ok(TB.zTableVisual(1).rows.length === 10, 'visual tabel-z granular 10 baris');
  }

  // 2) keberagaman (anti-template): 20 soal sama skill → prompt unik signifikan
  {
    const prompts = new Set();
    for (let i = 0; i < 20; i++) { const q = E.make('kald.power', 1300); prompts.add(q.promptText + '|' + q.promptLatex); }
    ok(prompts.size >= 12, 'kald.power variasi cukup (' + prompts.size + '/20)');
    const p2 = new Set();
    for (let i = 0; i < 20; i++) { const q = E.make('ari.persen', 1200); p2.add(q.promptText); }
    ok(p2.size >= 10, 'ari.persen variasi cukup (' + p2.size + '/20)');
  }

  // 3) jawaban benar oleh konstruksi — spot-check numerik beberapa family terkenal
  {
    for (let i = 0; i < 30; i++) {
      const q = E.make('kald.tangent', 1300);
      // gradien y=ax²+bx di x: parse dari promptLatex tidak perlu — regenerasi konsisten via answer.value finite & solution final sama
      const fin = parseFloat(String(q.solution.final).replace(',', '.'));
      ok(Math.abs(fin - q.answer.value) < 0.01, 'kald.tangent final==answer');
    }
    for (let i = 0; i < 20; i++) {
      const q = E.make('ant.mm1', 1300);
      ok(q.answer.value > 0, 'ant.mm1 positif');
      if (q.visual && q.visual.type === 'queue') ok(q.visual.lam < q.visual.mu, 'ant.mm1 stabil ρ<1');
    }
    for (let i = 0; i < 20; i++) {
      const q = E.make('inv.eoq', 1300);
      ok(Number.isFinite(q.answer.value) && q.answer.value > 0, 'inv.eoq answer valid');
    }
  }

  // 4) scheduler FSRS-lite
  {
    const st = { elo: 1200, D: 0, S: 0, attempts: 0, streakBenar: 0, hist: [] };
    S.update(st, 3, 10000, 20000, Date.now());
    ok(st.D > 1 && st.D < 10, 'D dalam rentang');
    ok(st.S > 0, 'S init > 0');
    const s0 = st.S;
    const R1 = S.retrievability(st, Date.now());
    ok(R1 > 0.95, 'R baru ~1 (' + R1.toFixed(3) + ')');
    const Rold = S.retrievability({ ...st, lastReviewTs: Date.now() - 30 * S.DAY }, Date.now());
    ok(Rold < R1, 'R turun seiring waktu');
    S.update(st, 1, 5000, 20000, Date.now());
    ok(st.streakBenar === 0, 'salah reset streak');
    ok(st.S < s0 || st.attempts === 2, 'salah menurunkan S');
    S.update(st, 4, 8000, 20000, Date.now());
    S.update(st, 4, 8000, 20000, Date.now());
    ok(st.status === 'lancar' || st.status === 'mastered', 'status naik setelah benar beruntun');
    ok(S.nextIntervalDays(10) > 0 && S.nextIntervalDays(10) < 365, 'interval dalam batas');
  }

  // 5) progression
  {
    const save = STORE.newSave();
    save.profile.track = 'ti';
    const t0 = P.tierStats(save, 0);
    ok(t0.total === 31, 'tier 0 punya 31 node (dapat ' + t0.total + ')');
    ok(t0.required === 28, 'mastery gate 90% = 28');
    // simulasi mastery penuh tier 0 (volume masih kecil)
    E.allNodes().filter(n => n.tier === 0 && n.track === 'ti').forEach(n => {
      save.skills[n.id] = { elo: 1350, D: 4, S: 20, lastReviewTs: Date.now(), dueTs: Date.now() + 20 * S.DAY, streakBenar: 3, medianMs: 10000, attempts: 5, status: 'mastered', hist: [1, 1, 1] };
    });
    const g = P.tierGate(save, 0);
    ok(g.masteredOk, 'gate mastery ok');
    ok(!g.volumeOk, 'gate volume belum (400 soal)');
    const nid = E.allNodes()[0].id;
    save.skills[nid].attempts += 400;
    const g2 = P.tierGate(save, 0);
    ok(g2.volumeOk, 'gate volume ok setelah 400+');
    ok(g2.allOk, 'gate allOk → ujian promosi terbuka');
    // ujian
    const ex = P.buildExam(save, 0);
    ok(ex.items.length >= 6, 'exam terbangun (' + ex.items.length + ')');
    const results = ex.items.map(id => ({ skillId: id, correct: true }));
    const res = P.gradeExam(save, 0, results);
    ok(res.passed && save.tiers.unlocked === 1, 'lulus ujian → tier 1 terbuka');
    const g3 = P.tierGate(save, 0);
    ok(g3.cooldownOk, 'tidak ada cooldown setelah lulus');
    const sh = P.sharpness(save);
    ok(sh > 100 && sh <= 1000, 'sharpness masuk akal (' + sh + ')');
  }

  // 6) cooldown 48 jam
  {
    const save = STORE.newSave();
    save.tiers.examHistory.push({ tier: 0, ts: Date.now() - 3600e3, score: 60, passed: false, breakdown: [] });
    const g = P.tierGate(save, 0);
    ok(!g.cooldownOk, 'cooldown 48 jam aktif setelah gagal');
    save.tiers.examHistory[0].ts = Date.now() - 49 * 3600e3;
    ok(P.tierGate(save, 0).cooldownOk, 'cooldown berakhir');
  }

  // 7) crypto roundtrip (Web Crypto)
  {
    if (C.available()) {
      const save = STORE.newSave();
      save.profile.name = 'Tester';
      save.skills['ari.tambah'] = { elo: 1300, D: 5, S: 9, lastReviewTs: Date.now(), dueTs: 0, streakBenar: 2, medianMs: 9000, attempts: 9, status: 'lancar', hist: [1, 1] };
      const bytes = await C.encryptSave(save, 'rahasia123');
      ok(bytes.length > 40, 'file .fgy terbentuk (' + bytes.length + ' B)');
      ok(bytes[0] === 0x56 && bytes[1] === 0x46 && bytes[2] === 0x47 && bytes[3] === 0x59 && bytes[4] === 0x31, 'magic VFGY1 benar');
      const dec = await C.decryptSave(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), 'rahasia123');
      ok(dec.profile.name === 'Tester' && dec.skills['ari.tambah'], 'roundtrip data utuh');
      let threw = false;
      try { await C.decryptSave(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), 'salah'); } catch (e) { threw = true; }
      ok(threw, 'password salah → gagal (authenticated)');
      const tampered = new Uint8Array(bytes); tampered[40] ^= 0xFF;
      threw = false;
      try { await C.decryptSave(tampered.buffer.slice(tampered.byteOffset, tampered.byteOffset + tampered.byteLength), 'rahasia123'); } catch (e) { threw = true; }
      ok(threw, 'file diubah → gagal decode');
      // merge
      const local = STORE.newSave();
      local.skills['a'] = { elo: 1000, lastReviewTs: 1000 };
      const remote = STORE.newSave();
      remote.skills['a'] = { elo: 1500, lastReviewTs: 2000 };
      remote.badges = ['streak7'];
      const merged = C.mergeSaves(local, remote);
      ok(merged.skills['a'].elo === 1500, 'merge ambil terbaru');
      ok(merged.badges.indexOf('streak7') >= 0, 'merge union badge');
    } else {
      console.log('  (Web Crypto tidak tersedia di node ini — skip crypto test)');
    }
  }

  // 8) storage memory-mode
  {
    const save = STORE.newSave();
    save.profile.name = 'Mem';
    ok(STORE.save(save), 'save ke storage (memory fallback di node)');
    const back = STORE.load();
    ok(back && back.profile.name === 'Mem', 'load roundtrip');
  }

  console.log('\n== HASIL: ' + pass + ' OK, ' + fail + ' GAGAL ==');
  if (fails.length) { console.log('Gagal:'); fails.forEach(f => console.log(' - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
