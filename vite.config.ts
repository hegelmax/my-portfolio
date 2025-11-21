import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://paley.hgl.mx",
        changeOrigin: true,
        secure: true, // если сертификат нормальный, можно true
      },
    },
  },
});
