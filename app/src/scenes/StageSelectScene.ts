import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { outlinedText } from "../ui/text";

/** Stub — ported next. Lets the Title PLAY button transition somewhere real. */
export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super("StageSelect");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1e50a0);
    outlinedText(this, VIEWPORT.width / 2, 120, "Stage Select", { fontSize: 28 });
    outlinedText(this, VIEWPORT.width / 2, VIEWPORT.height / 2, "(coming next)", {
      fontSize: 16,
    }).setAlpha(0.8);
  }
}
