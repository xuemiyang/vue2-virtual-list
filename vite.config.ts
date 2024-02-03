import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { resolve } from "path";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig((env) => {
  if (env.mode == "development") {
    return { plugins: [createVuePlugin()] };
  }
  return {
    plugins: [createVuePlugin(), dts({ include: "./src", exclude: "./src/vite-env.d.ts" })],
    build: {
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(__dirname, "src/index.ts"),
        name: "VirtualList",
        fileName: "index",
      },
      rollupOptions: {
        external: ["vue"],
        output: {
          globals: {
            vue: "Vue",
          },
          exports: "named",
        },
      },
    },
  };
});
