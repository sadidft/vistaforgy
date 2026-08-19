/* Vista Forgy — rng.js
   RNG deterministik (mulberry32 + cyrb128). DILARANG Math.random() di engine. */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});

  function cyrb128(str) {
    var h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (var i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4); h2 ^= h1; h3 ^= h1; h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seedStr) {
    var s = cyrb128(String(seedStr));
    var f = mulberry32(s[0]);
    var g = mulberry32(s[1]); // stream kedua untuk shuffle independen
    var api = {
      next: f,
      float: function (min, max) { return min + f() * (max - min); },
      int: function (min, max) { return Math.floor(min + f() * (max - min + 1)); },
      bool: function (p) { return f() < (p === undefined ? 0.5 : p); },
      pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
      pickN: function (arr, n) { return api.shuffle(arr.slice()).slice(0, n); },
      shuffle: function (arr) {
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(g() * (i + 1));
          var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      },
      sign: function () { return f() < 0.5 ? -1 : 1; }
    };
    return api;
  }
  VF.cyrb128 = cyrb128;
  VF.mulberry32 = mulberry32;
  VF.makeRng = makeRng;
})();
