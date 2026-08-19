/* Vista Forgy — audio.js (WebAudio synth, tanpa file aset) */
(function () {
  'use strict';
  var VF = (window.VF = window.VF || {});
  var A = (VF.AUDIO = VF.AUDIO || {});
  var ctx = null;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, dur, type, vol, delay, slide) {
    var c = ensure();
    if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  A.enabled = function (save) { return save && save.settings.sound; };
  A.vol = function (save) { return save ? (save.settings.volume || 0.5) : 0.5; };

  A.correct = function (save, combo) {
    if (!A.enabled(save)) return;
    var v = A.vol(save);
    tone(660, 0.09, 'sine', 0.16 * v);
    tone(880, 0.12, 'sine', 0.14 * v, 0.07);
    if (combo >= 3) tone(1174, 0.14, 'triangle', 0.1 * v, 0.14);
  };
  A.wrong = function (save) {
    if (!A.enabled(save)) return;
    tone(196, 0.18, 'sine', 0.2 * A.vol(save), 0, 130);
  };
  A.click = function (save) {
    if (!A.enabled(save)) return;
    tone(440, 0.04, 'sine', 0.06 * A.vol(save));
  };
  A.finish = function (save) {
    if (!A.enabled(save)) return;
    var v = A.vol(save);
    tone(523, 0.12, 'sine', 0.15 * v);
    tone(659, 0.12, 'sine', 0.15 * v, 0.12);
    tone(784, 0.2, 'sine', 0.16 * v, 0.24);
  };
  A.fanfare = function (save) {
    if (!A.enabled(save)) return;
    var v = A.vol(save);
    [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.14 * v, i * 0.13); });
  };
  A.tick = function (save) {
    if (!A.enabled(save)) return;
    tone(980, 0.03, 'square', 0.03 * A.vol(save));
  };
})();
