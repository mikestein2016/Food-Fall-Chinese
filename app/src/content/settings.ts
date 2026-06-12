// Player settings, persisted to localStorage. Mirrors the original's three
// Settings toggles. Read by Study/Play to alter behaviour.
export type Settings = {
  soundEffects: boolean;
  showPinyin: boolean;
  tapToSeeWords: boolean; // "test your memory" — hide the word until tapped
};

const KEY = "ff_settings";
const DEFAULTS: Settings = { soundEffects: true, showPinyin: true, tapToSeeWords: false };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
