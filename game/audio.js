// audio.js — tiny synthesized sounds for Dapur Kilat.
// All sounds are made with the WebAudio API in code: short beeps, a chop
// thock, a grill sizzle made from filtered noise, and little jingles.
// No audio files, no network. Audio starts only after a user gesture.

const AudioEngine = {
  ctx: null,
  muted: false,
  sizzleNodes: null,

  ensureAudio: function () {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch (e) {
      this.ctx = null;
    }
  },

  tone: function (freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  playClick: function () {
    this.tone(660, 0.06, 'triangle', 0.08);
  },

  playChop: function () {
    // A woody thock: low square blip plus a noise snap.
    this.tone(180, 0.08, 'square', 0.1, 90);
    this.playNoiseBurst(0.05, 0.12);
  },

  playNoiseBurst: function (dur, vol) {
    if (!this.ctx || this.muted) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.value = vol || 0.1;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
  },

  startSizzle: function () {
    if (!this.ctx || this.muted || this.sizzleNodes) return;
    const len = this.ctx.sampleRate * 1;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 0.6;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this.sizzleNodes = { src: src, gain: gain };
  },

  stopSizzle: function () {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      const src = this.sizzleNodes.src;
      setTimeout(function () { try { src.stop(); } catch (e) { /* already stopped */ } }, 120);
    } catch (e) { /* ignore */ }
    this.sizzleNodes = null;
  },

  playDing: function () {
    this.tone(880, 0.12, 'sine', 0.14);
    setTimeout(() => this.tone(1318, 0.18, 'sine', 0.12), 90);
  },

  playBuzz: function () {
    this.tone(140, 0.22, 'sawtooth', 0.1, 90);
  },

  playPop: function () {
    this.tone(520, 0.07, 'triangle', 0.1, 780);
  },

  playSad: function () {
    this.tone(392, 0.16, 'triangle', 0.12);
    setTimeout(() => this.tone(311, 0.16, 'triangle', 0.12), 150);
    setTimeout(() => this.tone(233, 0.3, 'triangle', 0.12), 300);
  },

  playJingle: function () {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.13), i * 130));
  },
};
