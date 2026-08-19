/* Vista Forgy — crypto.js (file .fgy: AES-GCM-256 + PBKDF2-SHA256 via Web Crypto) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var C = (VF.CRYPTO = VF.CRYPTO || {});
  var MAGIC = [0x56, 0x46, 0x47, 0x59, 0x31]; // "VFGY1"
  var FORMAT_VERSION = 1;
  var ITER = 250000;

  C.available = function () {
    return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.importKey === 'function';
  };

  function subtle() { return crypto.subtle; }

  async function deriveKey(password, salt) {
    var base = await subtle().importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    return subtle().deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }

  /* Export: save → Uint8Array file .fgy */
  C.encryptSave = async function (saveObj, password) {
    if (!C.available()) throw new Error('Web Crypto tidak tersedia di konteks ini');
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await deriveKey(password, salt);
    var plaintext = new TextEncoder().encode(JSON.stringify(saveObj));
    var ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv: iv }, key, plaintext));
    var head = new Uint8Array(MAGIC);
    var ver = new Uint8Array(2);
    ver[0] = (FORMAT_VERSION >> 8) & 0xff; ver[1] = FORMAT_VERSION & 0xff;
    var total = head.length + ver.length + salt.length + iv.length + ct.length;
    var out = new Uint8Array(total);
    var o = 0;
    [head, ver, salt, iv, ct].forEach(function (part) { out.set(part, o); o += part.length; });
    return out;
  };

  /* Import: ArrayBuffer → objek save (throw kalau password salah/file rusak) */
  C.decryptSave = async function (buffer, password) {
    if (!C.available()) throw new Error('Web Crypto tidak tersedia di konteks ini');
    var u8 = new Uint8Array(buffer);
    if (u8.length < 40) throw new Error('File terlalu pendek — bukan file .fgy');
    for (var i = 0; i < MAGIC.length; i++) if (u8[i] !== MAGIC[i]) throw new Error('Ini bukan file Vista Forgy (.fgy)');
    var ver = (u8[5] << 8) | u8[6];
    if (ver > FORMAT_VERSION) throw new Error('File dibuat versi lebih baru — perbarui aplikasi dulu.');
    var salt = u8.slice(7, 23), iv = u8.slice(23, 35), ct = u8.slice(35);
    var key = await deriveKey(password, salt);
    var pt;
    try {
      pt = await subtle().decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    } catch (e) {
      throw new Error('Password salah atau file rusak (gagal decode).');
    }
    var obj = JSON.parse(new TextDecoder().decode(pt));
    if (!obj || !obj.profile || !obj.skills) throw new Error('Struktur file tidak dikenali');
    return obj;
  };

  /* Merge: per-skill terbaru menang; union histori; streak terbesar */
  C.mergeSaves = function (local, remote) {
    Object.keys(remote.skills).forEach(function (id) {
      var r = remote.skills[id], l = local.skills[id];
      if (!l || (r.lastReviewTs || 0) > (l.lastReviewTs || 0)) local.skills[id] = r;
    });
    var seen = {};
    (local.tiers.examHistory || []).forEach(function (h) { seen[Math.round(h.ts / 1000) + ':' + h.tier] = 1; });
    (remote.tiers.examHistory || []).forEach(function (h) {
      var k = Math.round(h.ts / 1000) + ':' + h.tier;
      if (!seen[k]) { local.tiers.examHistory.push(h); seen[k] = 1; }
    });
    local.tiers.unlocked = Math.max(local.tiers.unlocked || 0, remote.tiers.unlocked || 0);
    local.streak.best = Math.max(local.streak.best || 0, remote.streak.best || 0);
    local.streak.current = Math.max(local.streak.current || 0, remote.streak.current || 0);
    local.stats.totalQuestions = Math.max(local.stats.totalQuestions || 0, remote.stats.totalQuestions || 0);
    local.stats.totalSessions = Math.max(local.stats.totalSessions || 0, remote.stats.totalSessions || 0);
    var logSeen = {};
    (local.stats.dailyLog || []).forEach(function (d) { logSeen[d.date] = 1; });
    (remote.stats.dailyLog || []).forEach(function (d) { if (!logSeen[d.date]) { local.stats.dailyLog.push(d); logSeen[d.date] = 1; } });
    local.stats.dailyLog.sort(function (a, b) { return a.ts - b.ts; });
    (remote.badges || []).forEach(function (b) { if (local.badges.indexOf(b) < 0) local.badges.push(b); });
    return local;
  };

  /* Download helper */
  C.download = function (bytes, filename) {
    var blob = new Blob([bytes], { type: 'application/octet-stream' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
})();
