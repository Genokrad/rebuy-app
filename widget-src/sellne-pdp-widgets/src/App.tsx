import { useEffect } from "react";
import { useWidgetData } from "./hooks/useWidgetData";
import type { AppProps } from "./types";
import styles from "./App.module.css";
import { ProductsPageWidget } from "./widgets/ProductsPageWidget/ProductsPageWidget";

function App({ blockId }: AppProps) {
  const widgetData = useWidgetData(blockId);

  const { loading, error, products, sellenceWidgetId, widgetId } = widgetData;

  // Когда данные успешно загружены, делаем виджет видимым (display: flex)
  useEffect(() => {
    if (loading || error || !products.length || !sellenceWidgetId) {
      return;
    }

    const widgetContainer = document.querySelector<HTMLElement>(
      `.sellence-widget-${widgetId}`,
    );

    if (widgetContainer) {
      widgetContainer.style.display = "flex";

      const content = widgetContainer.querySelector<HTMLElement>(
        "#sellence-widget-content",
      );

      if (content) {
        content.style.display = "flex";
        content.style.width = "100%";
      }
    }
  }, [loading, error, products.length, sellenceWidgetId, widgetId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p className={styles.errorText}>❌ Ошибка: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No products found</p>
      </div>
    );
  }

  // TODO: В будущем здесь будет выбор виджета на основе widgetType
  // Пока просто рендерим ProductsPageWidget
  return <ProductsPageWidget widgetData={widgetData} />;
}

export default App;
