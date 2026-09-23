import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le SDK Power Apps impose le port 3000.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  base: "./",
});
