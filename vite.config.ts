import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "https://paley.art",
        changeOrigin: true,
        secure: true, // если сертификат нормальный, можно true
      },
    },
  },
});