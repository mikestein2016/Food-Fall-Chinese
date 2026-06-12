import { defineConfig } from "vite";
import { resolve } from "node:path";

// The app lives in app/ with index.html there. Real Construct assets
// (images/media/fonts) are exposed via symlinks under app/public so their
// served paths match the original export exactly (/images/..., /media/...).
export default defineConfig({
  root: "app",
  publicDir: "public",
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: "es2022",
    // Stable (un-hashed) names so the committed root deploy overwrites cleanly.
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  server: {
    port: 5173,
    fs: { allow: [resolve(__dirname)] },
  },
});
