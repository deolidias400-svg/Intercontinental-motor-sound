// Web Audio API engine for Intercontinental Motor Sound Cockpit

class AudioEngine {
  private ctx: AudioContext | null = null;
  private audio: HTMLAudioElement | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private nitroGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private timeDomainArray: Uint8Array<ArrayBuffer> | null = null;
  private isInitialized = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    // Faster, responsive spectrum analyzer smoothing for razor-sharp beat sync
    this.analyser.smoothingTimeConstant = 0.45;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.lowFilter = this.ctx.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 320;
    this.lowFilter.gain.value = 0;

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1;
    this.midFilter.gain.value = 0;

    this.highFilter = this.ctx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 3200;
    this.highFilter.gain.value = 0;

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.value = 1.0;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    this.source = this.ctx.createMediaElementSource(this.audio);

    // Audio node routing
    this.source.connect(this.lowFilter);
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  // Pre-warms the audio pipeline and opens stream socket for instant 0ms playback
  public warmUp(streamUrl?: string) {
    try {
      if (!this.isInitialized) {
        this.init();
      }
      if (this.audio && streamUrl) {
        if (!this.audio.src || this.audio.src === window.location.href) {
          this.audio.src = streamUrl;
          this.audio.preload = 'auto';
          this.audio.load();
        }
      }
    } catch (e) {
      console.warn('Warmup notice:', e);
    }
  }

  public getAudioElement() {
    return this.audio;
  }

  public getCurrentTime(): number {
    return this.audio ? this.audio.currentTime || 0 : 0;
  }

  public getDuration(): number {
    if (this.audio && !isNaN(this.audio.duration) && isFinite(this.audio.duration) && this.audio.duration > 0) {
      return this.audio.duration;
    }
    return 0;
  }

  public seek(seconds: number) {
    if (this.audio && !isNaN(seconds) && isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, seconds);
    }
  }

  public getContext() {
    return this.ctx;
  }

  public getAnalyser() {
    return this.analyser;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.dataArray) return new Uint8Array(0);
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.analyser || !this.timeDomainArray) return new Uint8Array(0);
    this.analyser.getByteTimeDomainData(this.timeDomainArray);
    return this.timeDomainArray;
  }

  public setVolume(val: number) {
    // val 0 to 1
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

  public setNitro(active: boolean) {
    if (this.nitroGain && this.ctx) {
      const targetGain = active ? 1.4 : 1.0;
      this.nitroGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }
  }

  public setEqualizer(low: number, mid: number, high: number) {
    if (!this.ctx) return;
    if (this.lowFilter) {
      this.lowFilter.gain.setTargetAtTime(low, this.ctx.currentTime, 0.1);
    }
    if (this.midFilter) {
      this.midFilter.gain.setTargetAtTime(mid, this.ctx.currentTime, 0.1);
    }
    if (this.highFilter) {
      this.highFilter.gain.setTargetAtTime(high, this.ctx.currentTime, 0.1);
    }
  }

  // --- COCKPIT REALISTIC SYNTHESIZED SOUND EFFECTS ---
  public playRevSound() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    // Dual saw oscillators for rich V8 cylinder roar
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    // Start low, rev high, decay down
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.exponentialRampToValueAtTime(240, t + 0.4);
    osc1.frequency.exponentialRampToValueAtTime(80, t + 1.1);

    osc2.frequency.setValueAtTime(68, t);
    osc2.frequency.exponentialRampToValueAtTime(248, t + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(84, t + 1.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
    filter.frequency.exponentialRampToValueAtTime(400, t + 1.1);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.15);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1.2);
    osc2.stop(t + 1.2);
  }

  public playTurboBlowOff() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3500, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.5);
    filter.Q.value = 3.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.6);
  }

  public playNitroBlast() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.5);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.55);

    this.playTurboBlowOff();
  }

  public playCockpitBeep(pitch: number = 880) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.setValueAtTime(pitch * 1.5, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // --- SOM DE TOQUE TÁTIL DE ALTA TECNOLOGIA (COCKPIT TOUCH SOUND) ---
  public playTouchSound(type: 'click' | 'toggle' | 'switch' | 'tick' | 'heavy' = 'click') {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;

    if (type === 'tick') {
      // Pequeno clique tátil de disco rotativo / knob
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.015);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
      return;
    }

    if (type === 'toggle') {
      // Bipe afirmativo duplo e elegante
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.setValueAtTime(1380, t + 0.035);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
      return;
    }

    if (type === 'switch') {
      // Clique de chave mecânica de cockpit automotivo
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.035);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.045);
      return;
    }

    if (type === 'heavy') {
      // Impacto firme de acionamento pesado (Nitro, Overdrive)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(75, t + 0.07);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.085);
      return;
    }

    // Padrão 'click': Micro-toque digital refinado e responsivo
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1150, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.028);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  // --- SOM DE IGNIÇÃO AUTOMOTIVA (STARTER CRANK + VROOOOM) ---
  public playIgnitionSound() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;

    // Etapa 1: Motor de partida girando rápido e agressivo (ch-ch mecânico esportivo)
    const crankOffsets = [0.0, 0.045];
    crankOffsets.forEach((offset, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110 + idx * 25, t + offset);
      osc.frequency.exponentialRampToValueAtTime(220 + idx * 30, t + offset + 0.035);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t + offset);
      filter.Q.value = 2.0;

      gain.gain.setValueAtTime(0.01, t + offset);
      gain.gain.linearRampToValueAtTime(0.28, t + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + offset);
      osc.stop(t + offset + 0.045);
    });

    // Etapa 2: Explosão imediata de combustão e aceleração de partida (VROOOOM!)
    const fireT = t + 0.08;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const roarFilter = this.ctx.createBiquadFilter();
    const roarGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    subOsc.type = 'triangle';

    // Rotação subindo de 95Hz para 340Hz e depois estabilizando na lenta (85Hz)
    osc1.frequency.setValueAtTime(95, fireT);
    osc1.frequency.exponentialRampToValueAtTime(340, fireT + 0.38);
    osc1.frequency.exponentialRampToValueAtTime(88, fireT + 1.25);

    osc2.frequency.setValueAtTime(98, fireT);
    osc2.frequency.exponentialRampToValueAtTime(348, fireT + 0.38);
    osc2.frequency.exponentialRampToValueAtTime(91, fireT + 1.25);

    subOsc.frequency.setValueAtTime(48, fireT);
    subOsc.frequency.exponentialRampToValueAtTime(170, fireT + 0.38);
    subOsc.frequency.exponentialRampToValueAtTime(45, fireT + 1.25);

    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(320, fireT);
    roarFilter.frequency.exponentialRampToValueAtTime(2400, fireT + 0.38);
    roarFilter.frequency.exponentialRampToValueAtTime(480, fireT + 1.25);

    roarGain.gain.setValueAtTime(0.01, fireT);
    roarGain.gain.linearRampToValueAtTime(0.5, fireT + 0.18);
    roarGain.gain.exponentialRampToValueAtTime(0.001, fireT + 1.35);

    osc1.connect(roarFilter);
    osc2.connect(roarFilter);
    subOsc.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.ctx.destination);

    osc1.start(fireT);
    osc2.start(fireT);
    subOsc.start(fireT);
    osc1.stop(fireT + 1.4);
    osc2.stop(fireT + 1.4);
    subOsc.stop(fireT + 1.4);
  }

  // --- SOM DE DESLIGAMENTO DO MOTOR (ENGINE SHUTDOWN) ---
  public playEngineShutdownSound() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.42);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + 0.42);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);

    setTimeout(() => {
      this.playTouchSound('switch');
    }, 250);
  }

  // --- SOM DE CELEBRAÇÃO / CURTIDA NA RÁDIO (HEART CHIME & SPARKLE) ---
  public playCelebrationSound() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;

    // Heart beat "thump-thump"
    const thump = (time: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.1);
    };

    thump(t);
    thump(t + 0.14);

    // Chime chords (sparkle celebrate)
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const noteT = t + 0.08 + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, noteT);
      gain.gain.setValueAtTime(0.12, noteT);
      gain.gain.exponentialRampToValueAtTime(0.001, noteT + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteT);
      osc.stop(noteT + 0.5);
    });
  }

  // --- PLAY RAW PCM (24KHz) FROM GEMINI TTS ---
  public playPcmAudio(base64Audio: string) {
    try {
      if (!this.ctx) this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM little endian
      const int16Array = new Int16Array(bytes.buffer);
      const numSamples = int16Array.length;
      const sampleRate = 24000;

      const audioBuffer = this.ctx.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      const bufferSource = this.ctx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(this.ctx.destination);
      bufferSource.start(0);
    } catch (e) {
      console.warn('Erro ao decodificar áudio PCM Gemini TTS:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
