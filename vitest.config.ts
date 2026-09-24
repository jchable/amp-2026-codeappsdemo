import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, ".worktrees/**"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Vitest 2 renvoie sinon une chaîne vide pour tout import `.css?raw`, ce qui ferait passer tous les scans de
    // gouvernance à vide ; le test-garde de gouvernance.test.ts protège contre un retour de ce piège.
    css: { include: [/\.css\?raw$/] },
  },
});
