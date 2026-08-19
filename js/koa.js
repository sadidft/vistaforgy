/* Vista Forgy — koa.js (maskot KOA: robot workshop, dry humor) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var K = (VF.KOA = VF.KOA || {});
  var lastLine = 0;

  /* SVG KOA — kepala robot dengan gear; state via class (idle/happy/oops/focus/celebrate) */
  K.svg = function (state, size) {
    size = size || 120;
    return '' +
      '<svg class="koa koa-' + (state || 'idle') + '" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" aria-hidden="true">' +
      '<defs><linearGradient id="kg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55E6C1"/><stop offset="1" stop-color="#F5BD67"/></linearGradient></defs>' +
      '<ellipse class="koa-shadow" cx="60" cy="108" rx="30" ry="5" fill="rgba(0,0,0,0.35)"/>' +
      '<g class="koa-body">' +
      // antena
      '<line x1="60" y1="18" x2="60" y2="30" stroke="#94A3B8" stroke-width="3"/>' +
      '<circle class="koa-antenna" cx="60" cy="15" r="5" fill="url(#kg)"/>' +
      // kepala
      '<rect x="28" y="28" width="64" height="52" rx="14" fill="#17263D" stroke="#3D5375" stroke-width="2"/>' +
      // panel muka
      '<rect x="36" y="38" width="48" height="26" rx="8" fill="#0B1220"/>' +
      // mata
      '<g class="koa-eyes">' +
      '<circle class="koa-eye" cx="50" cy="51" r="5.5" fill="url(#kg)"/>' +
      '<circle class="koa-eye" cx="70" cy="51" r="5.5" fill="url(#kg)"/>' +
      '</g>' +
      // mulut status
      '<path class="koa-mouth" d="M50 62 Q60 66 70 62" stroke="#7EA7FF" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      // telinga/gear kiri-kanan
      '<g class="koa-gear koa-gear-l" transform="translate(24,54)">' +
      '<g fill="#3D5375">' +
      '<rect x="-3" y="-9" width="6" height="18" rx="2"/><rect x="-9" y="-3" width="18" height="6" rx="2"/>' +
      '<circle r="7.5" fill="#17263D"/><circle r="3" fill="#55E6C1"/>' +
      '</g></g>' +
      '<g class="koa-gear koa-gear-r" transform="translate(96,54)">' +
      '<g fill="#3D5375">' +
      '<rect x="-3" y="-9" width="6" height="18" rx="2"/><rect x="-9" y="-3" width="18" height="6" rx="2"/>' +
      '<circle r="7.5" fill="#17263D"/><circle r="3" fill="#7EA7FF"/>' +
      '</g></g>' +
      // badan kecil
      '<rect x="42" y="82" width="36" height="20" rx="8" fill="#0D1626" stroke="#3D5375" stroke-width="2"/>' +
      '<circle class="koa-core" cx="60" cy="92" r="6" fill="url(#kg)"/>' +
      '</g></svg>';
  };

  /* Pilih baris humor by trigger; hormati Serius Mode + cooldown */
  K.line = function (save, trigger) {
    if (!save || save.settings.serious) return trigger === 'serius-on' ? 'Serius Mode aktif. KOA diam.' : '';
    var now = Date.now();
    if (now - lastLine < 20000) return '';
    var pool = VF.HUMOR[trigger];
    if (!pool || !pool.length) return '';
    lastLine = now;
    var idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  };

  /* Mood KOA dari waktu lokal */
  K.mood = function () {
    var h = new Date().getHours();
    return h < 11 ? 'pagi' : (h >= 22 || h < 4 ? 'malam' : '');
  };
})();
