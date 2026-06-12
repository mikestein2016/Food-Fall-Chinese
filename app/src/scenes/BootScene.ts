import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { preloadSheets, normalizeRotatedFrames } from "../content/atlas";
import { loadFonts } from "../content/fonts";

/**
 * Preloader: loads the real Construct .webp atlases + fonts, registers the
 * extracted frame rects, then hands off to the Title scene. Sets
 * `window.__ready` once the first real scene is up for the verification harness.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(0x1e50a0);
    const cx = VIEWPORT.width / 2;
    const cy = VIEWPORT.height / 2;

    this.add
      .text(cx, cy - 60, "FOOD FALL", {
        fontFamily: "Arial", fontSize: "28px", color: "#ffffff", fontStyle: "bold",
      })
      .setOrigin(0.5);

    const barW = 280;
    this.add.rectangle(cx, cy, barW, 18, 0x000000, 0.35).setStrokeStyle(2, 0xffffff);
    const fill = this.add.rectangle(cx - barW / 2 + 2, cy, 0, 12, 0xa6d83a).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => fill.setSize((barW - 4) * p, 12));

    preloadSheets(this.load);
  }

  create(): void {
    normalizeRotatedFrames(this.textures);
    loadFonts()
      .catch(() => undefined) // fonts are cosmetic; never block boot
      .then(() => {
        // ?scene=StageSelect&category=fruit1 jumps straight to a screen so the
        // verification harness can A/B any scene deterministically.
        const params = new URLSearchParams(location.search);
        const scene = params.get("scene") ?? "Title";
        const categoryId = params.get("category") ?? undefined;
        this.scene.start(scene, categoryId ? { categoryId } : undefined);
      });
  }
}
