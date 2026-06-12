import Phaser from "phaser";
import { VIEWPORT, BACKGROUND_COLOR } from "./config";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { StageSelectScene } from "./scenes/StageSelectScene";
import { StudyScene } from "./scenes/StudyScene";
import { PlayScene } from "./scenes/PlayScene";
import { SettingsScene } from "./scenes/SettingsScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: VIEWPORT.width,
  height: VIEWPORT.height,
  backgroundColor: BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "matter",
    matter: { gravity: { x: 0, y: 1 }, debug: false },
  },
  scene: [BootScene, TitleScene, StageSelectScene, StudyScene, PlayScene, SettingsScene],
};

// Expose the game instance so the verification harness can introspect state.
const game = new Phaser.Game(config);
(window as unknown as { game: Phaser.Game }).game = game;

// Register the offline service worker (skipped under the ?static harness so
// cached assets never make screenshots non-deterministic).
if ("serviceWorker" in navigator && !new URLSearchParams(location.search).has("static")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => undefined);
  });
}
