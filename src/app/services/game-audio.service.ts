import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameAudioService {
  private audioCtx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isMuted = false;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }

  playCash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    [987.77, 1318.51, 1975.53].forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  playChemicalBubble() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    const baseFreq = 200 + Math.random() * 300;
    osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 400, this.audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.12);
  }

  playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * 1.5;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 1.5);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    noise.start();
    noise.stop(this.audioCtx.currentTime + 1.5);
  }

  playGunshot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.2);
  }

  startSiren() {
    if (this.sirenOsc || this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    this.sirenOsc = this.audioCtx.createOscillator();
    this.sirenGain = this.audioCtx.createGain();
    this.sirenOsc.type = 'sawtooth';
    const lfo = this.audioCtx.createOscillator();
    const lfoGain = this.audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.5, this.audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(300, this.audioCtx.currentTime);
    this.sirenOsc.frequency.setValueAtTime(650, this.audioCtx.currentTime);
    lfo.connect(this.sirenOsc.frequency);
    this.sirenGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.audioCtx.destination);
    this.sirenOsc.start();
    lfo.start();
  }

  stopSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {
        console.debug('Audio stop siren');
      }
      this.sirenOsc = null;
    }
  }

  setEngineSound(speedRatio: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    if (speedRatio <= 0.05) {
      if (this.engineGain) {
        this.engineGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      }
      return;
    }
    if (!this.engineOsc) {
      this.engineOsc = this.audioCtx.createOscillator();
      this.engineGain = this.audioCtx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.audioCtx.destination);
      this.engineOsc.start();
    }
    const freq = 45 + speedRatio * 180;
    this.engineOsc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    this.engineGain?.gain.setValueAtTime(Math.min(0.08, 0.02 + speedRatio * 0.06), this.audioCtx.currentTime);
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        console.debug('Audio stop engine');
      }
      this.engineOsc = null;
    }
  }

  playHeisenbergThemeStab() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    [130.81, 155.56, 196.00].forEach((freq) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopEngine();
      this.stopSiren();
    }
    return this.isMuted;
  }
}
