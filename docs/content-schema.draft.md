# Draft content-JSON schema

Goal: **all game content** — categories, vocabulary, level tuning, screen
layouts, UI strings — lives in deterministic, hand-editable JSON validated by a
TypeScript schema. Code reads content; code contains no hard-coded levels.

Proposed layout under `content/`:

```
content/
  game.json          # global tuning + meta
  categories.json    # the 10 food categories + "random"
  vocabulary.json    # 88 words: hanzi, pinyin, english, audio, image frame
  atlases.json       # sprite-sheet frame rects (generated from data.json)
  layouts/           # one file per screen, generated then hand-tunable
    title.json  stage-select.json  play.json  study.json  settings.json
  strings.json       # UI/display strings (English labels, instructions)
```

### `game.json`
```jsonc
{
  "viewport": { "width": 480, "height": 854 },
  "physics": { "gravity": 1.0, "fallSpeed": 1.0 },   // tunable, names mirror C3 vars
  "play":  { "startLives": 1, "scorePerFood": 1, "deadlineY": 776 },
  "study": { "slowSpeechRate": 0.6, "showWordsDefault": true },
  "speech": { "lang": "zh-CN", "recognitionLang": "zh-CN" },
  "audio": { "sfx": { "correct": "correct.mp3", "bite": "bite.mp3", "switch": "switch.webm" } }
}
```

### `categories.json`
```jsonc
[
  {
    "id": "fruit1",
    "spriteType": "Fruit1",          // Construct object type name
    "icon": "UIFruit",               // UIFood family member
    "displayName": "Fruit",
    "highScoreKey": "zh_HSFruit1",   // existing localStorage key (compat)
    "wordIds": ["pingguo", "xiangjiao", ...],  // resolved during slice
    "unlockedByDefault": true
  }
  // ... 10 categories + { "id": "random", "icon": "UIRandom" }
]
```

### `vocabulary.json` — the learning core
```jsonc
[
  {
    "id": "niurou",
    "hanzi": "牛肉",
    "pinyin": "niú ròu",            // to be authored (not in export)
    "english": "beef",              // to be authored (not in export)
    "audio": "media/牛肉.webm",
    "category": "meat",
    "frame": { "type": "Meat", "anim": "Default", "index": 3 }  // image binding
  }
]
```
> `hanzi` + `audio` come straight from the export. `pinyin`/`english` are
> authored (the export has neither). `frame` is the **food-image binding**
> recovered from the running original (see inventory §5).

### `atlases.json` (generated — never hand-edited)
```jsonc
{
  "shared-0-sheet1": {
    "image": "images/shared-0-sheet1.webp",
    "frames": {
      "Meat:Default:0": { "x": 369, "y": 131, "w": 128, "h": 128, "originX": 0.5, "originY": 0.5 }
    }
  }
}
```

### `layouts/<screen>.json` (generated from data.json, then hand-tunable)
```jsonc
{
  "name": "Stage Select",
  "eventSheet": "Stage Sheet",
  "layers": [
    { "name": "Layer 0", "instances": [
      { "type": "UIFruit", "x": 405, "y": 380, "w": 100, "h": 100, "angle": 0 }
    ]}
  ]
}
```

### `strings.json`
```jsonc
{
  "title.play": "Play",
  "title.study": "Study",
  "study.instructions": "Study and speak to play",
  "settings.hideWords": "Hide words"
  // exact copy recovered from running original where set dynamically
}
```

## TypeScript validation
A `src/content/schema.ts` defines `zod` (or hand-written) types + a
`loadContent()` that fails loudly on malformed JSON, so edits are deterministic
and verifiable. The screenshot harness then confirms a content edit produced the
intended visual/behavioral change.

## Open authoring items (tracked, resolved during the slice)
1. **Food-image ↔ word binding** (`vocabulary[].frame`) — from running original.
2. **pinyin / english** per word — authored; verifiable vs audio + image.
3. Exact **dynamic UI strings** — captured from running original.
