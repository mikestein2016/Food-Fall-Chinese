import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { outlinedText } from "../ui/text";
import { addFrame } from "../ui/sprite";
import { makeButton } from "../ui/button";
import { CATEGORIES, getHighScore, type Category } from "../content/data";

const BG = 0x1e50a0;
const SLOT_SPACING = 165; // matches the Construct slider icon spacing
const ICON_Y = 380;
const ICON_SIZE = 150;
const UNLOCK_SCORE = 10000; // "Score 10,000 points on X to unlock the next level"

// Carousel order taken from the original "Stage Select" slider x-positions.
const ORDER = [
  "fruit1", "fruit2", "veggies1", "veggies2", "meat",
  "seafood", "drinks", "breakfast", "snacks", "sweets",
];

/** Stage Select — swipeable category carousel with the original's progressive
 *  unlock (each category unlocks once the previous scores >= 10,000). */
export class StageSelectScene extends Phaser.Scene {
  private categories: Category[] = [];
  private selected = 0;
  private track!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private studyButton!: Phaser.GameObjects.Image;
  private playButton!: Phaser.GameObjects.Image;

  constructor() {
    super("StageSelect");
  }

  init(data: { categoryId?: string }): void {
    const order = data?.categoryId ? ORDER.indexOf(data.categoryId) : 0;
    this.selected = order >= 0 ? order : 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG);
    this.categories = ORDER.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean);

    this.titleText = outlinedText(this, VIEWPORT.width / 2, 170, "", {
      fontSize: 40, strokeThickness: 6,
    });
    this.highScoreText = this.add
      .text(VIEWPORT.width / 2, 231, "", {
        fontFamily: "Arial", fontSize: "20px", color: "#ffffff",
      })
      .setOrigin(0.5);

    this.buildCarousel();

    this.instructionText = this.add
      .text(VIEWPORT.width / 2, 485, "", {
        fontFamily: "Arial", fontSize: "20px", color: "#ffffff", align: "center",
      })
      .setOrigin(0.5);

    this.studyButton = makeButton(this, VIEWPORT.width / 2, 575, {
      frame: "ButtonStudy:Default:0", downFrame: "ButtonStudy:Down:0",
      width: 202, height: 72,
      onClick: () => this.scene.start("Study", { categoryId: this.current().id }),
    });
    this.playButton = makeButton(this, VIEWPORT.width / 2, 675, {
      frame: "ButtonPlay:Default:0", downFrame: "ButtonPlay:Down:0",
      width: 202, height: 72,
      onClick: () => this.scene.start("Play", { categoryId: this.current().id }),
    });

    makeButton(this, 50, 45, {
      frame: "ButtonBack:Default:0", width: 64, height: 64,
      onClick: () => this.scene.start("Title"),
    });
    makeButton(this, 435, 45, {
      frame: "ButtonSettings:Default:0", width: 56, height: 56,
      onClick: () => this.scene.start("Settings", {
        returnScene: "StageSelect", returnData: { categoryId: this.current().id },
      }),
    });

    this.setupSwipe();
    this.refresh(false);
    (window as unknown as { __ready: boolean }).__ready = true;
  }

  private buildCarousel(): void {
    this.track = this.add.container(0, 0);
    this.categories.forEach((cat, i) => {
      if (this.isUnlocked(i)) {
        const icon = addFrame(this, i * SLOT_SPACING, ICON_Y, cat.iconFrame)
          .setDisplaySize(ICON_SIZE, ICON_SIZE);
        this.track.add(icon);
      } else {
        // Locked categories render a padlock (original uses the OpenMoji 🔒).
        const lock = this.add
          .text(i * SLOT_SPACING, ICON_Y, "🔒", { fontSize: "96px" })
          .setOrigin(0.5);
        this.track.add(lock);
      }
    });
  }

  private isUnlocked(index: number): boolean {
    if (index === 0) return true;
    return getHighScore(this.categories[index - 1]) >= UNLOCK_SCORE;
  }

  private setupSwipe(): void {
    let startX = 0;
    let dragging = false;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      dragging = true;
      startX = p.x;
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      dragging = false;
      const dx = p.x - startX;
      if (dx < -40) this.move(1);
      else if (dx > 40) this.move(-1);
    });
  }

  private move(delta: number): void {
    const next = Phaser.Math.Clamp(this.selected + delta, 0, this.categories.length - 1);
    if (next === this.selected) return;
    this.selected = next;
    this.refresh(true);
  }

  private current(): Category {
    return this.categories[this.selected];
  }

  private refresh(animate: boolean): void {
    const cat = this.current();
    const unlocked = this.isUnlocked(this.selected);

    this.titleText.setText(unlocked ? cat.displayName : "???");
    this.highScoreText.setText(`High Score: ${getHighScore(cat)}`);
    this.studyButton.setVisible(unlocked);
    this.playButton.setVisible(unlocked);
    if (unlocked) {
      this.instructionText.setText("Swipe to select a category.");
    } else {
      const prev = this.categories[this.selected - 1];
      this.instructionText.setText(
        `Score ${UNLOCK_SCORE.toLocaleString()} points on ${prev.displayName}\nto unlock the next level`,
      );
    }

    const targetX = VIEWPORT.width / 2 - this.selected * SLOT_SPACING;
    if (animate) {
      this.tweens.add({ targets: this.track, x: targetX, duration: 220, ease: "Cubic.out" });
    } else {
      this.track.x = targetX;
    }
  }
}
