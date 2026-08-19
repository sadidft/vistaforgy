/* Vista Forgy — tables.js (v1.5.1)
   Tabel distribusi granular: Φ(z) eksak (aproksimasi A&S 26.2-17, galat <1e-7),
   tabel t dua-sisi & satu-sisi, CDF binomial eksak. Murni fungsi — dipakai generator & visual. */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var TB = (VF.TABLES = VF.TABLES || {});

  /* ---------- Normal: φ dan Φ ---------- */
  TB.normPdf = function (z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); };
  TB.normCdf = function (z) {
    if (z < 0) return 1 - TB.normCdf(-z);
    var t = 1 / (1 + 0.2316419 * z);
    var poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return 1 - TB.normPdf(z) * poly;
  };
  TB.f4 = function (v) { return v.toFixed(4).replace('.', ','); };
  TB.f2 = function (v) { return v.toFixed(2).replace('.', ','); };

  /* visual tabel-z granular: 10 baris z0.00 … z0.09 */
  TB.zTableVisual = function (z) {
    var z0 = Math.floor(z);
    var rows = [];
    for (var d = 0; d <= 9; d++) rows.push([TB.f2(z0 + d / 10), TB.f4(TB.normCdf(z0 + d / 10))]);
    return { type: 'table', caption: 'Tabel Z granular — Φ(z) = P(Z ≤ z), baris ' + TB.f2(z0) + '…' + TB.f2(z0 + 0.9), head: ['z', 'Φ(z)'], rows: rows };
  };

  /* ---------- t: dua sisi 95% (t_{0.975}) & satu sisi 95% (t_{0.95}) ---------- */
  TB.T975 = { 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042, 40: 2.021, 60: 2.000, 120: 1.980, 999: 1.960 };
  TB.T95 = { 4: 2.132, 5: 2.015, 6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812, 12: 1.782, 14: 1.761, 16: 1.746, 18: 1.734, 20: 1.725, 24: 1.711, 29: 1.699, 30: 1.697, 40: 1.684, 60: 1.671, 120: 1.658, 999: 1.645 };
  TB.t975 = function (df) { return TB.T975[df] !== undefined ? TB.T975[df] : (df >= 120 ? 1.98 : TB.T975[999]); };
  TB.t95 = function (df) { return TB.T95[df] !== undefined ? TB.T95[df] : (df >= 120 ? 1.658 : TB.T95[999]); };
  TB.tTableVisual = function (dfUsed, oneSided) {
    var dfs = [5, 9, 14, 19, 24, 29, 40, 999];
    if (dfs.indexOf(dfUsed) < 0) dfs.unshift(dfUsed);
    var get = oneSided ? TB.t95 : TB.t975;
    return {
      type: 'table',
      caption: 'Kutipan tabel t ' + (oneSided ? 'SATU SISI 95% (t₀.₉₅)' : 'DUA SISI 95% (t₀.₉₇₅)') + (dfUsed === 999 ? '' : ' — df=' + dfUsed + ' dipakai'),
      head: ['df', 't'],
      rows: dfs.map(function (d) { return [d === 999 ? '∞' : String(d), get(d).toFixed(3).replace('.', ',')]; })
    };
  };

  /* ---------- Binomial: pmf & cdf eksak ---------- */
  TB.binomCdf = function (n, k, p) {
    var c = 1, sum = Math.pow(1 - p, n); // k=0
    for (var i = 1; i <= k; i++) {
      c = c * (n - i + 1) / i;
      sum += c * Math.pow(p, i) * Math.pow(1 - p, n - i);
    }
    return sum;
  };
  TB.binomTableVisual = function (n, k, p) {
    var rows = [];
    for (var i = 0; i <= n; i++) rows.push([String(i), TB.f4(TB.binomCdf(n, i, p))]);
    return { type: 'table', caption: 'Tabel binomial kumulatif P(X ≤ k), n=' + n + ', p=' + TB.f2(p), head: ['k', 'P(X ≤ k)'], rows: rows };
  };
})();
