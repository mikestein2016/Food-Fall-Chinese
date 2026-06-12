import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { addMatterFrame, setFrame } from "../ui/sprite";
import { makeButton } from "../ui/button";
import {
  wordsForCategory, getHighScore, setHighScore, CATEGORIES, type Word, type Category,
} from "../content/data";
import { playSfx } from "../audio/audio";
import { recognizeOnce, transcriptMatches, type RecognitionHandle } from "../audio/recognition";

const BG = 0x1e50a0;
const DEADLINE_Y = 760; // food past here ends the run (Construct "Deadline")
const SPAWN_X = VIEWPORT.width / 2;

/** Play — falling-food gameplay (ports the Construct "Play" layout + sheet):
 *  a food falls, you tap-to-speak its Chinese name before it crosses the
 *  deadline. Correct clears it and scores; a miss ends the run. */
export class PlayScene extends Phaser.Scene {
  private category!: Category;
  private words: Word[] = [];
  private score = 0;
  private gameOver = false;
  private isStatic = false;

  private current?: Phaser.Physics.Matter.Image;
  private currentWord!: Word;
  private scoreText!: Phaser.GameObjects.Text;
  private speakButton!: Phaser.GameObjects.Image;
  private listening?: RecognitionHandle;

  constructor() {
    super("Play");
  }

  init(data: { categoryId?: string }): void {
    this.category = CATEGORIES.find((c) => c.id === data?.categoryId) ?? CATEGORIES[2];
    this.score = 0;
    this.gameOver = false;
    this.current = undefined;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG);
    this.words = wordsForCategory(this.category.id);
    this.isStatic = new URLSearchParams(location.search).has("static");
    this.matter.world.setGravity(0, this.isStatic ? 0 : 1);

    this.scoreText = this.add
      .text(VIEWPORT.width / 2, 18, "Score: 0", {
        fontFamily: "Arial", fontSize: "24px", color: "#ffffff", fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    makeButton(this, 50, 45, {
      frame: "ButtonBack:Default:0", width: 64, height: 64,
      onClick: () => this.quit(),
    });
    makeButton(this, 435, 45, {
      frame: "ButtonSettings:Default:0", width: 56, height: 56,
      onClick: () => this.scene.start("Settings", {
        returnScene: "Play", returnData: { categoryId: this.category.id },
      }),
    });

    this.speakButton = makeButton(this, VIEWPORT.width / 2, 808, {
      frame: "ButtonRecord:TapToSpeak:0",
      width: 250, height: 76,
      onClick: () => this.startListening(),
    });

    this.spawnFood();
    (window as unknown as { __ready: boolean }).__ready = true;
  }

  private spawnFood(): void {
    this.currentWord = Phaser.Utils.Array.GetRandom(this.words);
    const y = this.isStatic ? 260 : -60;
    this.current = addMatterFrame(this, SPAWN_X, y, this.currentWord.frame, {
      shape: { type: "circle", radius: 36 },
      frictionAir: 0,
    }).setDisplaySize(80, 80);
    this.current.setFixedRotation();
  }

  private startListening(): void {
    if (this.gameOver || !this.current) return;
    setFrame(this.speakButton, "ButtonRecord:Listening:0");
    const done = () => setFrame(this.speakButton, "ButtonRecord:TapToSpeak:0");
    this.listening = recognizeOnce(
      "zh-CN",
      (transcript) => {
        done();
        if (transcriptMatches(transcript, this.currentWord.hanzi)) this.clearFood();
        else playSfx("bite");
      },
      () => done(),
    );
  }

  private clearFood(): void {
    playSfx("correct");
    this.current?.destroy();
    this.current = undefined;
    this.score += 1;
    this.scoreText.setText(`Score: ${this.score}`);
    this.spawnFood();
  }

  update(): void {
    if (this.gameOver || this.isStatic || !this.current) return;
    if (this.current.y > DEADLINE_Y) this.endRun();
  }

  private endRun(): void {
    this.gameOver = true;
    this.listening?.stop();
    this.current?.destroy();
    this.current = undefined;
    setHighScore(this.category, this.score);
    this.showGameOver();
  }

  private showGameOver(): void {
    const cx = VIEWPORT.width / 2;
    this.add.rectangle(cx, VIEWPORT.height / 2, 360, 320, 0x000000, 0.6).setDepth(10);
    this.add
      .text(cx, 320, `Score: ${this.score}`, {
        fontFamily: "Arial", fontSize: "30px", color: "#ffffff", fontStyle: "bold",
      })
      .setOrigin(0.5).setDepth(11);
    this.add
      .text(cx, 360, `High Score: ${getHighScore(this.category)}`, {
        fontFamily: "Arial", fontSize: "20px", color: "#ffffff",
      })
      .setOrigin(0.5).setDepth(11);
    makeButton(this, cx, 430, {
      frame: "ButtonPlay:Default:0", downFrame: "ButtonPlay:Down:0",
      width: 202, height: 72,
      onClick: () => this.scene.restart({ categoryId: this.category.id }),
    }).setDepth(11);
    makeButton(this, cx, 520, {
      frame: "ButtonStudy:Default:0", downFrame: "ButtonStudy:Down:0",
      width: 202, height: 72,
      onClick: () => this.scene.start("Study", { categoryId: this.category.id }),
    }).setDepth(11);
  }

  private quit(): void {
    this.listening?.stop();
    this.scene.start("StageSelect", { categoryId: this.category.id });
  }

  shutdown(): void {
    this.listening?.stop();
  }
}
