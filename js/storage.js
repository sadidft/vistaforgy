/* Vista Forgy — storage.js (local-first save, snapshot, migrasi, crash-resume; guarded) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var STORE = (VF.STORE = VF.STORE || {});

  var KEY = 'vf.save', SNAP = 'vf.snapshots', SESS = 'vf.session';
  var memory = {};
  var usable = null;
  var backend = null;

  function lsGet(k) {
    if (backend === 'memory') return memory[k] || null;
    try { return localStorage.getItem(k); } catch (e) { backend = 'memory'; return memory[k] || null; }
  }
  function lsSet(k, v) {
    memory[k] = v;
    if (backend === 'memory') return;
    try { localStorage.setItem(k, v); } catch (e) { backend = 'memory'; }
  }
  function lsDel(k) { delete memory[k]; if (backend === 'memory') return; try { localStorage.removeItem(k); } catch (e) {} }

  STORE.persistent = function () {
    if (usable !== null) return usable;
    try {
      var t = '__vf' + Date.now();
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      usable = true;
    } catch (e) { usable = false; }
    return usable;
  };

  /* ---------- schema ---------- */
  STORE.SCHEMA_VERSION = 1;
  function newSave() {
    return {
      version: STORE.SCHEMA_VERSION,
      createdAt: Date.now(), updatedAt: Date.now(),
      profile: { name: '', track: 'ti', dailyGoalMin: 25 },
      skills: {},
      tiers: { current: 0, unlocked: 0, examHistory: [] },
      streak: { current: 0, best: 0, shields: 0, lastSessionDate: '' },
      stats: { totalQuestions: 0, totalSessions: 0, dailyLog: [], lastBossTs: 0, sessionsSinceBoss: 0, sharpHistory: [] },
      badges: [],
      settings: { sound: true, volume: 0.5, serious: false, motion: 'auto', theme: 'dark' },
      schemaMigrations: [STORE.SCHEMA_VERSION]
    };
  }
  STORE.newSave = newSave;

  var MIGRATIONS = [];
  STORE.migrate = function (data) {
    if (!data.version) data.version = 1;
    while (data.version < STORE.SCHEMA_VERSION) {
      var m = MIGRATIONS[data.version];
      if (m) m(data);
      data.version++;
      (data.schemaMigrations = data.schemaMigrations || []).push(data.version);
    }
    // jaga-jaga field baru
    var fresh = newSave();
    Object.keys(fresh).forEach(function (k) { if (data[k] === undefined) data[k] = fresh[k]; });
    Object.keys(fresh.profile).forEach(function (k) { if (data.profile[k] === undefined) data.profile[k] = fresh.profile[k]; });
    Object.keys(fresh.settings).forEach(function (k) { if (data.settings[k] === undefined) data.settings[k] = fresh.settings[k]; });
    Object.keys(fresh.stats).forEach(function (k) { if (data.stats[k] === undefined) data.stats[k] = fresh.stats[k]; });
    return data;
  };

  STORE.load = function () {
    var raw = lsGet(KEY);
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !data.profile) throw new Error('bad');
      return STORE.migrate(data);
    } catch (e) {
      // coba snapshot
      var snaps = STORE.snapshots();
      for (var i = 0; i < snaps.length; i++) {
        try { return STORE.migrate(JSON.parse(snaps[i])); } catch (e2) {}
      }
      return null;
    }
  };
  STORE.save = function (data) {
    data.updatedAt = Date.now();
    data.version = STORE.SCHEMA_VERSION;
    try { lsSet(KEY, JSON.stringify(data)); } catch (e) { return false; }
    return true;
  };
  STORE.reset = function () { lsDel(KEY); lsDel(SNAP); lsDel(SESS); };

  STORE.snapshots = function () {
    try { return JSON.parse(lsGet(SNAP) || '[]'); } catch (e) { return []; }
  };
  STORE.snapshot = function (data) {
    var snaps = STORE.snapshots();
    var today = VF.todayStr();
    var entry = JSON.stringify({ date: today, data: data });
    if (snaps.length && JSON.parse(snaps[0]).date === today) snaps[0] = entry;
    else snaps.unshift(entry);
    if (snaps.length > 7) snaps.length = 7;
    try { lsSet(SNAP, JSON.stringify(snaps)); } catch (e) {}
  };

  /* ---------- crash-resume sesi ---------- */
  STORE.saveSession = function (sess) { try { lsSet(SESS, JSON.stringify(sess)); } catch (e) {} };
  STORE.loadSession = function () {
    try {
      var s = JSON.parse(lsGet(SESS) || 'null');
      if (s && s.date === VF.todayStr() && s.items && s.items.length && s.idx < s.items.length) return s;
      return null;
    } catch (e) { return null; }
  };
  STORE.clearSession = function () { lsDel(SESS); };

  /* ---------- sinkron antar-tab ---------- */
  STORE.onExternalChange = function (cb) {
    try {
      window.addEventListener('storage', function (ev) {
        if (ev.key === KEY) cb();
      });
    } catch (e) {}
  };

  /* ---------- multi-profil (v1.6.5) ----------
     vf.active  = nama profil aktif; vf.save = data AKTIF (kompatibilitas penuh dgn .fgy).
     vf.profiles = indeks; vf.p:<nama> = slot per profil. */
  STORE.profileIndex = function () {
    try { return JSON.parse(lsGet('vf.profiles') || '[]'); } catch (e) { return []; }
  };
  STORE.activeProfile = function () { return lsGet('vf.active') || 'utama'; };
  STORE.ensureDefaultProfile = function () {
    if (!lsGet('vf.active')) {
      lsSet('vf.active', 'utama');
      var idx = STORE.profileIndex();
      if (!idx.some(function (p) { return p.name === 'utama'; })) {
        idx.push({ name: 'utama', createdAt: Date.now() });
        lsSet('vf.profiles', JSON.stringify(idx));
      }
    }
  };
  STORE.saveCurrentToSlot = function () {
    var raw = lsGet(KEY);
    if (raw) lsSet('vf.p:' + STORE.activeProfile(), raw);
    var idx = STORE.profileIndex();
    var name = STORE.activeProfile();
    if (!idx.some(function (p) { return p.name === name; })) { idx.push({ name: name, createdAt: Date.now() }); lsSet('vf.profiles', JSON.stringify(idx)); }
  };
  STORE.switchProfile = function (name) {
    var slot = lsGet('vf.p:' + name);
    if (!slot) return false;
    STORE.saveCurrentToSlot();
    lsSet(KEY, slot);
    lsSet('vf.active', name);
    return true;
  };
  STORE.createProfile = function (name, freshSave) {
    if (!name || lsGet('vf.p:' + name)) return false;
    STORE.saveCurrentToSlot();
    lsSet('vf.p:' + name, JSON.stringify(freshSave));
    lsSet(KEY, JSON.stringify(freshSave));
    lsSet('vf.active', name);
    var idx = STORE.profileIndex();
    idx.push({ name: name, createdAt: Date.now() });
    lsSet('vf.profiles', JSON.stringify(idx));
    return true;
  };
  STORE.deleteProfile = function (name) {
    if (name === STORE.activeProfile()) return false;
    lsDel('vf.p:' + name);
    lsSet('vf.profiles', JSON.stringify(STORE.profileIndex().filter(function (p) { return p.name !== name; })));
    return true;
  };

  STORE.usage = function () {
    var raw = lsGet(KEY) || '';
    return { bytes: raw.length, kb: Math.round(raw.length / 102.4) / 10, limitKb: 5120 };
  };
})();
