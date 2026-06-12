# Food Fall – Learn Chinese · Migration Inventory

> Step 1 deliverable: what's in this repo, a migration inventory, and a draft
> content-JSON schema. No app code yet. Regenerate the raw facts any time with
> `python3 tools/extract_construct.py` (writes `build/extracted/*.json`).

## 1. What's here: a Construct 3 **export**, no `.c3p`

This is the compiled web export, not the editor source.

| Artifact | Role | Migration disposition |
|---|---|---|
| `data.json` (271 KB) | Whole compiled project as one positional array | **Source of truth for layout/assets**; reverse-engineered by `tools/extract_construct.py` |
| `scripts/c3runtime.js` (1.3 MB), `main.js`, workers | Construct engine | **Drop** (replaced by Phaser) |
| `images/*.webp` (11 sheets) | Sprite atlases | **Keep, reuse as-is** |
| `media/*.webm` (88), `*.mp3` (2), `switch.webm` | Word audio + SFX | **Keep, reuse as-is** |
| `fonts/donut.ttf`, `painting_with_chocolate.ttf` | UI fonts | **Keep, reuse as-is** |
| `icons/*`, `appmanifest.json`, `sw.js`, `style.css` | PWA shell | **Re-derive** from Vite PWA |
| `box2d.wasm`, `opus.wasm*` | Construct's physics + audio decoders | **Drop** — Phaser/Matter.js + native browser webm/opus |

No WASM survives into the new codebase → satisfies the "native web, no compile
black box" goal.

## 2. Project facts

- **Title / id:** "Food Fall - Learn Chinese" · `com.mikesteindesign.foodfallzh`
- **Viewport:** 480 × 854, portrait, fullscreen PWA
- **5 layouts (scenes):** `Loader` → `Title Screen` → `Stage Select` → `Play` / `Study`
- **5 event sheets** (the game logic, ~247 KB of JSON): Play (21 top events),
  Study (18), Stage (22), Title (6), Loader (1)
- **61 object types** (39 sprites + 22 plugin/text)
- **2 families:** `Food` (falling items) and `UIFood` (category icons)
- **91 media:** 88 word-audio clips + `correct.mp3`, `bite.mp3`, `switch.webm`

## 3. Object types

**Falling food (Family `Food`, 10 category sprites, 88 frames total)** — each
frame is one food item; instance var `Destroyable`. Frame counts:
Breakfast 8, Seafood 8, Meat 8, Drinks 10, Fruit1 10, Fruit2 11, Sweets 9,
Snacks 9, Veggies1 7, Veggies2 8.

**Category icons (Family `UIFood`, 11 sprites):** UIBreakfast, UIDrinks,
UIFruit, UIFruit2, UIMeat, UISeafood, UISnacks, UISweets, UIVeggies1,
UIVeggies2, UIRandom.

**UI sprites:** FoodSlider, RecordSpace, SpeakSpace, ButtonBack, Deadline,
UnlockBG, Medal, arrow, ButtonSettings, check, Toggle, OpenMoji, ButtonPlay,
ButtonRecord, ButtonStudy, Donut.

**Text objects (14):** ErrorText, Instructions, TextCategory, TextPlay,
TextPlay2, TextScore, TextSpeech, HighScoreText, FlashingHighScore,
TextLanguage, TextLicense, TextMSD, TextSettings, TextSettingsHideWords.
> Note: TextCategory / TextLanguage / FlashingHighScore appear as **5 stacked
> copies** offset by ±1px — Construct's text-outline trick. Re-implement as one
> stroked text object.

**Non-visual plugins → web replacements:**

| Construct plugin | New implementation |
|---|---|
| Sprite + **Physics** (Box2D) | Phaser + **Matter.js** physics (gravity, falling, collision) |
| Audio (Opus/webm) | Phaser sound / `HTMLAudioElement` (browsers decode webm/opus natively) |
| **SpeechRecognition** | Web Speech API `SpeechRecognition` (zh-CN) |
| **SpeechSynthesis** | Web Speech API `speechSynthesis` (zh-CN) |
| LocalStorage | `localStorage` (keys below) |
| Touch | Phaser pointer input |
| Browser / PlatformInfo | `navigator` / feature checks |
| MobileAdvert (AdMob `ca-app-pub-…/8780025100`) | **Drop** (web build) |

## 4. Game logic recovered from event-sheet variables

- **Play:** physics food falls under `Gravity`/`FallSpeed`; you destroy the
  correct food; vars `Score`, `HighScore`, `Dead`, `FoodDestroyed`,
  `CurrentFood`, `NextFood`, `NextCategory`. SFX `bite`, `correct`, `switch`.
- **Study:** flashcard mode; vars `Target Word`, `English`,
  `EnglishTranslation`, `ShowWords`, `SlowSpeech`, `RandomFoodPicker`,
  speech-recognition check.
- **Stage Select:** draggable slider of category icons (`Slider`, `Pin`,
  DragDrop); per-category unlock + high score in LocalStorage keys
  `zh_HSFruit1, zh_HSFruit2, zh_HSVeggies1, zh_HSVeggies2, zh_HSMeat,
  zh_HSSeafood, zh_HSDrinks, zh_HSBreakfast, zh_HSSnacks, zh_HSSweets,
  zh_HSRandom`.
- **Settings:** toggles incl. "hide words", language.

## 5. ⚠️ The one thing not in static data: food-image ↔ Chinese-word binding

- The 88 Chinese words exist **only as media filenames** (e.g. `牛肉.webm`).
- Sprite frame tags are empty; **zero CJK appears in the event sheets**.
- Media is globally Unicode-sorted, **not** grouped by category, so there is no
  trivial frame-index → word-index mapping.

→ The exact "this steak frame = 牛肉" pairing is **runtime behavior** and must be
recovered by **running the original export** and observing which word is
spoken/shown for each food frame. This is the first job of the verification
harness in the vertical slice, and the result becomes the authored
`vocabulary` data in the content JSON. (Visual frame thumbnails + the word list
make this auditable.)

## 6. Proposed migration order

1. **(this doc)** inventory + schema ✅
2. Scaffold Vite + Phaser + TS; wire real assets; headless-screenshot harness
   that can also drive the **original** export for A/B reference.
3. Vertical slice: **Study** screen for ONE category (smallest self-contained
   loop: show food + word, speak, check) — recover the word binding for that
   category, A/B vs original.
4. Port remaining screens (Title → Stage Select → Play → Settings) incrementally,
   each screenshot-verified against the original.
5. Commit/push each increment.
