import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";

// Множество для отслеживания уже инициализированных виджетов
const initializedWidgets = new Set<string>();

// Функция для инициализации одного виджета
function initWidget(blockId: string, container: HTMLElement) {
  if (initializedWidgets.has(blockId)) {
    return;
  }

  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App blockId={blockId} />
      </StrictMode>,
    );
    initializedWidgets.add(blockId);
  } catch (error) {
    // Silent fail
  }
}

// Функция для поиска и инициализации всех виджетов на странице
function initAllWidgets() {
  const configs = (window as any).SELLENCE_WIDGET_CONFIGS;

  if (!configs) {
    return;
  }

  // Ищем все контейнеры с ID, начинающимся с "for-react-render-"
  const containers = document.querySelectorAll('[id^="for-react-render-"]');

  containers.forEach((container) => {
    const containerId = container.id;
    // Извлекаем blockId из ID контейнера (формат: "for-react-render-{blockId}")
    const blockId = containerId.replace("for-react-render-", "");

    // Проверяем, что конфиг для этого блока существует
    if (configs[blockId] && !initializedWidgets.has(blockId)) {
      initWidget(blockId, container as HTMLElement);
    }
  });
}

// Функция для проверки наличия контейнеров с повторными попытками
function initWidgetsWithRetry(retries = 10, delay = 100) {
  const configs = (window as any).SELLENCE_WIDGET_CONFIGS;

  if (configs && Object.keys(configs).length > 0) {
    initAllWidgets();
    // Проверяем, все ли виджеты инициализированы
    const allInitialized = Object.keys(configs).every((blockId) =>
      initializedWidgets.has(blockId),
    );

    if (!allInitialized && retries > 0) {
      setTimeout(() => initWidgetsWithRetry(retries - 1, delay), delay);
    }
  } else if (retries > 0) {
    setTimeout(() => initWidgetsWithRetry(retries - 1, delay), delay);
  }
}

// Инициализируем при загрузке DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initWidgetsWithRetry();
  });
} else {
  // DOM уже загружен, но контейнеры могут еще не быть созданы
  initWidgetsWithRetry();
}

// Экспорт для глобального использования (если нужно вызывать вручную)
if (typeof window !== "undefined") {
  (window as any).SellnePDPWidgets = {
    init: initAllWidgets,
  };
}
