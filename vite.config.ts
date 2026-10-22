import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "apps/public-web",
  plugins: [react()],
  publicDir: "../../public",
  build: {
    outDir: "../../dist/public",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes("/phaser/") ? "phaser" : undefined),
      },
    },
  },
});
