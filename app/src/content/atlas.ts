import Phaser from "phaser";
import atlasData from "./atlas.generated.json";

type Frame = { x: number; y: number; w: number; h: number; originX: number; originY: number };
type AtlasData = {
  sheets: Record<string, string>;
  frames: Record<string, Record<string, Frame>>;
};

const ATLAS = atlasData as AtlasData;

/** Queue every Construct sprite-sheet image for loading. */
export function preloadSheets(load: Phaser.Loader.LoaderPlugin): void {
  for (const [sheet, path] of Object.entries(ATLAS.sheets)) {
    load.image(sheet, path);
  }
}

/**
 * Register the extracted frame rects onto their loaded sheet textures so frames
 * are addressable as `Type:anim:index` (e.g. "Meat:Default:0"). Mirrors how
 * Construct packed multiple object types into shared atlases.
 */
export function registerFrames(textures: Phaser.Textures.TextureManager): void {
  for (const [sheet, frames] of Object.entries(ATLAS.frames)) {
    const texture = textures.get(sheet);
    if (!texture) continue;
    for (const [name, fr] of Object.entries(frames)) {
      if (texture.has(name)) continue;
      texture.add(name, 0, fr.x, fr.y, fr.w, fr.h);
    }
  }
}

/** Origin (0..1) for a registered frame, as authored in Construct. */
export function frameOrigin(type: string, anim: string, index: number): { x: number; y: number } {
  for (const frames of Object.values(ATLAS.frames)) {
    const fr = frames[`${type}:${anim}:${index}`];
    if (fr) return { x: fr.originX, y: fr.originY };
  }
  return { x: 0.5, y: 0.5 };
}

/** Which loaded sheet texture holds a given frame name. */
export function sheetOf(frameName: string): string | undefined {
  for (const [sheet, frames] of Object.entries(ATLAS.frames)) {
    if (frames[frameName]) return sheet;
  }
  return undefined;
}
