import categoriesJson from "./categories.json";
import vocabularyJson from "./vocabulary.json";

export type Category = {
  id: string;
  spriteType: string;
  anim: string;
  displayName: string;
  highScoreKey: string;
  icon: string;
  iconFrame: string;
  iconSelectedFrame: string;
  wordIds: string[];
};

export type Word = {
  id: string;
  hanzi: string;
  pinyin: string;
  english: string;
  category: string;
  frame: string;
  audio: string;
};

export const CATEGORIES = categoriesJson as Category[];
export const VOCABULARY = vocabularyJson as Word[];

const WORDS_BY_ID = new Map(VOCABULARY.map((w) => [w.id, w]));

export function wordsForCategory(categoryId: string): Word[] {
  return VOCABULARY.filter((w) => w.category === categoryId);
}

export function wordById(id: string): Word | undefined {
  return WORDS_BY_ID.get(id);
}

/** Per-category high score, persisted under the original Construct localStorage
 *  keys (e.g. zh_HSFruit1) so existing player scores carry over. */
export function getHighScore(category: Category): number {
  const raw = localStorage.getItem(category.highScoreKey);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function setHighScore(category: Category, score: number): void {
  if (score > getHighScore(category)) {
    localStorage.setItem(category.highScoreKey, String(score));
  }
}
