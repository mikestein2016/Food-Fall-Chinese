import Phaser from "phaser";

/**
 * Construct draws outlined UI text by stacking 5 copies of a Text object (four
 * black, offset; one white on top). We collapse that into a single Phaser Text
 * with a stroke — same look, one object. Defaults match the project's "Donut"
 * white-on-black title style.
 */
export function outlinedText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: {
    fontSize: number;
    fontFamily?: string;
    color?: string;
    stroke?: string;
    strokeThickness?: number;
    origin?: number;
  },
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: opts.fontFamily ?? "Donut",
    fontSize: `${opts.fontSize}px`,
    color: opts.color ?? "#ffffff",
    stroke: opts.stroke ?? "#000000",
    strokeThickness: opts.strokeThickness ?? Math.max(3, Math.round(opts.fontSize * 0.12)),
  });
  t.setOrigin(opts.origin ?? 0.5);
  return t;
}
