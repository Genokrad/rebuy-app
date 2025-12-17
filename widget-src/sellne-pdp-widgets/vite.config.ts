import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Заменяем process.env.NODE_ENV на строку для браузера
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
  },
  build: {
    // Собираем в assets директорию extension
    outDir: path.resolve(__dirname, "../../extensions/sellence-widget/assets"),
    emptyOutDir: false, // Не удалять другие файлы в assets
    lib: {
      entry: path.resolve(__dirname, "src/main.tsx"),
      name: "SellnePDPWidgets",
      fileName: "pdp-widgets-bundle",
      formats: ["iife"], // IIFE формат для использования в браузере
    },
    rollupOptions: {
      output: {
        // Все в один файл
        inlineDynamicImports: true,
        // Глобальное имя для доступа из window
        name: "SellnePDPWidgets",
        // Расширение .js (Shopify требует .js)
        entryFileNames: "pdp-widgets-bundle.js",
        // Формат IIFE
        format: "iife",
        // Экспортируем все в window.SellnePDPWidgets
        extend: true,
      },
      external: [], // Не исключаем зависимости, они будут включены в bundle
    },
    // Минификация для продакшена (использует esbuild по умолчанию)
    minify: true,
    sourcemap: false,
  },
});
