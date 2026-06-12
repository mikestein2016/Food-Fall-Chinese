import Phaser from "phaser";
import { sheetOf, isRotated } from "../content/atlas";

/**
 * Resolve a Construct frame name (`Type:anim:index`) to the Phaser
 * (textureKey, frameKey) pair. Rotated frames are baked into their own upright
 * texture at boot (see normalizeRotatedFrames), so they carry no frame key.
 */
export function textureFor(frameName: string): { key: string; frame?: string } {
  if (isRotated(frameName)) return { key: frameName };
  return { key: sheetOf(frameName) ?? frameName, frame: frameName };
}

/** Add a static image for a Construct frame, rotation handled transparently. */
export function addFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  frameName: string,
): Phaser.GameObjects.Image {
  const { key, frame } = textureFor(frameName);
  return scene.add.image(x, y, key, frame);
}

/** Add a Matter physics image for a Construct frame. */
export function addMatterFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  frameName: string,
  config?: Phaser.Types.Physics.Matter.MatterBodyConfig,
): Phaser.Physics.Matter.Image {
  const { key, frame } = textureFor(frameName);
  return scene.matter.add.image(x, y, key, frame, config);
}

/** Swap the displayed frame on an existing image (e.g. button up/down). */
export function setFrame(image: Phaser.GameObjects.Image, frameName: string): void {
  const { key, frame } = textureFor(frameName);
  image.setTexture(key, frame);
}
