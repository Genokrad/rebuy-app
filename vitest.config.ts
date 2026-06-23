import { defineConfig } from "vitest/config";

// Standalone test config — intentionally does NOT load the Remix vite plugin
// (vite.config.ts), so unit tests run in a plain Node environment without the
// app server/HMR machinery.
export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.{test,spec}.{ts,tsx}"],
  },
});
