// Crowd laughter rendered once in code (harsh panel H8, owner 22 Nov: "solve"): no files.
// Each voice is a train of "ha" syllables: a sawtooth at the voice's pitch plus breath noise, through three vowel
// formant filters (about 800, 1200 and 2600 Hz; the third keeps it audible on laptop speakers, 1-4 kHz rule).
// Seeded, so every load renders the same sound. Usage: makeLaughs().then((b) => b.crowd / b.small / b.one), AudioBuffers.
(function () {
  'use strict';
  // ----- LAUGH CONFIG -----
  const L = {
    // sample rate of the rendered buffers (Hz); a source node resamples to the playing context
    rate: 44100,
    // per buffer: length s, voices, loudness, seed
    kinds: { crowd: { secs: 1.9, voices: 14, vol: 0.5, seed: 11 }, small: { secs: 0.9, voices: 4, vol: 0.4, seed: 23 }, one: { secs: 1.0, voices: 1, vol: 0.55, seed: 37 } },
    // voice pitch range at the start of the laugh (Hz); each voice falls by this share over the laugh
    pitch: [140, 330], fall: 0.25,
    // syllables per voice and the syllable period range (s); later syllables get quieter by this share each
    syl: [3, 7], period: [0.13, 0.2], decay: 0.18,
    // voices start within this many seconds of each other
    spread: 0.3,
    // formants: centre Hz ranges and Q (vowel "a"), and the level of each
    formants: [[700, 900, 6, 1.0], [1100, 1350, 7, 0.6], [2400, 2800, 8, 0.35]],
    // breath noise level against the voiced part
    breath: 0.35,
  };
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const lerp = (a, b, k) => a + (b - a) * k;
  function render(kind) {
    const K = L.kinds[kind], r = rng(K.seed);
    const ctx = new OfflineAudioContext(1, Math.ceil(K.secs * L.rate), L.rate);
    const out = ctx.createGain(); out.gain.value = K.vol / Math.sqrt(K.voices); out.connect(ctx.destination);
    const noise = ctx.createBuffer(1, L.rate, L.rate), nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
    for (let v = 0; v < K.voices; v++) {
      const t0 = K.voices > 1 ? r() * L.spread : 0.02, f0 = lerp(L.pitch[0], L.pitch[1], r());
      const n = Math.round(lerp(L.syl[0], L.syl[1], r())), per = lerp(L.period[0], L.period[1], r());
      const end = Math.min(K.secs - 0.05, t0 + n * per);
      const env = ctx.createGain(); env.gain.value = 0;
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, t0); osc.frequency.linearRampToValueAtTime(f0 * (1 - L.fall), end);
      const br = ctx.createBufferSource(); br.buffer = noise; br.loop = true;
      const brg = ctx.createGain(); brg.gain.value = L.breath;
      const mix = ctx.createGain();
      osc.connect(mix); br.connect(brg).connect(mix);
      for (const [lo, hi, q, lvl] of L.formants) {
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = lerp(lo, hi, r()); bp.Q.value = q;
        const g = ctx.createGain(); g.gain.value = lvl;
        mix.connect(bp).connect(g).connect(env);
      }
      env.connect(out);
      // one "ha" per period: quick attack, fall to silence before the next
      for (let s = 0; s < n; s++) {
        const a = t0 + s * per, peak = Math.pow(1 - L.decay, s) * lerp(0.7, 1, r());
        if (a + per > K.secs) break;
        env.gain.setValueAtTime(0.0001, a);
        env.gain.exponentialRampToValueAtTime(peak, a + 0.025);
        env.gain.exponentialRampToValueAtTime(0.0001, a + per * 0.8);
      }
      osc.start(t0); osc.stop(end + 0.05); br.start(t0, r() * 0.5); br.stop(end + 0.05);
    }
    return ctx.startRendering();
  }
  let made = null;
  window.makeLaughs = function () {
    if (!made) made = Promise.all(Object.keys(L.kinds).map(render)).then((bs) => { const o = {}; Object.keys(L.kinds).forEach((k, i) => { o[k] = bs[i]; }); return o; });
    return made;
  };
  window.LAUGH_CONFIG = L;
})();
