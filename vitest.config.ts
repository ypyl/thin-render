import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const root = process.cwd();
// Vite's import analysis rejects backslash paths on Windows; normalize.
const p = (rel: string) => resolve(root, rel).replace(/\\/g, "/");

export default defineConfig({
  resolve: {
    alias: {
      // Demo tests exercise the library source, not the built dist.
      "thin-render": p("src/index.ts"),
      // Demo and library files resolve to different node_modules trees; pin one
      // React instance so hooks/contexts don't mismatch across copies.
      // Order matters: subpath keys must precede their prefix keys (vite
      // aliases are prefix-replace).
      "react-dom/client": p("node_modules/react-dom/client.js"),
      "react/jsx-runtime": p("node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": p("node_modules/react/jsx-dev-runtime.js"),
      react: p("node_modules/react/index.js"),
      "react-dom": p("node_modules/react-dom/index.js"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "demo/src/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.test.ts", "src/spec.ts", "src/index.ts", "demo/**"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
