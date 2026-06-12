// Loads the real Construct fonts so Phaser text renders identically to the
// original. Construct font name "Donut" -> fonts/donut.ttf.
const FONTS: Array<{ family: string; url: string }> = [
  { family: "Donut", url: "/fonts/donut.ttf" },
  { family: "PaintingWithChocolate", url: "/fonts/painting_with_chocolate.ttf" },
];

/** Resolve once all custom fonts are loaded and ready for canvas rendering. */
export async function loadFonts(): Promise<void> {
  await Promise.all(
    FONTS.map(async ({ family, url }) => {
      const face = new FontFace(family, `url(${url})`);
      await face.load();
      (document.fonts as FontFaceSet).add(face);
    }),
  );
  await document.fonts.ready;
}
