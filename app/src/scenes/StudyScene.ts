import Phaser from "phaser";
import { VIEWPORT } from "../config";
import { addFrame, setFrame } from "../ui/sprite";
import { makeButton } from "../ui/button";
import { wordsForCategory, type Word } from "../content/data";
import { playWordAudio, playSfx, speak } from "../audio/audio";
import { recognizeOnce, transcriptMatches, type RecognitionHandle } from "../audio/recognition";

const BG = 0x1e50a0;

/** Study (flashcard) — ports the Construct "Study" layout + "Study Sheet":
 *  show hanzi + pinyin + food, tap to hear, swipe/arrows to navigate, and
 *  tap-to-speak speech recognition to check pronunciation. */
export class StudyScene extends Phaser.Scene {
  private categoryId = "fruit1";
  private words: Word[] = [];
  private index = 0;
  private listening?: RecognitionHandle;

  private hanziText!: Phaser.GameObjects.Text;
  private pinyinText!: Phaser.GameObjects.Text;
  private foodImage!: Phaser.GameObjects.Image;
  private speakButton!: Phaser.GameObjects.Image;

  constructor() {
    super("Study");
  }

  init(data: { categoryId?: string }): void {
    if (data?.categoryId) this.categoryId = data.categoryId;
    this.index = 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG);
    this.words = wordsForCategory(this.categoryId);

    this.hanziText = this.add
      .text(VIEWPORT.width / 2, 200, "", {
        fontFamily: "Arial", fontSize: "64px", color: "#ffffff",
      })
      .setOrigin(0.5);
    this.pinyinText = this.add
      .text(VIEWPORT.width / 2, 250, "", {
        fontFamily: "Arial", fontSize: "26px", color: "#ffffff",
      })
      .setOrigin(0.5);

    // Tapping the word/food hears the pronunciation.
    this.foodImage = addFrame(this, VIEWPORT.width / 2, 380, this.words[0].frame)
      .setDisplaySize(150, 150)
      .setInteractive({ useHandCursor: true });
    this.foodImage.on("pointerup", () => this.hearWord());
    this.hanziText.setInteractive({ useHandCursor: true }).on("pointerup", () => this.hearWord());

    // Prev / next arrows.
    addFrame(this, 50, 377, "arrow:Default:0")
      .setFlipX(true)
      .setDisplaySize(50, 50)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.navigate(-1));
    addFrame(this, 430, 377, "arrow:Default:0")
      .setDisplaySize(50, 50)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.navigate(1));

    this.add
      .text(VIEWPORT.width / 2, 503, "Tap to hear the word", {
        fontFamily: "Arial", fontSize: "22px", color: "#ffffff",
      })
      .setOrigin(0.5);

    this.speakButton = makeButton(this, VIEWPORT.width / 2, 624, {
      frame: "ButtonRecord:TapToSpeak:0",
      width: 250, height: 76,
      onClick: () => this.startListening(),
    });

    makeButton(this, 50, 45, {
      frame: "ButtonBack:Default:0", width: 64, height: 64,
      onClick: () => this.scene.start("StageSelect", { categoryId: this.categoryId }),
    });
    makeButton(this, 435, 45, {
      frame: "ButtonSettings:Default:0", width: 56, height: 56,
      onClick: () => undefined,
    });

    this.showWord();
    (window as unknown as { __ready: boolean }).__ready = true;
  }

  private current(): Word {
    return this.words[this.index];
  }

  private showWord(): void {
    const w = this.current();
    this.hanziText.setText(w.hanzi);
    this.pinyinText.setText(w.pinyin);
    setFrame(this.foodImage, w.frame);
    this.foodImage.setDisplaySize(150, 150);
  }

  private navigate(delta: number): void {
    this.listening?.stop();
    this.index = Phaser.Math.Wrap(this.index + delta, 0, this.words.length);
    playSfx("switch");
    this.showWord();
  }

  private hearWord(): void {
    const w = this.current();
    playWordAudio(w);
    speak(w.hanzi); // TTS fallback if the recording is unavailable
  }

  private startListening(): void {
    setFrame(this.speakButton, "ButtonRecord:Listening:0");
    const done = () => setFrame(this.speakButton, "ButtonRecord:TapToSpeak:0");
    this.listening = recognizeOnce(
      "zh-CN",
      (transcript) => {
        done();
        if (transcriptMatches(transcript, this.current().hanzi)) {
          playSfx("correct");
          this.time.delayedCall(700, () => this.navigate(1));
        } else {
          playSfx("bite");
        }
      },
      () => done(),
    );
  }

  shutdown(): void {
    this.listening?.stop();
  }
}
