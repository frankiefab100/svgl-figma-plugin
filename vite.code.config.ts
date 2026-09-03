import { defineConfig } from "vite";
import path from "path";

// Builds ONLY src/plugin/code.ts → dist/code.js
// No React, no HTML, plain JS bundle for the Figma main thread.

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/plugin/code.ts"),
      formats: ["iife"],
      name: "code",
      fileName: () => "code.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    sourcemap: false,
    minify: false,
  },
});
