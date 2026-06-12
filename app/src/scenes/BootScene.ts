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
    preloadSheets(this.load);
    this.add
      .text(VIEWPORT.width / 2, VIEWPORT.height / 2, "Loading…", {
        fontFamily: "Arial", fontSize: "18px", color: "#ffffff",
      })
      .setOrigin(0.5);
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
