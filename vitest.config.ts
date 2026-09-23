import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, ".worktrees/**"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
