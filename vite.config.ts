import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

// Two separate build configs are needed:
//   1. UI build  → dist/index.html  (React app, fully inlined via singlefile)
//   2. Code build → dist/code.js    (Figma main thread, plain JS)
//
// Run: vite build          → builds UI
//      vite build --config vite.code.config.ts → builds code.ts
//
// Both are triggered by the "build" npm script via a shell command.

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(), // inlines ALL js+css into the html — Figma-safe
  ],
  root: path.resolve(__dirname, "src/ui"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "src/ui/index.html"),
    },
    // singlefile needs these off
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    reportCompressedSize: false,
  },
});
