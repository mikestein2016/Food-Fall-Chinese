#!/usr/bin/env python3
"""
Deterministic extractor for the Construct 3 export's data.json.

Construct stores the whole compiled project as one positional (index-based)
array under {"project": [...]}. This script decodes the parts we need for the
Phaser/TS migration and writes clean, human-diffable JSON into ./build/extracted.

It reads ONLY data.json and is idempotent: same input -> identical output.

Field positions below were reverse-engineered from this specific export
(Construct r137-era format). They are documented inline so the mapping is
auditable rather than magic.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build", "extracted")

# Construct plugin ids seen in this project
PLUGIN = {0: "Sprite", 5: "Audio", 6: "Browser", 7: "SpeechRecognition",
          8: "SpeechSynthesis", 9: "Touch", 10: "LocalStorage",
          11: "PlatformInfo", 12: "MobileAdvert", 14: "Text"}


def load():
    with open(os.path.join(ROOT, "data.json"), encoding="utf-8") as f:
        return json.load(f)["project"]


def decode_object_types(P):
    """project[3] -> list of object types.
    OT = [name, pluginId, _, instVarDefs, _, _, _, animations|null, ..., sid(11), ..., localIndex(14), ...]
    """
    types = []
    for i, o in enumerate(P[3]):
        name, plugin = o[0], o[1]
        instvars = [{"sid": v[0], "type": v[1], "name": v[2]} for v in (o[3] or [])]
        anims = decode_animations(o[7]) if (plugin == 0 and o[7]) else None
        types.append({
            "index": i, "name": name, "plugin": PLUGIN.get(plugin, f"plugin{plugin}"),
            "pluginId": plugin, "sid": o[11], "instanceVars": instvars,
            "animations": anims,
        })
    return types


def decode_animations(anim_container):
    """OT[7] -> [ animation, ... ]; animation = [name, speed, loop, repeatCount,
    repeatTo, pingpong, sid, [frame,...]]. frame = [sheet, sheetSid, x, y, w, h,
    rotated?, _, originX, originY, [anchors], [collisionPoly], tag]."""
    out = []
    for a in anim_container:
        frames = []
        for fr in a[7]:
            frames.append({
                "sheet": fr[0], "x": fr[2], "y": fr[3], "w": fr[4], "h": fr[5],
                "originX": fr[8], "originY": fr[9], "tag": fr[12] if len(fr) > 12 else "",
            })
        out.append({"name": a[0], "speed": a[1], "loop": bool(a[2]), "frames": frames})
    return out


def decode_layouts(P, type_names):
    """project[5] -> layouts. Layout = [name,w,h,_,_,sx,sy, eventSheet, sid, layers,...]
    Layer = [name, ..., instances(14), ...].
    Instance = [worldInfo, objTypeIndex, _, anchors, behaviors, pluginData].
    worldInfo = [x, y, zElev, w, h, angle, _, [r,g,b,a], originX, originY, ...]."""
    layouts = []
    for L in P[5]:
        layers = []
        for layer in L[9]:
            insts = []
            for ins in layer[14]:
                wi = ins[0]
                ti = ins[1]
                inst = {
                    "type": type_names[ti] if ti < len(type_names) else f"#{ti}",
                    "typeIndex": ti,
                    "x": wi[0], "y": wi[1], "w": wi[3], "h": wi[4],
                    "angle": wi[5], "originX": wi[8], "originY": wi[9],
                }
                # plugin data: for Text the [0] of last array is the string; for
                # Sprite the last array is [enabled, animName, frame, ...]
                pd = ins[-1] if isinstance(ins[-1], list) else None
                if pd and isinstance(pd, list) and pd and isinstance(pd[0], str):
                    inst["text"] = pd[0]
                insts.append(inst)
            layers.append({"name": layer[0], "instances": insts})
        layouts.append({
            "name": L[0], "width": L[1], "height": L[2],
            "eventSheet": L[7], "layers": layers,
        })
    return layouts


def decode_families(P, type_names):
    return [[type_names[i] for i in fam] for fam in P[4]]


def decode_media(P):
    """project[7] -> [ [name, [[mime, ext, bytes]], _ ], ... ]"""
    out = []
    for m in P[7]:
        enc = m[1][0]
        out.append({"name": m[0], "ext": enc[1], "bytes": enc[2],
                    "file": m[0] + enc[1]})
    return out


def emit_app_content(data):
    """Write generated, app-importable JSON the Phaser code consumes directly.
    Atlas = flat list of frame rects keyed `Type:anim:index` per sheet. Layouts
    are passed through (positions). These are generated artifacts — never edit by
    hand; re-run this script instead."""
    app_dir = os.path.join(ROOT, "app", "src", "content")
    os.makedirs(app_dir, exist_ok=True)

    atlas = {}  # sheet -> { frameName: {x,y,w,h,originX,originY} }
    for t in data["objectTypes"]:
        if not t["animations"]:
            continue
        for a in t["animations"]:
            for i, fr in enumerate(a["frames"]):
                sheet = os.path.splitext(os.path.basename(fr["sheet"]))[0]
                atlas.setdefault(sheet, {})
                name = f'{t["name"]}:{a["name"]}:{i}'
                atlas[sheet][name] = {k: fr[k] for k in ("x", "y", "w", "h", "originX", "originY")}

    sheets = {s: f"images/{s}.webp" for s in atlas}
    with open(os.path.join(app_dir, "atlas.generated.json"), "w", encoding="utf-8") as f:
        json.dump({"sheets": sheets, "frames": atlas}, f, ensure_ascii=False, indent=2)
    with open(os.path.join(app_dir, "layouts.generated.json"), "w", encoding="utf-8") as f:
        json.dump(data["layouts"], f, ensure_ascii=False, indent=2)
    with open(os.path.join(app_dir, "media.generated.json"), "w", encoding="utf-8") as f:
        json.dump(data["media"], f, ensure_ascii=False, indent=2)


def main():
    P = load()
    os.makedirs(OUT, exist_ok=True)
    types = decode_object_types(P)
    type_names = [t["name"] for t in types]
    data = {
        "meta": {
            "name": P[0], "firstLayout": P[1],
            "viewport": {"width": P[10], "height": P[11]},
            "appId": P[38],
        },
        "objectTypes": types,
        "families": decode_families(P, type_names),
        "layouts": decode_layouts(P, type_names),
        "eventSheets": [{"name": e[0]} for e in P[6]],
        "media": decode_media(P),
    }
    for key in ("objectTypes", "families", "layouts", "media", "meta"):
        with open(os.path.join(OUT, f"{key}.json"), "w", encoding="utf-8") as f:
            json.dump(data[key], f, ensure_ascii=False, indent=2)
    # one combined file too
    with open(os.path.join(OUT, "project.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    emit_app_content(data)

    # quick console summary
    sprites = [t for t in types if t["plugin"] == "Sprite"]
    frames = sum(len(a["frames"]) for t in sprites if t["animations"] for a in t["animations"])
    print(f"object types : {len(types)} ({len(sprites)} sprites)")
    print(f"sprite frames: {frames}")
    print(f"layouts      : {len(data['layouts'])} -> {[l['name'] for l in data['layouts']]}")
    print(f"families     : {len(data['families'])}")
    print(f"media        : {len(data['media'])}")
    print(f"written to   : {os.path.relpath(OUT, ROOT)}/")


if __name__ == "__main__":
    main()
