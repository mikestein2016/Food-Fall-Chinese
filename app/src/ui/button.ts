import Phaser from "phaser";
import { addFrame, setFrame } from "./sprite";

/**
 * A sprite button with optional pressed-frame feedback and a click callback.
 * Handles Construct's rotated frames transparently (via addFrame/setFrame).
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: {
    frame: string;
    downFrame?: string;
    width?: number;
    height?: number;
    onClick: () => void;
  },
): Phaser.GameObjects.Image {
  const img = addFrame(scene, x, y, opts.frame).setInteractive({ useHandCursor: true });
  if (opts.width && opts.height) img.setDisplaySize(opts.width, opts.height);

  const reset = () => setFrame(img, opts.frame);
  img.on("pointerdown", () => opts.downFrame && setFrame(img, opts.downFrame));
  img.on("pointerout", reset);
  img.on("pointerup", () => {
    reset();
    opts.onClick();
  });
  return img;
}
