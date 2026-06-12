import type { Word } from "../content/data";

// Word pronunciations and SFX are plain web audio (browsers decode the
// Construct .webm/.mp3 natively) — no Phaser preload needed.
const SFX = {
  correct: "media/correct.mp3",
  bite: "media/bite.mp3",
  switch: "media/switch.webm",
} as const;

const cache = new Map<string, HTMLAudioElement>();

function get(url: string): HTMLAudioElement {
  let a = cache.get(url);
  if (!a) {
    a = new Audio(url);
    cache.set(url, a);
  }
  return a;
}

export function playWordAudio(word: Word): void {
  const a = get(word.audio);
  a.currentTime = 0;
  void a.play().catch(() => undefined);
}

export function playSfx(name: keyof typeof SFX): void {
  const a = get(SFX[name]);
  a.currentTime = 0;
  void a.play().catch(() => undefined);
}

/** Speak text with the browser's TTS (used as a fallback / slow-speech mode). */
export function speak(text: string, opts: { lang?: string; rate?: number } = {}): void {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang ?? "zh-CN";
  u.rate = opts.rate ?? 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
