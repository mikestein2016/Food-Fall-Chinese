import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { outlinedText } from "../ui/text";
import { makeButton } from "../ui/button";

/** Stub — the Study (flashcard + speech) loop is ported next. */
export class StudyScene extends Phaser.Scene {
  private categoryId = "fruit1";

  constructor() {
    super("Study");
  }

  init(data: { categoryId?: string }): void {
    if (data?.categoryId) this.categoryId = data.categoryId;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1e50a0);
    outlinedText(this, VIEWPORT.width / 2, 120, "Study", { fontSize: 36 });
    outlinedText(this, VIEWPORT.width / 2, 170, this.categoryId, { fontSize: 18 }).setAlpha(0.85);
    makeButton(this, 50, 45, {
      frame: "ButtonBack:Default:0", width: 64, height: 64,
      onClick: () => this.scene.start("StageSelect"),
    });
    (window as unknown as { __ready: boolean }).__ready = true;
  }
}
