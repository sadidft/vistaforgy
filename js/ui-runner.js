/* Vista Forgy — ui-runner.js (mesin sesi: warm-up → review → fokus → ringkasan; zeno; quick; ujian promosi; boss) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var UI = VF.UI, E = VF.ENGINE, S = VF.SCHED, P = VF.PROG, STORE = VF.STORE;
  var $ = UI.$, esc = UI.esc, ic = UI.icon;

  var R = {};
  VF.RUNNER = R;
  R.sess = null;
  var raf = null, keyHandler = null;

  function skillState(save, id) {
    if (!save.skills[id]) save.skills[id] = { elo: 1200, D: 0, S: 0, lastReviewTs: 0, dueTs: 0, streakBenar: 0, medianMs: 0, attempts: 0, status: 'baru', hist: [] };
    return save.skills[id];
  }

  VF.focusSuggestion = function (save) {
    var nodes = E.allNodes().filter(function (n) { return n.track === 'ti'; });
    var sorted = nodes.slice().sort(function (a, b) { return a.tier - b.tier || a.id.localeCompare(b.id); });
    for (var i = 0; i < sorted.length; i++) {
      var n = sorted[i];
      if (!P.isUnlocked(save, n)) continue;
      var st = save.skills[n.id];
      if (!st || (st.status !== 'mastered' && st.status !== 'memudar' && st.attempts < 60)) return n;
    }
    // semua mastered → ambil terlemah
    var weak = null, min = 9999;
    sorted.forEach(function (n) {
      var st = save.skills[n.id];
      if (st && st.attempts && st.elo < min) { min = st.elo; weak = n; }
    });
    return weak;
  };

  /* ---------- bangun sesi ---------- */
  function buildSession(mode, opts) {
    var save = VF.save;
    var sess = { mode: mode, phase: 'warmup', items: [], idx: 0, correct: 0, answered: 0, combo: 0, comboBest: 0, t0: Date.now(), results: [], requeued: {}, date: VF.todayStr() };
    var unlockedTried = E.allNodes().filter(function (n) { return P.isUnlocked(save, n); });
    if (mode === 'daily') {
      var warm = unlockedTried.filter(function (n) { return n.family === 'rush' || n.id === 'ari.tambah' || n.id === 'ari.kali' || n.id === 'ari.campur'; });
      if (!warm.length) warm = unlockedTried.filter(function (n) { return n.tier === 0; }).slice(0, 3);
      var wi = 0;
      while (sess.items.length < 8 && warm.length) { sess.items.push({ kind: 'warmup', skillId: warm[wi % warm.length].id }); wi++; }
      sess.phase = sess.items.length ? 'warmup' : 'review';
      var due = S.dailyQueue(save, E.allNodes());
      due.forEach(function (n) { sess.items.push({ kind: 'review', skillId: n.id }); });
      sess.focusNode = (opts && opts.node) || VF.focusSuggestion(save);
      if (sess.focusNode) for (var f = 0; f < 8; f++) sess.items.push({ kind: 'focus', skillId: sess.focusNode.id });
    } else if (mode === 'quick') {
      sess.phase = 'review';
      var dq = S.dailyQueue(save, E.allNodes()).slice(0, 5);
      if (!dq.length) { var sug = VF.focusSuggestion(save); if (sug) dq = [sug]; }
      dq.forEach(function (n) { sess.items.push({ kind: 'review', skillId: n.id }); });
    } else if (mode === 'zeno') {
      sess.phase = 'focus';
      var nid = opts && opts.node;
      if (!nid || !E.getNode(nid)) { UI.toast('Node tidak dikenal', 'warn'); return null; }
      if (!P.isUnlocked(save, E.getNode(nid))) { UI.toast('Skill masih terkunci — selesaikan prasyaratnya dulu di Peta.', 'warn'); return null; }
      sess.focusNode = E.getNode(nid);
      for (var z = 0; z < 8; z++) sess.items.push({ kind: 'focus', skillId: nid });
    } else if (mode === 'exam') {
      sess.phase = 'exam';
      sess.tier = (opts && opts.tier !== undefined) ? parseInt(opts.tier, 10) : save.tiers.unlocked;
      var ex = P.buildExam(save, sess.tier);
      ex.items.forEach(function (id) { sess.items.push({ kind: 'exam', skillId: id }); });
    } else if (mode === 'sim') {
      sess.phase = 'exam';
      sess.tier = -1;
      var tried = E.allNodes().filter(function (n) { var st = save.skills[n.id]; return st && st.attempts > 0 && n.track === 'ti'; });
      var sortedS = tried.slice().sort(function (a, b) {
        var ea = (save.skills[a.id] || {}).elo || 1200, eb = (save.skills[b.id] || {}).elo || 1200;
        return ea - eb;
      });
      if (!sortedS.length) { UI.toast('Belum ada skill yang dicoba.', 'warn'); return null; }
      var nItems = Math.min(20, sortedS.length);
      for (var s2 = 0; s2 < nItems; s2++) sess.items.push({ kind: 'exam', skillId: sortedS[s2 % sortedS.length].id });
    } else if (mode === 'boss') {
      sess.phase = 'exam';
      var bo = P.buildBoss(save);
      if (!bo.items.length) { UI.toast('Belum ada skill untuk boss.', 'warn'); return null; }
      bo.items.forEach(function (id) { sess.items.push({ kind: 'boss', skillId: id }); });
    }
    if (!sess.items.length) {
      UI.toast('Antrian kosong — mulai skill baru di Peta.', 'warn');
      return null;
    }
    return sess;
  }

  R.start = function (params) {
    R.teardown();
    var sess = buildSession(params.mode, params);
    if (!sess) { UI.nav('home'); return; }
    R.sess = sess;
    renderCurrent();
  };

  R.teardown = function () {
    if (raf) { cancelAnimationFrame(raf); clearInterval(raf); raf = null; }
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    R.sess = null;
  };

  /* ---------- render soal ---------- */
  var cur = { q: null, t0: 0, limit: 0, answered: false };

  function renderCurrent() {
    var sess = R.sess, save = VF.save;
    if (sess.idx >= sess.items.length) { finishPhase(); return; }
    var item = sess.items[sess.idx];
    var st = skillState(save, item.skillId);
    var q;
    try { q = E.make(item.skillId, st.elo); }
    catch (e) {
      sess.idx++; renderCurrent(); return;
    }
    cur = { q: q, t0: performance.now(), limit: q.rush ? 15000 : q.targetMs * (q.format === 'steps' ? 2.5 : 2), answered: false };
    E.sessionSeed = E.sessionSeed;

    var phaseLabel = { warmup: 'Warm-up', review: 'Review', focus: 'Fokus', exam: sess.mode === 'boss' ? 'Boss Mingguan' : sess.mode === 'sim' ? 'Exam Sim' : 'Ujian Promosi Tier ' + sess.tier }[item.kind === 'exam' ? 'exam' : item.kind] || 'Latihan';
    var node = E.getNode(item.skillId);
    var html = '<section class="screen runner">' +
      '<div class="run-head"><span class="phase-chip">' + phaseLabel + '</span>' +
      '<div class="run-prog"><div class="run-prog-fill" style="width:' + Math.round(sess.idx / sess.items.length * 100) + '%"></div></div>' +
      '<span class="run-count">' + (sess.idx + 1) + '/' + sess.items.length + '</span>' +
      '<span class="run-timer" id="runTimer">' + UI.ring(1, 40, 4, 'amber') + '<b id="timerTxt">–</b></span></div>' +
      (sess.combo >= 3 ? '<div class="combo">' + ic('flame') + ' combo ×' + sess.combo + '</div>' : '') +
      '<div class="qcard" id="qcard">' +
      '<div class="q-meta">' + esc(node.domain) + ' · ' + esc(node.name) + (item.kind === 'warmup' ? ' · tanpa bobot SRS' : '') + '</div>' +
      UI.renderVisual(q.visual) +
      '<div class="q-prompt">' + esc(q.promptText) + '</div>' +
      (q.promptLatex ? '<div class="q-latex">' + UI.latex(q.promptLatex) + '</div>' : '') +
      '<div class="q-body" id="qbody"></div></div>' +
      '<div class="run-actions"><button class="btn ghost small" id="btnSkip">' + 'lewati' + '</button>' +
      '<button class="btn ghost small" id="btnConcept">' + ic('book') + ' Konsep</button></div>' +
      '<div id="feedback"></div></section>';
    UI.$('#app').innerHTML = html;
    UI.activateQueue(UI.$('#app'));
    UI.activateLp(UI.$('#app'));

    if (q.format === 'mc') renderMc(q);
    else if (q.format === 'steps') renderSteps(q);
    else renderNumeric(q);

    UI.$('#btnConcept').onclick = function () { VF.conceptModal(item.skillId); };
    UI.$('#btnSkip').onclick = function () {
      if (cur.answered) return;
      grade(null, true);
    };

    startTimer();
    persistSession();
  }

  function renderSteps(q) {
    var wrap = UI.$('#qbody');
    var html = '<div class="steps">' +
      q.steps.map(function (s, i) {
        return '<div class="step-row" id="stepRow' + i + '">' +
          '<span class="sol-n">' + (i + 1) + '</span>' +
          '<span class="step-lab">' + esc(s.label) + '</span>' +
          '<input class="step-in" id="stepIn' + i + '" type="text" inputmode="decimal" autocomplete="off" placeholder="?" aria-label="' + esc(s.label) + '">' +
          '<span class="step-mark" id="stepMark' + i + '"></span></div>';
      }).join('') +
      '<button class="btn primary" id="stepsGo">' + ic('check') + ' Periksa Semua Langkah</button>' +
      '<p class="muted small">Isi tiap langkah (koma atau titik desimal). Langkah salah akan ditunjukkan nilai benarnya — kamu tetap bisa lanjut.</p></div>';
    wrap.innerHTML = html;
    var first = UI.$('#stepIn0');
    if (first) {
      first.focus();
      try { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    }
    UI.$('#stepsGo').onclick = submitSteps;
    var inputs = UI.$$('.step-in', wrap);
    inputs.forEach(function (inp) {
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); submitSteps(); }
      });
    });
    function submitSteps() {
      if (cur.answered) return;
      var vals = [];
      for (var i = 0; i < q.steps.length; i++) {
        var raw = UI.$('#stepIn' + i) ? UI.$('#stepIn' + i).value.trim() : '';
        vals.push(raw === '' ? null : E.parseNum(raw));
      }
      if (vals.every(function (v) { return v === null; })) { UI.toast('Isi dulu minimal satu langkah.', 'warn'); return; }
      grade({ stepsVals: vals });
    }
  }

  function renderMc(q) {
    var wrap = UI.$('#qbody');
    var idxs = q.choices.map(function (c, i) { return i; });
    // shuffle tampilan (Math.random boleh — UI saja)
    for (var i = idxs.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idxs[i]; idxs[i] = idxs[j]; idxs[j] = t; }
    wrap.innerHTML = '<p class="muted small mc-hint">Tips: tekan 1–' + idxs.length + ' di keyboard.</p><div class="mc">' + idxs.map(function (ci, pos) {
      var c = q.choices[ci];
      return '<button class="mc-opt" data-ci="' + ci + '"><span class="mc-key">' + (pos + 1) + '</span>' +
        (c.latex ? '<span class="mc-lab">' + UI.latex(c.latex) + '</span>' : '<span class="mc-lab">' + esc(c.label) + '</span>') + '</button>';
    }).join('') + '</div>';
    UI.$$('.mc-opt', wrap).forEach(function (b) {
      b.onclick = function () {
        if (cur.answered) return;
        var ci = parseInt(b.getAttribute('data-ci'), 10);
        grade(q.choices[ci]);
      };
    });
    keyHandler = function (ev) {
      if (cur.answered) return;
      var n = parseInt(ev.key, 10);
      if (n >= 1 && n <= idxs.length) {
        var btn = UI.$$('.mc-opt', wrap)[n - 1];
        if (btn) btn.click();
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  var numBuf = '';
  function renderNumeric(q) {
    var wrap = UI.$('#qbody');
    numBuf = '';
    wrap.innerHTML = '<div class="numin"><div class="num-display" id="numDisp"><span class="caret">​</span></div>' +
      '<button class="btn primary" id="numGo">' + ic('check') + ' Jawab (Enter)</button></div>' +
      '<div class="keypad">' +
      ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '−'].map(function (k) { return '<button class="key" data-k="' + k + '">' + k + '</button>'; }).join('') +
      '<button class="key wide" data-k="del">⌫</button><button class="key wide go" data-k="go">↵</button></div>';
    var disp = UI.$('#numDisp');
    function refresh() { disp.innerHTML = (esc(numBuf) || '<span class="caret">​</span>'); }
    function press(k) {
      VF.AUDIO.click(VF.save);
      if (k === 'del') numBuf = numBuf.slice(0, -1);
      else if (k === 'go') { submitNum(); return; }
      else if (numBuf.length < 12) {
        if (k === ',' && numBuf.indexOf(',') >= 0) return;
        if (k === '−' && numBuf.length > 0) return;
        numBuf += k;
      }
      refresh();
    }
    UI.$$('.key', wrap).forEach(function (b) { b.onclick = function () { press(b.getAttribute('data-k')); }; });
    UI.$('#numGo').onclick = submitNum;
    function submitNum() {
      if (cur.answered) return;
      if (!numBuf || numBuf === '−' || numBuf === ',') return;
      grade({ num: numBuf });
    }
    keyHandler = function (ev) {
      if (cur.answered) return;
      if (ev.key === 'Enter') { submitNum(); return; }
      if (ev.key === 'Backspace') { press('del'); return; }
      if (/^[0-9]$/.test(ev.key)) { press(ev.key); return; }
      if (ev.key === '.' || ev.key === ',') { press(','); return; }
      if (ev.key === '-') { press('−'); return; }
    };
    document.addEventListener('keydown', keyHandler);
    refresh();
  }

  function startTimer() {
    if (raf) cancelAnimationFrame(raf);
    var ringEl = UI.$('#runTimer .ring circle:last-child');
    var txt = UI.$('#timerTxt');
    var CIRC = 2 * Math.PI * 16; // r=16 utk ring size 40 stroke 4 (persis UI.ring)
    function frame() {
      if (!R.sess || cur.answered) return;
      var left = cur.limit - (performance.now() - cur.t0);
      var pct = Math.max(0, left / cur.limit);
      if (ringEl) ringEl.style.strokeDashoffset = String(CIRC * (1 - pct));
      if (txt) {
        var sec = Math.max(0, Math.ceil(left / 1000));
        txt.textContent = sec + 's';
        txt.classList.toggle('urgent', left < 5000);
      }
      if (left <= 0) { grade(null, false); return; }
      raf = requestAnimationFrame(frame);
    }
    if (VF.reduceMotion()) {
      // versi hemat: update tiap 500ms
      var iv = setInterval(function () {
        if (!R.sess || cur.answered) { clearInterval(iv); return; }
        var left = cur.limit - (performance.now() - cur.t0);
        var ringEl2 = UI.$('#runTimer .ring circle:last-child');
        if (ringEl2) ringEl2.style.strokeDashoffset = String(2 * Math.PI * 16 * (1 - Math.max(0, left / cur.limit)));
        if (UI.$('#timerTxt')) {
          UI.$('#timerTxt').textContent = Math.max(0, Math.ceil(left / 1000)) + 's';
          UI.$('#timerTxt').classList.toggle('urgent', left < 5000);
        }
        if (left <= 0) { clearInterval(iv); grade(null, false); }
      }, 400);
      raf = iv;
    } else raf = requestAnimationFrame(frame);
  }

  /* ---------- penilaian ---------- */
  function grade(choice, skipped) {
    if (cur.answered) return;
    cur.answered = true;
    if (raf) { cancelAnimationFrame(raf); clearInterval(raf); raf = null; }
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    var sess = R.sess, save = VF.save;
    var q = cur.q;
    var item = sess.items[sess.idx];
    var ms = performance.now() - cur.t0;
    var correct = false, pickedTag = null;
    var stepsResult = null;
    if (choice && choice.stepsVals) {
      var okN = 0;
      stepsResult = q.steps.map(function (s, i) {
        var v = choice.stepsVals[i];
        var ok = v !== null && Number.isFinite(v) && Math.abs(v - s.value) <= Math.max(s.tol, Math.abs(s.value) * 0.005);
        if (ok) okN++;
        return { ok: ok, given: v };
      });
      correct = okN === q.steps.length;
      pickedTag = correct ? null : okN + '/' + q.steps.length + ' langkah benar — lihat nilai yang benar di tiap langkah';
    }
    if (choice && choice.correct) correct = true;
    if (choice && !correct && !stepsResult) pickedTag = choice.tag;
    if (choice && choice.num !== undefined) {
      var val = E.parseNum(choice.num);
      correct = E.numClose(val, q.answer.value, Math.max(q.answer.tol || 0.01, Math.abs(q.answer.value) * 0.005));
      if (!correct && Math.abs(val - q.answer.value) < Math.max(0.02, q.answer.tol)) correct = true;
      pickedTag = correct ? null : 'periksa langkah perhitunganmu di pembahasan';
    }
    var timeout = !choice && !skipped;
    // update state
    var st = skillState(save, item.skillId);
    var fast = ms < q.targetMs * 0.6;
    P.updateElo(st, q, correct, correct && fast);
    if (item.kind !== 'warmup') {
      var rating = S.rate(correct, ms, q.targetMs, st.streakBenar);
      S.update(st, rating, ms, q.targetMs, Date.now());
    } else {
      st.attempts++;
      st.hist = st.hist || [];
      st.hist.push(correct ? 1 : 0);
      if (st.hist.length > 10) st.hist.shift();
    }
    save.stats.totalQuestions++;
    sess.answered++;
    if (correct) { sess.correct++; sess.combo++; sess.comboBest = Math.max(sess.comboBest, sess.combo); }
    else sess.combo = 0;
    sess.results.push({ skillId: item.skillId, correct: correct, ms: Math.round(ms) });
    // feedback audio & partikel
    if (correct) {
      VF.AUDIO.correct(save, sess.combo);
      var card = UI.$('#qcard');
      if (card && !VF.reduceMotion()) {
        var r = card.getBoundingClientRect();
        UI.burst(r.left + r.width / 2, r.top + 60);
      }
    } else VF.AUDIO.wrong(save);
    // KOA trigger
    var trig = correct ? (fast ? 'benar-cepat' : ms > q.targetMs * 1.5 ? 'benar-lambat' : 'benar')
      : (sess.combo === 0 && sess.answered > 1 && sess.results[sess.results.length - 2] && !sess.results[sess.results.length - 2].correct ? 'salah2' : 'salah');
    var koaLine = VF.KOA.line(save, trig);
    if (stepsResult) {
      stepsResult.forEach(function (r, i) {
        var mark = UI.$('#stepMark' + i);
        var row = UI.$('#stepRow' + i);
        var inp = UI.$('#stepIn' + i);
        if (inp) inp.disabled = true;
        if (row) row.classList.add(r.ok ? 'ok' : 'no');
        if (mark) mark.innerHTML = r.ok ? ic('check', 16) : ic('x', 16) + ' <b>' + String(Math.round(q.steps[i].value * 100) / 100).replace('.', ',') + '</b>';
      });
      var go = UI.$('#stepsGo');
      if (go) go.disabled = true;
    }
    showFeedback(correct, timeout, skipped, pickedTag, koaLine);
    VF.persist();
    persistSession();
  }

  function showFeedback(correct, timeout, skipped, tag, koaLine) {
    var q = cur.q;
    var verdict = correct ? 'BENAR' : timeout ? 'WAKTU HABIS' : skipped ? 'DILEWATI' : 'BELUM TEPAT';
    var cls = correct ? 'ok' : 'no';
    var html = '<div class="fb ' + cls + '">' +
      '<div class="fb-head"><span class="verdict ' + cls + '">' + verdict + '</span>' +
      (correct ? '' : '<span class="fb-ans">Jawaban: <b>' + (q.format === 'mc' ? esc(answerLabel(q)) : esc(fmtAns(q))) + '</b></span>') + '</div>' +
      (koaLine ? '<div class="koa-line">' + VF.KOA.svg(correct ? 'happy' : 'oops', 34) + '<span>' + esc(koaLine) + '</span></div>' : '') +
      (tag && !correct ? '<div class="miss-note">' + ic('info') + ' ' + esc(tag) + '</div>' : '') +
      '<div class="solution"><div class="sol-title">' + ic('book') + ' ' + esc(q.solution.title) + '</div>' +
      q.solution.steps.map(function (s, i) {
        return '<div class="sol-step"><span class="sol-n">' + (i + 1) + '</span><div><div>' + esc(s.text) + '</div>' + (s.latex ? '<div class="sol-latex">' + UI.latex(s.latex) + '</div>' : '') + '</div></div>';
      }).join('') +
      '<div class="sol-final">' + UI.latex(String(q.solution.final).indexOf('\\') >= 0 || /[²³¹⁰]/.test(q.solution.final) ? q.solution.final : escForLatex(q.solution.final)) + '</div>' +
      '<div class="takeaway">' + esc(q.solution.takeaway) + '</div>' +
      (q.solution.misconceptionNote && !correct ? '<div class="miss-note">' + ic('alert') + ' ' + esc(q.solution.misconceptionNote) + '</div>' : '') +
      '</div>' +
      '<div class="fb-actions"><button class="btn primary" id="fbNext">Lanjut ' + ic('arrow') + '</button>' +
      (R.sess.items[R.sess.idx].kind === 'review' && !correct ? '<button class="btn ghost" id="fbRagu">Masih ragu — ulangi nanti</button>' : '') +
      '</div></div>';
    UI.$('#feedback').innerHTML = html;
    var fb = UI.$('#feedback .fb');
    requestAnimationFrame(function () { fb.classList.add('show'); fb.scrollIntoView({ behavior: VF.reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); });
    UI.$('#fbNext').onclick = next;
    var rg = UI.$('#fbRagu');
    if (rg) rg.onclick = function () {
      var it = R.sess.items[R.sess.idx];
      R.sess.requeued[it.skillId] = (R.sess.requeued[it.skillId] || 0) + 1;
      next();
    };
    function answerLabel(qq) {
      var c = qq.choices.filter(function (x) { return x.correct; })[0];
      return c ? (c.label || c.latex) : '–';
    }
    function fmtAns(qq) { return String(qq.answer && qq.answer.value !== undefined ? qq.answer.value : '–').replace('.', ','); }
    function escForLatex(s) { return String(s).replace(/[^\\{}]/g, function (ch) { return ch; }); }
  }

  function next() {
    var sess = R.sess;
    sess.idx++;
    // requeue: soal review yang salah → ulang di akhir (maks 1× per skill)
    if (sess.idx >= sess.items.length) {
      var rq = Object.keys(sess.requeued).filter(function (k) { return sess.requeued[k] > 0; });
      if (rq.length && sess.mode === 'daily') {
        rq.forEach(function (k) {
          sess.requeued[k] = 0;
          sess.items.push({ kind: 'review', skillId: k });
        });
      }
    }
    renderCurrent();
  }

  function persistSession() {
    var s = R.sess;
    if (!s || s.mode === 'exam' || s.mode === 'boss') return;
    STORE.saveSession({ date: s.date, mode: s.mode, items: s.items, idx: s.idx, correct: s.correct, answered: s.answered, t0: s.t0, results: s.results, focusNode: s.focusNode ? s.focusNode.id : null });
  }

  /* ---------- akhir fase & ringkasan ---------- */
  function finishPhase() {
    var sess = R.sess, save = VF.save;
    if (sess.mode === 'exam' || sess.mode === 'boss') return finishExam();
    completeDailyStats(save, sess);
    STORE.clearSession();
    var sharp = P.sharpness(save);
    var oldSharp = sess.sharpBefore !== undefined ? sess.sharpBefore : sharp;
    var pct = sess.answered ? Math.round(sess.correct / sess.answered * 100) : 0;
    var minutes = Math.max(1, Math.round((Date.now() - sess.t0) / 60000));
    var badges = VF.checkBadges(save);
    VF.persist(); STORE.snapshot(save);
    var koaLine = VF.KOA.line(save, 'sesi-selesai');
    var html = '<section class="screen summary">' +
      '<div class="sum-hero">' + VF.KOA.svg(pct >= 70 ? 'celebrate' : 'focus', 120) + '<h1>Sesi tuntas</h1>' +
      (koaLine ? '<div class="koa-line">' + esc(koaLine) + '</div>' : '') + '</div>' +
      '<div class="bento">' +
      '<div class="panel"><div class="p-head">' + ic('check') + '<span>Akurasi</span></div><div class="stat-big">' + pct + '%</div><div class="muted">' + sess.correct + ' benar dari ' + sess.answered + ' soal</div></div>' +
      '<div class="panel"><div class="p-head">' + ic('clock') + '<span>Durasi</span></div><div class="stat-big">' + minutes + '</div><div class="muted">menit · target ' + save.profile.dailyGoalMin + '</div></div>' +
      '<div class="panel"><div class="p-head">' + ic('flame') + '<span>Streak</span></div><div class="stat-big" id="sumStreak">' + save.streak.current + '</div><div class="muted">hari · combo terbaik ×' + sess.comboBest + '</div></div>' +
      '<div class="panel"><div class="p-head">' + ic('zap') + '<span>Sharpness</span></div><div class="stat-big" id="sumSharp">0</div><div class="muted">/ 1000</div></div></div>' +
      (badges.length ? '<div class="ok-box">' + ic('award') + ' Badge baru: ' + badges.map(function (b) { return esc(b.name); }).join(' · ') + '</div>' : '') +
      '<div class="btn-row center"><button class="btn primary" id="sumHome">' + ic('home') + ' Beranda</button><button class="btn ghost" id="sumMap">' + ic('map') + ' Peta Skill</button></div></section>';
    UI.$('#app').innerHTML = html;
    UI.countUp(UI.$('#sumSharp'), sharp);
    VF.AUDIO.finish(save);
    UI.$('#sumHome').onclick = function () { UI.nav('home'); };
    UI.$('#sumMap').onclick = function () { UI.nav('map'); };
    R.teardown();
  }

  function completeDailyStats(save, sess) {
    var today = VF.todayStr();
    var log = save.stats.dailyLog;
    var entry = null;
    for (var i = 0; i < log.length; i++) if (log[i].date === today) entry = log[i];
    if (!entry) { entry = { date: today, ts: Date.now(), minutes: 0, questions: 0, correct: 0 }; log.push(entry); }
    entry.minutes += Math.max(1, Math.round((Date.now() - sess.t0) / 60000));
    entry.questions += sess.answered;
    entry.correct += sess.correct;
    entry.ts = Date.now();
    // streak
    if (save.streak.lastSessionDate !== today) {
      if (save.streak.lastSessionDate === VF.yesterdayStr()) save.streak.current += 1;
      else save.streak.current = 1;
      save.streak.best = Math.max(save.streak.best, save.streak.current);
    }
    save.streak.lastSessionDate = today;
    save.stats.totalSessions += 1;
    save.stats.sessionsSinceBoss = (save.stats.sessionsSinceBoss || 0) + 1;
    save.stats.bestCombo = Math.max(save.stats.bestCombo || 0, sess.comboBest || 0);
    // histori sesi per-item (v1.5.2)
    save.stats.sessionLog = save.stats.sessionLog || [];
    save.stats.sessionLog.push({
      ts: Date.now(), mode: sess.mode,
      answered: sess.answered, correct: sess.correct,
      ms: Math.round(Date.now() - sess.t0),
      items: (sess.results || []).map(function (r) { return [r.skillId, r.correct ? 1 : 0, r.ms || 0]; })
    });
    if (save.stats.sessionLog.length > 120) save.stats.sessionLog = save.stats.sessionLog.slice(-120);
    // sharp history (satu per hari)
    var sh = save.stats.sharpHistory;
    if (sh.length && sh[sh.length - 1].date === today) sh[sh.length - 1] = { date: today, ts: Date.now(), s: P.sharpness(save) };
    else sh.push({ date: today, ts: Date.now(), s: P.sharpness(save) });
  }

  function finishExam() {
    var sess = R.sess, save = VF.save;
    var isBoss = sess.mode === 'boss';
    var isSim = sess.mode === 'sim';
    var res;
    if (isSim) {
      var correctS = sess.results.filter(function (r) { return r.correct; }).length;
      var pctS = sess.answered ? Math.round(correctS / sess.answered * 1000) / 10 : 0;
      var byDomS = {};
      sess.results.forEach(function (r) {
        var nd = E.getNode(r.skillId);
        var d = nd ? nd.domain : '?';
        byDomS[d] = byDomS[d] || { c: 0, n: 0 };
        byDomS[d].n++; if (r.correct) byDomS[d].c++;
      });
      var domListS = [];
      Object.keys(byDomS).forEach(function (d) { domListS.push({ domain: d, pct: Math.round(byDomS[d].c / byDomS[d].n * 100), n: byDomS[d].n }); });
      res = { passed: pctS >= 85, pct: pctS, domains: domListS, sim: true };
    } else if (isBoss) {
      var correct = sess.results.filter(function (r) { return r.correct; }).length;
      var pct = sess.answered ? Math.round(correct / sess.answered * 100) : 0;
      var passed = pct >= 70;
      save.stats.lastBossTs = Date.now();
      save.stats.sessionsSinceBoss = 0;
      if (passed) {
        save.streak.shields = Math.min(2, save.streak.shields + 1);
        save.stats.bossWins = (save.stats.bossWins || 0) + 1;
      }
      res = { passed: passed, pct: pct, domains: [] };
    } else {
      res = P.gradeExam(save, sess.tier, sess.results);
    }
    // streak & log tetap dihitung
    completeDailyStats(save, sess);
    var badges = VF.checkBadges(save);
    VF.persist(); STORE.snapshot(save);
    var koaLine = VF.KOA.line(save, isBoss ? (res.passed ? 'boss-lulus' : 'boss-gagal') : (res.passed ? 'promosi-lulus' : 'promosi-gagal'));
    var html = '<section class="screen summary">' +
      '<div class="sum-hero">' + VF.KOA.svg(res.passed ? 'celebrate' : 'oops', 120) +
      '<h1>' + (isSim ? 'Exam Sim selesai — ' + res.pct + '%' : isBoss ? (res.passed ? 'Boss tumbang!' : 'Boss selamat… kali ini') : res.passed ? 'PROMOSI LULUS! Tier ' + (sess.tier + 1) + ' terbuka' : 'Belum lulus — ' + res.pct + '%') + '</h1>' +
      (koaLine ? '<div class="koa-line">' + esc(koaLine) + '</div>' : '') + '</div>' +
      '<div class="panel"><div class="score-huge ' + (res.passed ? 'ok' : 'no') + '">' + res.pct + '%</div>' +
      '<div class="muted">' + (isSim ? 'Ujian latihan campuran — tanpa efek gerbang & cooldown' : isBoss ? 'Lulus boss ≥ 70% · hadiah: +1 streak shield' : 'Syarat lulus ≥ ' + VF.TIERS[sess.tier].passPct + '% + tiap domain ≥ 70%') + '</div>' +
      (res.domains.length ? '<div class="dombars">' + res.domains.map(function (d) {
        return '<div class="dombar"><span class="domname">' + esc(d.domain) + '</span><div class="bar-track"><div class="bar-fill ' + (d.pct >= 70 ? '' : 'low') + '" style="width:' + d.pct + '%"></div></div><b>' + d.pct + '%</b></div>';
      }).join('') + '</div>' : '') +
      (!res.passed && !isBoss ? '<div class="warn small">' + ic('clock') + ' Cooldown 48 jam aktif. Fokuskan latihan ke domain terlemah — antrian review otomatis mengikutinya.</div>' : '') +
      (!res.passed && isBoss ? '<div class="muted small">Boss mingguan berikutnya tersedia ≥ 7 hari lagi.</div>' : '') +
      (res.passed && !isBoss && sess.tier === 4 ? '<div class="ok-box">' + ic('award') + ' Jalur inti selesai — Tier 5 (Ujian Praktik) mode permanen terbuka. Pertahankan dengan review berkala!</div>' : '') +
      (badges.length ? '<div class="ok-box">' + ic('award') + ' Badge baru: ' + badges.map(function (b) { return esc(b.name); }).join(' · ') + '</div>' : '') +
      (res.passed && !isBoss && !isSim ? '<div class="btn-row center"><button class="btn amber" id="exCert">' + ic('award') + ' Unduh Sertifikat Promosi</button></div>' : '') +
      '</div><div class="btn-row center"><button class="btn primary" id="exHome">' + ic('home') + ' Beranda</button></div></section>';
    UI.$('#app').innerHTML = html;
    if (res.passed) VF.AUDIO.fanfare(save); else VF.AUDIO.wrong(save);
    var certBtn = UI.$('#exCert');
    if (certBtn) certBtn.onclick = function () { downloadCertificate(save, sess.tier, res.pct); };
    UI.$('#exHome').onclick = function () { UI.nav('home'); };
    R.teardown();
  }

  /* ---------- sertifikat promosi (canvas → PNG) ---------- */
  function downloadCertificate(save, tier, score) {
    var c = document.createElement('canvas');
    c.width = 1200; c.height = 800;
    var g = c.getContext('2d');
    g.fillStyle = '#0B1220'; g.fillRect(0, 0, 1200, 800);
    // grid blueprint halus
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
    for (var x = 0; x <= 1200; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 800); g.stroke(); }
    for (var y = 0; y <= 800; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(1200, y); g.stroke(); }
    // bingkai
    g.strokeStyle = '#55E6C1'; g.lineWidth = 6; g.strokeRect(40, 40, 1120, 720);
    g.strokeStyle = 'rgba(85,230,193,0.35)'; g.lineWidth = 2; g.strokeRect(56, 56, 1088, 688);
    // gear kiri-kanan (lingkaran + gerigi sederhana)
    function gear(cx, cy, r) {
      g.strokeStyle = '#55E6C1'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      for (var a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        g.beginPath(); g.moveTo(cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8));
        g.lineTo(cx + Math.cos(a) * (r + 26), cy + Math.sin(a) * (r + 26)); g.stroke();
      }
    }
    gear(140, 400, 40); gear(1060, 400, 40);
    // teks
    g.textAlign = 'center';
    g.fillStyle = '#55E6C1'; g.font = '700 34px "Space Grotesk", sans-serif';
    g.fillText('VISTA FORGY — SERTIFIKAT PROMOSI', 600, 170);
    g.fillStyle = '#94A3B8'; g.font = '22px "Inter", sans-serif';
    g.fillText('dengan bangga diberikan kepada', 600, 250);
    g.fillStyle = '#E8EEF7'; g.font = '700 64px "Space Grotesk", sans-serif';
    g.fillText(save.profile.name || 'Forge-er', 600, 340);
    g.fillStyle = '#94A3B8'; g.font = '22px "Inter", sans-serif';
    g.fillText('yang telah LULUS Ujian Promosi', 600, 410);
    g.fillStyle = '#E8EEF7'; g.font = '700 46px "Space Grotesk", sans-serif';
    g.fillText('TIER ' + tier + ' — "' + VF.TIERS[tier].name + '"', 600, 470);
    g.fillStyle = '#55E6C1'; g.font = '700 30px "JetBrains Mono", monospace';
    g.fillText('SKOR ' + score + '%', 600, 540);
    g.fillStyle = '#94A3B8'; g.font = '20px "Inter", sans-serif';
    var tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    g.fillText('Pekalongan · ' + tgl, 600, 640);
    g.fillStyle = '#7EA7FF'; g.font = 'italic 18px "Inter", sans-serif';
    g.fillText('KOA mencatat ini. Dengan hormat.', 600, 700);
    var a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'vista-forgy-tier-' + tier + '.png';
    a.click();
  }

  /* ---------- resume ---------- */
  R.offerResume = function () {
    var s = STORE.loadSession();
    if (!s) return false;
    var m = UI.modal('<div class="concept"><h2>Lanjutkan sesi tadi?</h2><p>Ada sesi ' + ({ daily: 'harian', quick: 'Quick 5', zeno: 'latihan fokus' }[s.mode] || s.mode) + ' yang belum selesai hari ini (' + s.answered + ' soal terjawab).</p>' +
      '<div class="btn-row"><button class="btn primary" id="rsYes">Lanjutkan</button><button class="btn ghost" id="rsNo">Buang & mulai baru</button></div></div>');
    UI.$('#rsYes', m.box).onclick = function () {
      m.close();
      R.sess = { mode: s.mode, phase: s.mode === 'zeno' ? 'focus' : (s.mode === 'daily' ? (s.idx < 8 ? 'warmup' : 'review') : 'review'), items: s.items, idx: s.idx, correct: s.correct, answered: s.answered, combo: 0, comboBest: 0, t0: Date.now(), results: s.results || [], requeued: {}, date: s.date };
      if (s.focusNode) R.sess.focusNode = E.getNode(s.focusNode);
      UI.nav('run?mode=' + s.mode + (s.mode === 'zeno' && s.focusNode ? '&node=' + s.focusNode : ''));
      renderCurrent();
    };
    UI.$('#rsNo', m.box).onclick = function () { STORE.clearSession(); m.close(); };
    return true;
  };

  /* route */
  UI.route('run', function () {
    var q = {};
    (location.hash.split('?')[1] || '').split('&').forEach(function (kv) {
      var p = kv.split("="); if (p[0]) q[p[0]] = decodeURIComponent(p[1] || "");
    });
    if (!q.mode) { UI.nav("home"); return; }
    R.start({ mode: q.mode, node: q.node, tier: q.tier });
  });
})();
