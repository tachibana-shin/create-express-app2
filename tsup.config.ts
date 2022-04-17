import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  splitting: true,
  sourcemap: !!options.watch,
  minify: !options.watch,
  clean: true,
  format: ["cjs"],
  // format: "cjs",
  target: "node16",
  loader: {
    ".jpg": "base64",
    ".webp": "file",
  },
  external: [],
}));
