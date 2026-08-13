export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = 1;
    this.groups = { master: 1, players: 1, blocks: 1, hostile: 1, weather: 1, music: 0.4 };
    this.muted = false;
  }

  ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    this.ctx = new Ctx();
    this.scheduleMusic();
    return this.ctx;
  }

  vol(group) {
    if (this.muted) return 0;
    return this.master * (this.groups.master ?? 1) * (this.groups[group] ?? 1);
  }

  beep(freq, dur, type = "square", vol = 0.08, group = "master") {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(this.vol(group) * vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.12, group = "blocks") {
    const ctx = this.ensure();
    if (!ctx) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 800;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(this.vol(group) * vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  click() {
    this.beep(600, 0.04, "square", 0.05, "master");
  }
  hover() {
    this.beep(900, 0.02, "square", 0.02, "master");
  }
  place() {
    this.noise(0.08, 0.16, "blocks");
    this.beep(180, 0.06, "triangle", 0.04, "blocks");
  }
  break() {
    this.noise(0.12, 0.22, "blocks");
  }
  step() {
    this.noise(0.05, 0.07, "players");
  }
  hit() {
    this.beep(220, 0.08, "sawtooth", 0.08, "players");
    this.noise(0.08, 0.1, "players");
  }
  hurt() {
    this.beep(140, 0.18, "square", 0.1, "players");
  }
  eat() {
    this.noise(0.1, 0.1, "players");
    this.beep(320, 0.05, "triangle", 0.04, "players");
  }
  pop() {
    this.beep(880, 0.06, "square", 0.05, "players");
  }
  explode() {
    this.noise(0.45, 0.4, "hostile");
    this.beep(60, 0.4, "sawtooth", 0.12, "hostile");
  }
  splash() {
    this.noise(0.12, 0.1, "weather");
  }
  zombie() {
    this.beep(90 + Math.random() * 30, 0.25, "sawtooth", 0.06, "hostile");
  }

  note(i) {
    const freqs = [523, 587, 659, 698, 784, 880, 988, 1046];
    this.beep(freqs[i % freqs.length], 0.18, "triangle", 0.06, "music");
  }

  scheduleMusic() {
    if (this._musicTimer) return;
    const tick = () => {
      const v = this.vol("music");
      if (v > 0.04 && this.ctx) this.playTune(v * 0.35);
      this._musicTimer = setTimeout(tick, 16000 + Math.random() * 10000);
    };
    this._musicTimer = setTimeout(tick, 2500);
  }

  playTune(vol) {
    const ctx = this.ctx;
    if (!ctx) return;
    const scale = [196, 220, 247, 262, 294, 330, 349, 392];
    const t0 = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = scale[(i * 3 + (i & 1) * 2) % scale.length];
      const t = t0 + i * 1.15;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * 0.045, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 1.1);
    }
  }
}
