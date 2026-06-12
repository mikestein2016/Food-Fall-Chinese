# Food Fall — Learn Chinese

A vocabulary game (study + speak to play) rebuilt as a **pure-code, AI-friendly**
web app: **Phaser 3 + TypeScript + Vite**, deployed as a static site. No game
engine editor, no WASM — plain-text source, all content in editable JSON, plus a
headless screenshot harness so changes can be made *and* verified automatically.

This is a migration of a Construct 3 export (the original lives at the repo root:
`index.html`, `scripts/c3runtime.js`, `data.json`, `images/`, `media/`). The new
app is in `app/`; the original is kept as the behavioral A/B reference.

## Commands

```bash
npm install
npm run dev        # Vite dev server (the new app)
npm run build      # typecheck + production build -> dist/
npm run verify     # headless-screenshot every scene; --ab also shoots the original
npm run extract    # regenerate atlas/layout/media JSON from data.json
```

`python3 tools/author_content.py` regenerates and validates the vocabulary.

## Layout

```
app/
  index.html, src/main.ts        # Phaser game bootstrap (scene list, PWA)
  src/scenes/                    # Boot, Title, StageSelect, Study, Play, Settings
  src/ui/                        # text (outlined), sprite (rotation-safe), button
  src/audio/                     # native audio + Web Speech recognition/synthesis
  src/content/                   # generated atlas/layouts + authored vocab/categories/settings
  public/                        # symlinks to the real images/media/fonts/icons + manifest/sw
harness/verify.ts                # headless Chromium screenshot + A/B harness
tools/extract_construct.py       # data.json -> clean JSON (deterministic)
tools/author_content.py          # authored vocabulary, validated against assets
build/extracted/                 # human-readable decoded project data
```

## Content is data, not code

- **`app/src/content/vocabulary.json`** — 88 words: `hanzi`, `pinyin`, `english`,
  `category`, sprite `frame`, `audio`. Edit via `tools/author_content.py`, which
  fails unless every frame and audio file exists and all words are used once.
- **`app/src/content/categories.json`** — the 10 categories, icons, unlock keys.
- **`*.generated.json`** — produced by `tools/extract_construct.py`; never edit by
  hand, re-run the extractor.

Frames are addressed as `Type:anim:index` (e.g. `Meat:Default:0`). The extractor
emits TexturePacker atlases; the 7 frames Construct packed rotated are baked
upright at boot (`normalizeRotatedFrames`).

## Verification harness

`npm run verify` boots the app headless, jumps to each scene
(`?scene=StageSelect&category=fruit1`), waits for `window.__ready`, and writes
`build/screenshots/new-*.png`. `?static` disables nondeterministic spawning. With
`--ab` it also serves and screenshots the original Construct export for
side-by-side comparison.

## Deploy

`.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages on push
to the migration branch. **Requires** repo *Settings → Pages → Source =
"GitHub Actions"*.

## What runs natively (was a Construct plugin)

| Original | Now |
|---|---|
| Box2D physics | Matter.js (Phaser built-in) |
| Audio (Opus/webm) | `HTMLAudioElement` (native decode) |
| SpeechRecognition / SpeechSynthesis | Web Speech API (`zh-CN`) |
| LocalStorage plugin | `localStorage` (original `zh_HS*` score keys) |
| Touch | Phaser pointer input |
