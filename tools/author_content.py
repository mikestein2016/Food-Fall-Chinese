#!/usr/bin/env python3
"""
Author the learning content (vocabulary + categories) and validate it against
the extracted atlas frames and the media audio files, so the food-image -> word
binding is auditable and provably complete.

The hanzi/pinyin/english below were authored by visually identifying every food
frame (see build/screenshots/cat_*.png) and matching it to the recorded word
whose audio filename is that hanzi. Run this script to (re)emit:
  app/src/content/vocabulary.json
  app/src/content/categories.json
It hard-fails if any frame name is unknown, any audio file is missing, or any
of the 88 words is unused or used twice.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "app", "src", "content")

# category id, sprite type, animation, display name, localStorage high-score key, UI icon type
CATEGORIES = [
    ("breakfast", "Breakfast", "Default", "Breakfast", "zh_HSBreakfast", "UIBreakfast"),
    ("drinks",    "Drinks",    "Default", "Drinks",    "zh_HSDrinks",   "UIDrinks"),
    ("fruit1",    "Fruit1",    "Fruit",   "Fruit 1",   "zh_HSFruit1",   "UIFruit"),
    ("fruit2",    "Fruit2",    "Default", "Fruit 2",   "zh_HSFruit2",   "UIFruit2"),
    ("meat",      "Meat",      "Default", "Meat",      "zh_HSMeat",     "UIMeat"),
    ("seafood",   "Seafood",   "Default", "Seafood",   "zh_HSSeafood",  "UISeafood"),
    ("snacks",    "Snacks",    "Default", "Snacks",    "zh_HSSnacks",   "UISnacks"),
    ("sweets",    "Sweets",    "Default", "Sweets",    "zh_HSSweets",   "UISweets"),
    ("veggies1",  "Veggies1",  "Default", "Vegetables 1","zh_HSVeggies1", "UIVeggies1"),
    ("veggies2",  "Veggies2",  "Default", "Vegetables 2","zh_HSVeggies2","UIVeggies2"),
]

# category id -> ordered [(frame index, hanzi, pinyin, english)]
WORDS = {
    "breakfast": [
        (0, "薄煎饼", "báo jiān bǐng", "pancake"),
        (1, "威化饼", "wēi huà bǐng", "wafer"),
        (2, "熏肉", "xūn ròu", "bacon"),
        (3, "牛油", "niú yóu", "butter"),
        (4, "奶酪", "nǎi lào", "cheese"),
        (5, "鸡蛋", "jī dàn", "egg"),
        (6, "面包", "miàn bāo", "bread"),
        (7, "蜂蜜", "fēng mì", "honey"),
    ],
    "drinks": [
        (0, "果汁", "guǒ zhī", "juice"),
        (1, "啤酒", "pí jiǔ", "beer"),
        (2, "香槟酒", "xiāng bīn jiǔ", "champagne"),
        (3, "鸡尾酒", "jī wěi jiǔ", "cocktail"),
        (4, "咖啡", "kā fēi", "coffee"),
        (5, "牛奶", "niú nǎi", "milk"),
        (6, "可乐", "kě lè", "cola"),
        (7, "绿茶", "lǜ chá", "green tea"),
        (8, "水", "shuǐ", "water"),
        (9, "葡萄酒", "pú táo jiǔ", "wine"),
    ],
    "fruit1": [
        (0, "苹果", "píng guǒ", "apple"),
        (1, "橘子", "jú zi", "orange"),
        (2, "香蕉", "xiāng jiāo", "banana"),
        (3, "草莓", "cǎo méi", "strawberry"),
        (4, "蓝莓", "lán méi", "blueberry"),
        (5, "梨子", "lí zi", "pear"),
        (6, "桃子", "táo zi", "peach"),
        (7, "西瓜", "xī guā", "watermelon"),
        (8, "芒果", "máng guǒ", "mango"),
        (9, "葡萄", "pú táo", "grape"),
    ],
    "fruit2": [
        (0, "瓜", "guā", "melon"),
        (1, "柠檬", "níng méng", "lemon"),
        (2, "椰子", "yē zi", "coconut"),
        (3, "樱桃", "yīng táo", "cherry"),
        (4, "牛油果", "niú yóu guǒ", "avocado"),
        (5, "猕猴桃", "mí hóu táo", "kiwi"),
        (6, "橄榄", "gǎn lǎn", "olive"),
        (7, "菠萝", "bō luó", "pineapple"),
        (8, "石榴", "shí liú", "pomegranate"),
        (9, "覆盆子", "fù pén zǐ", "raspberry"),
        (10, "番茄", "fān qié", "tomato"),
    ],
    "meat": [
        (0, "牛肉", "niú ròu", "beef"),
        (1, "猪肉", "zhū ròu", "pork"),
        (2, "鸡肉", "jī ròu", "chicken"),
        (3, "火鸡肉", "huǒ jī ròu", "turkey"),
        (4, "鸭肉", "yā ròu", "duck"),
        (5, "山羊肉", "shān yáng ròu", "goat"),
        (6, "羊肉", "yáng ròu", "lamb"),
        (7, "兔肉", "tù ròu", "rabbit"),
    ],
    "seafood": [
        (0, "鱼", "yú", "fish"),
        (1, "虾", "xiā", "shrimp"),
        (2, "螃蟹", "páng xiè", "crab"),
        (3, "龙虾", "lóng xiā", "lobster"),
        (4, "章鱼", "zhāng yú", "octopus"),
        (5, "牡蛎", "mǔ lì", "oyster"),
        (6, "鱿鱼", "yóu yú", "squid"),
        (7, "乌龟", "wū guī", "turtle"),
    ],
    "snacks": [
        (0, "汉堡包", "hàn bǎo bāo", "hamburger"),
        (1, "炸薯条", "zhá shǔ tiáo", "french fries"),
        (2, "热狗", "rè gǒu", "hot dog"),
        (3, "面条", "miàn tiáo", "noodles"),
        (4, "比萨", "bǐ sà", "pizza"),
        (5, "爆米花", "bào mǐ huā", "popcorn"),
        (6, "椒盐卷饼", "jiāo yán juǎn bǐng", "pretzel"),
        (7, "三明治", "sān míng zhì", "sandwich"),
        (8, "寿司", "shòu sī", "sushi"),
    ],
    "sweets": [
        (0, "甜甜圈", "tián tián quān", "donut"),
        (1, "杯形饼", "bēi xíng bǐng", "cupcake"),
        (2, "糖果", "táng guǒ", "candy"),
        (3, "蛋糕", "dàn gāo", "cake"),
        (4, "巧克力", "qiǎo kè lì", "chocolate"),
        (5, "冰淇淋", "bīng qí lín", "ice cream"),
        (6, "棒糖", "bàng táng", "lollipop"),
        (7, "饼干", "bǐng gān", "cookie"),
        (8, "馅饼", "xiàn bǐng", "pie"),
    ],
    "veggies1": [
        (0, "西兰花", "xī lán huā", "broccoli"),
        (1, "胡萝卜", "hú luó bo", "carrot"),
        (2, "玉米", "yù mǐ", "corn"),
        (3, "黄瓜", "huáng guā", "cucumber"),
        (4, "洋葱", "yáng cōng", "onion"),
        (5, "土豆", "tǔ dòu", "potato"),
        (6, "辣椒", "là jiāo", "chili pepper"),
    ],
    "veggies2": [
        (0, "蘑菇", "mó gu", "mushroom"),
        (1, "大蒜", "dà suàn", "garlic"),
        (2, "茄子", "qié zi", "eggplant"),
        (3, "仙人掌", "xiān rén zhǎng", "cactus"),
        (4, "生菜", "shēng cài", "lettuce"),
        (5, "花生", "huā shēng", "peanut"),
        (6, "米饭", "mǐ fàn", "rice"),
        (7, "薯", "shǔ", "sweet potato"),
    ],
}


def slug(pinyin):
    return "".join(c for c in pinyin.replace(" ", "") if c.isascii() and c.isalpha())


def main():
    atlas = json.load(open(os.path.join(CONTENT, "atlas.generated.json"), encoding="utf-8"))
    frame_index = atlas["index"]
    media = {m["name"] for m in json.load(open(os.path.join(CONTENT, "media.generated.json"), encoding="utf-8"))}

    anim_of = {c[0]: (c[1], c[2]) for c in CATEGORIES}
    vocab, used_words, errors = [], [], []

    for cat_id, words in WORDS.items():
        sprite, anim = anim_of[cat_id]
        for index, hanzi, pinyin, english in words:
            frame = f"{sprite}:{anim}:{index}"
            if frame not in frame_index:
                errors.append(f"unknown frame {frame}")
            if hanzi not in media:
                errors.append(f"no audio for {hanzi}")
            used_words.append(hanzi)
            vocab.append({
                "id": f"{cat_id}_{slug(pinyin)}",
                "hanzi": hanzi, "pinyin": pinyin, "english": english,
                "category": cat_id, "frame": frame,
                "audio": f"media/{hanzi}.webm",
            })

    word_files = {w for w in media if w not in ("correct", "bite", "switch")}
    missing = word_files - set(used_words)
    dupes = [w for w in used_words if used_words.count(w) > 1]
    if missing:
        errors.append(f"unused words: {sorted(missing)}")
    if dupes:
        errors.append(f"duplicate words: {sorted(set(dupes))}")
    if errors:
        raise SystemExit("CONTENT VALIDATION FAILED:\n  " + "\n  ".join(errors))

    def icon_frames(ui_type):
        # each UI icon has frame :0 (idle) and usually :1 (selected); anim varies
        frames = sorted(f for f in frame_index if f.startswith(ui_type + ":"))
        if not frames:
            errors.append(f"no icon frames for {ui_type}")
        return frames

    categories = []
    for c in CATEGORIES:
        frames = icon_frames(c[5])
        categories.append({
            "id": c[0], "spriteType": c[1], "anim": c[2], "displayName": c[3],
            "highScoreKey": c[4], "icon": c[5],
            "iconFrame": frames[0] if frames else None,
            "iconSelectedFrame": frames[1] if len(frames) > 1 else (frames[0] if frames else None),
            "wordIds": [v["id"] for v in vocab if v["category"] == c[0]],
        })
    if errors:
        raise SystemExit("CONTENT VALIDATION FAILED:\n  " + "\n  ".join(errors))

    with open(os.path.join(CONTENT, "vocabulary.json"), "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False, indent=2)
    with open(os.path.join(CONTENT, "categories.json"), "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)
    print(f"OK: {len(vocab)} words across {len(categories)} categories, all frames + audio verified")


if __name__ == "__main__":
    main()
