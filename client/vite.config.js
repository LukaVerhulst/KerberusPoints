import { defineConfig, loadEnv } from "vite";
import process from "node:process";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.DEV_BACKEND_URL || "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
  };
});
