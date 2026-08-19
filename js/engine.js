/* Vista Forgy — engine.js (QuestionForge)
   Pipeline: seed → generator → constraint (retry) → verifikasi konstruksi → distraktor → konteks → pembahasan.
   Semua family murni & deterministik dari seed. Node = konfigurasi family. */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var ENGINE = (VF.ENGINE = VF.ENGINE || {});
  var families = {};
  var nodes = {}; // diisi dari content.js

  ENGINE.registerFamily = function (fam) {
    if (!fam || !fam.familyId || typeof fam.make !== 'function') {
      throw new Error('family tidak valid');
    }
    families[fam.familyId] = fam;
  };
  ENGINE.getFamily = function (id) { return families[id] || null; };
  ENGINE.registerNode = function (node) {
    nodes[node.id] = node;
  };
  ENGINE.getNode = function (id) { return nodes[id] || null; };
  ENGINE.allNodes = function () { return Object.keys(nodes).map(function (k) { return nodes[k]; }); };

  /* ---------- knob kesulitan dari rating ---------- */
  function knobsFor(rating) {
    var r = Math.max(900, Math.min(1800, rating || 1200));
    return {
      level: Math.max(0, Math.min(3, Math.floor((r - 900) / 250))),
      rating: r
    };
  }

  /* ---------- konteks cerita (rotasi, tidak pernah berurutan sama) ---------- */
  var lastContext = {};
  var CONTEXTS = [
    { key: 'batik', place: 'pabrik batik di Pekalongan', items: ['kain batik tulis', 'kain batik cap', 'kain primissima'], person: ['Bu Ratna', 'Pak Dhe Sutoyo', 'Mbak Ayu'], unit: 'lembar' },
    { key: 'kopi', place: 'rumah roasting kopi', items: ['biji arabika', 'biji robusta', 'kopi blend'], person: ['Bara', 'Dinda', 'Mas Yudi'], unit: 'kg' },
    { key: 'kantin', place: 'kantin kampus', items: ['nasi goreng', 'mie ayam', 'es teh'], person: ['Bu Sri', 'Pak Joko', 'Nadia'], unit: 'porsi' },
    { key: 'gudang', place: 'gudang logistik e-commerce', items: ['paket kecil', 'paket sedang', 'paket besar'], person: ['Rizky', 'Tania', 'Bang Ilham'], unit: 'paket' },
    { key: 'laundry', place: 'laundry kampus', items: ['cuci kering', 'cuci setrika', 'cuci ekspres'], person: ['Mila', 'Oky', 'Bu Wati'], unit: 'kg' },
    { key: 'bengkel', place: 'bengkel sepeda motor', items: ['servis ringan', 'servis besar', 'ganti oli'], person: ['Pak Hendra', 'Andre', 'Bang Iman'], unit: 'unit' },
    { key: 'furniture', place: 'workshop furniture di Jepara', items: ['kursi kayu', 'meja belajar', 'rak buku'], person: ['Pak Slamet', 'Gilang', 'Bu Nur'], unit: 'unit' },
    { key: 'travel', place: 'travel antar kota', items: ['kursi eksekutif', 'kursi biasa', 'paket kargo'], person: ['Khoirul', 'Sinta', 'Mas Bagus'], unit: 'kursi' },
    { key: 'cnc', place: 'bengkel CNC', items: ['baut presisi', 'plat besi', 'roda gigi'], person: ['Pak Anwar', 'Dewa', 'Mrs. Laila'], unit: 'pcs' },
    { key: 'catering', place: 'katering', items: ['paket nasi box', 'paket prasmanan', 'paket snack'], person: ['Chef Rio', 'Vina', 'Bu Tuti'], unit: 'box' }
  ];
  ENGINE.CONTEXTS = CONTEXTS;
  ENGINE.context = function (rng, skillId) {
    var pool = CONTEXTS.slice();
    if (lastContext[skillId]) {
      pool = pool.filter(function (c) { return c.key !== lastContext[skillId]; });
    }
    var c = rng.pick(pool);
    lastContext[skillId] = c.key;
    return c;
  };

  /* ---------- format angka Indonesia ---------- */
  function fmtID(n, maxDec) {
    if (n === undefined || n === null || isNaN(n)) return '–';
    var neg = n < 0; n = Math.abs(n);
    var dec = maxDec === undefined ? 2 : maxDec;
    var s = (Math.round(n * 100000) / 100000).toString();
    if (dec <= 0) s = Math.round(n).toString();
    else {
      var fixed = Number(n).toFixed(dec);
      if (Number(fixed) === Math.round(n)) s = Math.round(n).toString();
      else s = fixed.replace(/0+$/, '').replace(/\.$/, '');
    }
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '−' : '') + parts.join(',');
  }
  ENGINE.fmtID = fmtID;

  function parseNum(str) {
    if (str === null || str === undefined) return NaN;
    var s = String(str).trim().replace(/\s/g, '').replace(/−/g, '-');
    s = s.replace(/\./g, '').replace(/,/g, '.'); // 1.250,5 → 1250.5
    // tangani bentuk "1.250" vs "1.25": titik terakhir sebagai desimal jika pola ribuan valid
    var m = String(str).trim().match(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/);
    if (m) return parseFloat(String(str).trim().replace(/\./g, '').replace(',', '.'));
    if (/^-?\d+,\d+$/.test(s)) return parseFloat(s.replace(',', '.'));
    return parseFloat(s);
  }
  ENGINE.parseNum = parseNum;

  function numClose(a, b, tol) {
    if (isNaN(a) || isNaN(b)) return false;
    var t = tol !== undefined ? tol : Math.max(Math.abs(b) * 0.005, 1e-9);
    return Math.abs(a - b) <= t;
  }
  ENGINE.numClose = numClose;

  /* ---------- LaTeX mini-renderer (subset terkontrol; tanpa dependensi) ---------- */
  var SYM = {
    '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±', '\\le': '≤', '\\leq': '≤',
    '\\ge': '≥', '\\geq': '≥', '\\ne': '≠', '\\neq': '≠', '\\approx': '≈',
    '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\pi': 'π', '\\alpha': 'α', '\\beta': 'β',
    '\\theta': 'θ', '\\Delta': 'Δ', '\\infty': '∞', '\\int': '∫', '\\sum': 'Σ',
    '\\sigma': 'σ', '\\Sigma': 'Σ', '\\to': '→', '\\Rightarrow': '⇒', '\\%': '%',
    '\\left': '', '\\right': '', '\\quad': '\u2003', '\\qquad': '\u2003\u2003',
    '\\,': '\u2009', '\\;': '\u2005', '\\ ': ' ', '\\text': ''
  };
  function latexToHtml(src) {
    if (!src) return '';
    var s = String(src);
    var out = '';
    var i = 0;
    function readGroup() { // membaca {...} setelah posisi i (yang menunjuk '{')
      if (s[i] !== '{') { // single token
        var m = /^[\\A-Za-z0-9]/.exec(s.slice(i));
        if (!m) return '';
        var ch = s[i]; i++; return ch;
      }
      var depth = 0, start = ++i;
      while (i < s.length) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') {
          if (depth === 0) break; depth--;
        }
        i++;
      }
      var inner = s.slice(start, i);
      i++; // skip '}'
      return inner;
    }
    function renderInner(str) { var save = s, saveI = i; s = str; i = 0; var r = parse(); s = save; i = saveI; return r; }
    function parse() {
      var o = '';
      while (i < s.length) {
        var c = s[i];
        if (c === '\\') {
          var mcmd = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
          var cmd = mcmd ? mcmd[1] : '';
          var full = '\\' + cmd;
          if (cmd === 'frac' || cmd === 'dfrac') {
            i += full.length; var a = readGroup(); var b = readGroup();
            o += '<span class="lx-frac"><span class="lx-fr-top">' + renderInner(a) + '</span><span class="lx-fr-bot">' + renderInner(b) + '</span></span>';
          } else if (cmd === 'sqrt') {
            i += full.length; var r = readGroup();
            o += '<span class="lx-sqrt">√<span class="lx-sqrt-in">' + renderInner(r) + '</span></span>';
          } else if (cmd === 'text' || cmd === 'mathrm') {
            i += full.length; var t = readGroup();
            o += '<span class="lx-text">' + t + '</span>';
          } else if (cmd === 'mathbf') {
            i += full.length; o += '<b>' + renderInner(readGroup()) + '</b>';
          } else if (SYM[full] !== undefined) {
            i += full.length; o += SYM[full];
          } else {
            i += full.length; o += '<span class="lx-cmd">' + cmd + '</span>';
          }
        } else if (c === '^') {
          i++; var sup = readGroup();
          o += '<sup class="lx-sup">' + renderInner(sup) + '</sup>';
        } else if (c === '_') {
          i++; var sub = readGroup();
          o += '<sub class="lx-sub">' + renderInner(sub) + '</sub>';
        } else if (c === '{') {
          var g = readGroup(); o += renderInner(g);
        } else { o += escapeHtml(c === ' ' ? '\u2002' : c); i++; }
      }
      return o;
    }
    out = parse();
    return out;
  }
  function escapeHtml(x) {
    return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  VF.escapeHtml = escapeHtml;
  VF.latex = latexToHtml;

  /* ---------- pembuat soal utama ---------- */
  var sessionCounter = 0;
  ENGINE.nextSeed = function (skillId) {
    sessionCounter++;
    return skillId + ':' + (ENGINE.sessionSeed || 's0') + ':' + sessionCounter;
  };

  ENGINE.make = function (skillId, rating) {
    var node = nodes[skillId];
    if (!node) throw new Error('node tidak dikenal: ' + skillId);
    var fam = families[node.family];
    if (!fam) throw new Error('family tidak dikenal: ' + node.family);
    var knobs = knobsFor(rating !== undefined ? rating : 1200);
    for (var attempt = 0; attempt < 25; attempt++) {
      var rng = VF.makeRng(skillId + ':' + (ENGINE.sessionSeed || 's0') + ':' + (ENGINE.attemptCounter = (ENGINE.attemptCounter || 0) + 1));
      var q;
      try { q = fam.make(rng, node, knobs); } catch (e) { continue; }
      if (!q) continue;
      q.skillId = skillId;
      q.id = skillId + '#' + ENGINE.attemptCounter;
      q.seed = ENGINE.attemptCounter;
      q.targetMs = node.targetMs;
      q.difficultyRating = knobs.rating;
      if (!q.solution || !q.solution.steps || !q.solution.steps.length) continue;
      if (q.format === 'mc') {
        var okc = 0;
        var labels = {};
        var dupes = false;
        q.choices.forEach(function (c) {
          if (c.correct) okc++;
          var key = String(c.label || c.latex);
          if (labels[key]) dupes = true;
          labels[key] = 1;
        });
        if (okc !== 1 || dupes) continue;
      }
      if (q.format === 'steps') {
        if (!q.steps || q.steps.length < 2) continue;
        var stepsOk = q.steps.every(function (s) {
          return s && Number.isFinite(s.value) && Number.isFinite(s.tol) && s.tol >= 0 && s.label;
        });
        if (!stepsOk) continue;
      }
      return q;
    }
    // fallback deterministik (tidak boleh gagal total)
    throw new Error('generator gagal 25x untuk ' + skillId);
  };

  /* ---------- util umum untuk generator ---------- */
  ENGINE.util = {
    fmtID: fmtID,
    rupiah: function (n) { return 'Rp' + fmtID(n, 0); },
    gcd: function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; },
    simplify: function (n, d) { var g = ENGINE.util.gcd(n, d); return [n / g, d / g]; },
    shuffleAns: null,
    mkMc: function (answerLabel, wrongs, rng, fmt) {
      // answerLabel: label benar; wrongs: [{label, tag}]
      var f = fmt || function (x) { return String(x); };
      var seen = {};
      seen[answerLabel] = true;
      var choices = [{ label: answerLabel, correct: true }];
      var w = rng.shuffle(wrongs.slice());
      for (var i = 0; i < w.length && choices.length < 4; i++) {
        if (seen[w[i].label] !== undefined) continue;
        seen[w[i].label] = true;
        choices.push({ label: w[i].label, correct: false, tag: w[i].tag || '' });
      }
      var pad = 1;
      while (choices.length < 4) {
        var v = Number(answerLabel.replace(',', '.')) + pad * (Math.cos(pad) * 3 + 2);
        var lbl = fmtID(Math.round(v * 10) / 10);
        if (!seen[lbl]) { seen[lbl] = true; choices.push({ label: lbl, correct: false, tag: 'salah hitung' }); }
        pad++;
        if (pad > 50) break;
      }
      return choices;
    }
  };
})();
