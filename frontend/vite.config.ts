import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { floorplanFigmaPan } from "./vite-plugins/floorplanFigmaPan";

export default defineConfig({
  plugins: [floorplanFigmaPan(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@store": path.resolve(__dirname, "src/store"),
      "@assets": path.resolve(__dirname, "src/assets"),
      // 3D: трекпад двумя пальцами = pan (как в 2D-редакторе)
      "three/examples/jsm/controls/OrbitControls.js": path.resolve(
        __dirname,
        "src/vendor/OrbitControls.js",
      ),
    },
  },
  optimizeDeps: {
    // Let our transform patch the wheel handler before prebundle
    exclude: ["@jbaysolutions/floorplan-elements"],
    include: [
      "@jbaysolutions/floorplan-react",
      "@jbaysolutions/floorplan-react/3d",
      "@jbaysolutions/floorplan-pack-office/3d",
      "three",
      "three/examples/jsm/controls/OrbitControls.js",
    ],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
