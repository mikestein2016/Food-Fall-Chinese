import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { outlinedText } from "../ui/text";
import { addFrame, addMatterFrame, setFrame } from "../ui/sprite";

const TITLE_BG = 0x1e50a0; // sampled from the original export

// Falling-food categories shown decoratively on the title (the "Title Food"
// picker in the original). Frame 0 of each food sprite.
const TITLE_FOODS = [
  "Fruit1:Fruit:0", "Fruit2:Default:0", "Meat:Default:0", "Drinks:Default:0",
  "Sweets:Default:0", "Snacks:Default:0", "Breakfast:Default:0",
  "Seafood:Default:0", "Veggies2:Default:0",
];

/** Title Screen — ports the Construct "Title Screen" layout + "Title Sheet". */
export class TitleScene extends Phaser.Scene {
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("Title");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(TITLE_BG);

    outlinedText(this, VIEWPORT.width / 2, 30, "Chinese", { fontSize: 18 });
    outlinedText(this, VIEWPORT.width / 2, 105, "Food Fall", {
      fontSize: 40,
      strokeThickness: 6,
    });

    this.createPlayButton();

    // Decorative falling food, matching the title's physics ambience. Skipped
    // in ?static mode so the harness can take deterministic A/B screenshots.
    const isStatic = new URLSearchParams(location.search).has("static");
    if (!isStatic) {
      this.spawnFood();
      this.spawnTimer = this.time.addEvent({
        delay: 1400,
        loop: true,
        callback: () => this.spawnFood(),
      });
    }

    (window as unknown as { __ready: boolean }).__ready = true;
  }

  private createPlayButton(): void {
    const btn = addFrame(this, VIEWPORT.width / 2, 427, "ButtonPlay:Default:0")
      .setDisplaySize(202, 72)
      .setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => setFrame(btn, "ButtonPlay:Down:0"));
    btn.on("pointerup", () => {
      setFrame(btn, "ButtonPlay:Default:0");
      this.scene.start("StageSelect");
    });
    btn.on("pointerout", () => setFrame(btn, "ButtonPlay:Default:0"));
  }

  private spawnFood(): void {
    const name = Phaser.Utils.Array.GetRandom(TITLE_FOODS);
    const x = Phaser.Math.Between(60, VIEWPORT.width - 60);
    const food = addMatterFrame(this, x, -60, name, {
      shape: { type: "circle", radius: 36 },
    }).setDisplaySize(80, 80);
    food.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));
    food.setFriction(0.005, 0, 0);

    // Despawn once off the bottom.
    this.time.delayedCall(6000, () => food.destroy());
  }

  shutdown(): void {
    this.spawnTimer?.destroy();
  }
}
