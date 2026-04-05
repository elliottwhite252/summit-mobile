import { Audio } from "expo-av";

// Expo-av doesn't support oscillator synthesis like Web Audio API.
// We'll use a lightweight approach: generate tiny WAV buffers in-memory.

const SAMPLE_RATE = 22050;

function createWav(samples: Float32Array): string {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * 0x7fff, true);
  }

  // Convert to base64 data URI
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

function square(t: number, freq: number): number {
  return Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
}

function sine(t: number, freq: number): number {
  return Math.sin(2 * Math.PI * freq * t);
}

function noise(): number {
  return Math.random() * 2 - 1;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function generateSound(type: string): Float32Array {
  switch (type) {
    case "jump": {
      const dur = 0.1;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const freq = lerp(280, 560, t / dur);
        const env = 1 - t / dur;
        samples[i] = square(t, freq) * env * 0.3;
      }
      return samples;
    }
    case "walljump": {
      const dur = 0.12;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const p = t / dur;
        const freq = p < 0.5 ? lerp(200, 600, p * 2) : lerp(600, 400, (p - 0.5) * 2);
        const env = 1 - p;
        samples[i] = square(t, freq) * env * 0.3;
      }
      return samples;
    }
    case "dash": {
      const dur = 0.15;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const env = 1 - t / dur;
        samples[i] = (noise() * 0.3 + sine(t, lerp(150, 80, t / dur)) * 0.2) * env;
      }
      return samples;
    }
    case "death": {
      const dur = 0.3;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const env = 1 - t / dur;
        const freq = lerp(400, 80, t / dur);
        samples[i] = (square(t, freq) * 0.3 + noise() * 0.15) * env;
      }
      return samples;
    }
    case "strawberry": {
      const dur = 0.4;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      const notes = [523, 659, 784, 1047];
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const noteIdx = Math.min(Math.floor(t / dur * notes.length), notes.length - 1);
        const env = 1 - t / dur;
        samples[i] = sine(t, notes[noteIdx]) * env * 0.3;
      }
      return samples;
    }
    case "spring": {
      const dur = 0.2;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const p = t / dur;
        const freq = p < 0.6 ? lerp(200, 800, p / 0.6) : lerp(800, 400, (p - 0.6) / 0.4);
        const env = 1 - p;
        samples[i] = sine(t, freq) * env * 0.35;
      }
      return samples;
    }
    case "land": {
      const dur = 0.06;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const env = 1 - t / dur;
        samples[i] = sine(t, lerp(120, 60, t / dur)) * env * 0.2;
      }
      return samples;
    }
    case "crumble": {
      const dur = 0.2;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const env = 1 - t / dur;
        samples[i] = noise() * env * 0.25;
      }
      return samples;
    }
    case "roomenter": {
      const dur = 0.35;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      const notes = [440, 554, 659];
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const noteIdx = Math.min(Math.floor(t / dur * notes.length), notes.length - 1);
        const env = 1 - t / dur;
        samples[i] = sine(t, notes[noteIdx]) * env * 0.2;
      }
      return samples;
    }
    case "win": {
      const dur = 1.0;
      const samples = new Float32Array(Math.floor(SAMPLE_RATE * dur));
      const notes = [523, 659, 784, 1047, 784, 1047];
      const noteDur = dur / notes.length;
      for (let i = 0; i < samples.length; i++) {
        const t = i / SAMPLE_RATE;
        const noteIdx = Math.min(Math.floor(t / noteDur), notes.length - 1);
        const env = Math.max(0, 1 - t / dur);
        samples[i] = (square(t, notes[noteIdx]) * 0.15 + sine(t, notes[noteIdx] * 0.5) * 0.1) * env;
      }
      return samples;
    }
    default: {
      return new Float32Array(100);
    }
  }
}

// ─── Chiptune BGM Generator (I–V–vi–IV in C major) ──────────────────────────
function triangle(t: number, freq: number): number {
  const p = (t * freq) % 1;
  return 4 * Math.abs(p - 0.5) - 1;
}

function generateBGM(): Float32Array {
  const BPM = 120;
  const beatDur = 60 / BPM; // 0.5s
  const barDur = beatDur * 4; // 2s
  const loopDur = barDur * 4; // 8s
  const totalSamples = Math.floor(SAMPLE_RATE * loopDur);
  const samples = new Float32Array(totalSamples);

  // Chords: I=C, V=G, vi=Am, IV=F
  const chords = [
    { root: 131, notes: [262, 330, 392] },   // C
    { root: 98,  notes: [196, 247, 294] },    // G
    { root: 110, notes: [220, 262, 330] },    // Am
    { root: 87,  notes: [175, 220, 262] },    // F
  ];

  const melodies = [
    [523, 659, 784, 659, 523, 784, 659, 523],
    [392, 494, 587, 494, 784, 587, 494, 392],
    [659, 523, 440, 523, 659, 523, 440, 330],
    [349, 440, 523, 440, 349, 523, 440, 349],
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const barIdx = Math.floor(t / barDur) % 4;
    const barT = t - barIdx * barDur;
    const chord = chords[barIdx];
    const melody = melodies[barIdx];

    let sample = 0;

    // Bass (triangle wave)
    sample += triangle(t, chord.root) * 0.08;

    // Arpeggio (square wave, 8th notes)
    const eighthIdx = Math.floor(barT / (beatDur / 2)) % 8;
    const arpFreq = chord.notes[eighthIdx % chord.notes.length];
    const arpEnv = 1 - ((barT % (beatDur / 2)) / (beatDur / 2));
    sample += square(t, arpFreq) * arpEnv * 0.03;

    // Melody (square wave, 8th notes)
    const melFreq = melody[eighthIdx];
    const melEnv = 1 - ((barT % (beatDur / 2)) / (beatDur / 2));
    sample += square(t, melFreq) * melEnv * 0.04;

    // Kick on beats 1 and 3
    const beatInBar = Math.floor(barT / beatDur);
    if (beatInBar % 2 === 0) {
      const kickT = barT - beatInBar * beatDur;
      if (kickT < 0.1) {
        const kickFreq = lerp(150, 40, kickT / 0.1);
        sample += sine(kickT, kickFreq) * (1 - kickT / 0.1) * 0.1;
      }
    }

    // Hi-hat on every 8th note
    const hatT = barT % (beatDur / 2);
    if (hatT < 0.03) {
      sample += noise() * (1 - hatT / 0.03) * (eighthIdx % 2 === 0 ? 0.03 : 0.015);
    }

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  return samples;
}

// ─── Mute settings ──────────────────────────────────────────────────────────
export let sfxMuted = false;
export let musicMuted = false;

export function setSfxMuted(val: boolean) { sfxMuted = val; }
export function setMusicMuted(val: boolean) { musicMuted = val; }

// Pre-generate and cache sounds
const soundCache: Record<string, Audio.Sound | null> = {};
const soundUris: Record<string, string> = {};
let bgmUri: string | null = null;
let bgmSound: Audio.Sound | null = null;
let bgmPlaying = false;

const SOUND_TYPES = ["jump", "walljump", "dash", "death", "strawberry", "spring", "land", "crumble", "roomenter", "win"];

export async function preloadSounds(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  for (const type of SOUND_TYPES) {
    try {
      const samples = generateSound(type);
      soundUris[type] = createWav(samples);
    } catch {
      // Silently skip
    }
  }

  // Generate BGM
  try {
    const bgmSamples = generateBGM();
    bgmUri = createWav(bgmSamples);
  } catch {
    // Silently skip
  }
}

export async function playSfx(type: string): Promise<void> {
  if (sfxMuted) return;
  try {
    const uri = soundUris[type];
    if (!uri) return;

    if (soundCache[type]) {
      await soundCache[type]!.unloadAsync().catch(() => {});
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );
    soundCache[type] = sound;
  } catch {
    // Audio not available
  }
}

export async function startBGM(): Promise<void> {
  if (bgmPlaying || !bgmUri || musicMuted) return;
  try {
    if (bgmSound) {
      await bgmSound.unloadAsync().catch(() => {});
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: bgmUri },
      { shouldPlay: true, isLooping: true, volume: 0.5 }
    );
    bgmSound = sound;
    bgmPlaying = true;
  } catch {
    // Audio not available
  }
}

export async function stopBGM(): Promise<void> {
  if (!bgmPlaying || !bgmSound) return;
  try {
    await bgmSound.stopAsync();
    await bgmSound.unloadAsync();
  } catch {
    // ignore
  }
  bgmSound = null;
  bgmPlaying = false;
}
