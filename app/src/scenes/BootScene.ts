import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { preloadSheets, registerFrames, sheetOf } from "../content/atlas";

/**
 * Smoke-test scene proving the asset pipeline end to end: load the real
 * Construct .webp atlases, register the extracted frame rects, and render a few
 * frames. Replaced screen-by-screen as scenes are ported. Sets
 * `window.__ready` so the verification harness knows rendering finished.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    preloadSheets(this.load);
  }

  create(): void {
    registerFrames(this.textures);

    this.add
      .text(VIEWPORT.width / 2, 60, "FOOD FALL", {
        fontFamily: "Arial",
        fontSize: "40px",
        color: "#ffd24a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(VIEWPORT.width / 2, 100, "asset pipeline smoke test", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // A grid of one frame from each food category, proving real frames render.
    const samples = [
      "Breakfast:Default:0", "Drinks:Default:0", "Fruit1:Fruit:0",
      "Fruit2:Default:0", "Meat:Default:0", "Seafood:Default:0",
      "Snacks:Default:0", "Sweets:Default:0", "Veggies2:Default:0",
    ];
    const cols = 3;
    samples.forEach((name, i) => {
      const sheet = sheetOf(name);
      if (!sheet) return;
      const x = 90 + (i % cols) * 150;
      const y = 220 + Math.floor(i / cols) * 150;
      this.add.image(x, y, sheet, name).setDisplaySize(110, 110);
      this.add
        .text(x, y + 70, name.split(":")[0], {
          fontFamily: "Arial", fontSize: "13px", color: "#cccccc",
        })
        .setOrigin(0.5);
    });

    (window as unknown as { __ready: boolean }).__ready = true;
  }
}
