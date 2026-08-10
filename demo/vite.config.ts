import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: '/thin-render/',
  plugins: [react()],
  resolve: {
    // Develop against the library source, not the built dist: changes to
    // src/ hot-reload without a rebuild, and vite never serves a stale
    // pre-bundled copy of the linked `thin-render` package.
    alias: {
      "thin-render": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
    preserveSymlinks: true,
  },
});
