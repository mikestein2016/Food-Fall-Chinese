import Phaser from "phaser";
import { VIEWPORT, BACKGROUND_COLOR } from "./config";
import { BootScene } from "./scenes/BootScene";

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
  scene: [BootScene],
};

// Expose the game instance so the verification harness can introspect state.
const game = new Phaser.Game(config);
(window as unknown as { game: Phaser.Game }).game = game;
