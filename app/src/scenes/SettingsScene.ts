import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { outlinedText } from "../ui/text";
import { addFrame, setFrame } from "../ui/sprite";
import { loadSettings, saveSettings, type Settings } from "../content/settings";

const BG = 0x1e50a0;

type Row = { key: keyof Settings; label: string; y: number };
const ROWS: Row[] = [
  { key: "soundEffects", label: "Sound Effects", y: 176 },
  { key: "showPinyin", label: "Show Pīnyīn", y: 276 },
  { key: "tapToSeeWords", label: "Tap to see words\n(test your memory)", y: 376 },
];

/** Settings overlay — ports the Construct "Settings" layer: three toggles plus
 *  an Apply (check) button. Returns to whichever scene opened it. */
export class SettingsScene extends Phaser.Scene {
  private settings!: Settings;
  private returnScene = "StageSelect";
  private returnData: Record<string, unknown> = {};
  private toggles = new Map<keyof Settings, Phaser.GameObjects.Image>();

  constructor() {
    super("Settings");
  }

  init(data: { returnScene?: string; returnData?: Record<string, unknown> }): void {
    if (data?.returnScene) this.returnScene = data.returnScene;
    this.returnData = data?.returnData ?? {};
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG);
    this.settings = loadSettings();

    outlinedText(this, VIEWPORT.width / 2, 100, "Settings", { fontSize: 40, strokeThickness: 6 });

    for (const row of ROWS) {
      this.add
        .text(85, row.y, row.label, {
          fontFamily: "Arial", fontSize: "22px", color: "#ffffff", align: "left",
        })
        .setOrigin(0, 0.5);
      const toggle = addFrame(this, 368, row.y, this.toggleFrame(this.settings[row.key]))
        .setDisplaySize(72, 36)
        .setInteractive({ useHandCursor: true });
      toggle.on("pointerup", () => this.flip(row.key));
      this.toggles.set(row.key, toggle);
    }

    const apply = addFrame(this, VIEWPORT.width / 2, 605, "check:Default:0")
      .setDisplaySize(90, 90)
      .setInteractive({ useHandCursor: true });
    apply.on("pointerup", () => this.apply());
    this.add
      .text(VIEWPORT.width / 2, 663, "Apply", {
        fontFamily: "Arial", fontSize: "24px", color: "#ffffff",
      })
      .setOrigin(0.5);

    (window as unknown as { __ready: boolean }).__ready = true;
  }

  private toggleFrame(on: boolean): string {
    return on ? "Toggle:Default:1" : "Toggle:Default:0";
  }

  private flip(key: keyof Settings): void {
    this.settings[key] = !this.settings[key];
    setFrame(this.toggles.get(key)!, this.toggleFrame(this.settings[key]));
  }

  private apply(): void {
    saveSettings(this.settings);
    this.scene.start(this.returnScene, this.returnData);
  }
}
