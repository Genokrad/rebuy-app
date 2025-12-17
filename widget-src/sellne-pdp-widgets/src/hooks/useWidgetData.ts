import { useState, useEffect } from "react";
import {
  buildProductsFromVariants,
  type Product,
} from "../utils/buildProducts";
import type {
  WidgetConfig,
  UseWidgetDataResult,
  WidgetSettings,
} from "../types";

export function useWidgetData(blockId: string): UseWidgetDataResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);

  // Получаем конфигурацию из объекта конфигов по blockId
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configs = (window as any).SELLENCE_WIDGET_CONFIGS;

    if (!configs || !configs[blockId]) {
      // Повторяем попытку через небольшую задержку
      const timer = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retryConfigs = (window as any).SELLENCE_WIDGET_CONFIGS;
        if (retryConfigs && retryConfigs[blockId]) {
          const widgetConfig = retryConfigs[blockId];
          console.log(widgetConfig, "<<<<<====== widgetConfig");
          setConfig({
            widgetId: widgetConfig.widgetId || "",
            appUrl: widgetConfig.appUrl || "",
            currentProductId: widgetConfig.productId || "",
            currentMarketplace: widgetConfig.marketplace || "",
            shopId: widgetConfig.shopId || null,
            sellenceWidgetId: widgetConfig.sellenceWidgetId || undefined,
            shop: widgetConfig.shop || undefined,
            widgetType: widgetConfig.widgetType || "products-page",
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }

    const widgetConfig = configs[blockId];
    setConfig({
      widgetId: widgetConfig.widgetId || "",
      appUrl: widgetConfig.appUrl || "",
      currentProductId: widgetConfig.productId || "",
      currentMarketplace: widgetConfig.marketplace || "",
      shopId: widgetConfig.shopId || null,
      sellenceWidgetId: widgetConfig.sellenceWidgetId || undefined,
      shop: widgetConfig.shop || undefined,
      widgetType: widgetConfig.widgetType || "products-page",
    });
  }, [blockId]);

  // Загружаем данные виджета
  useEffect(() => {
    if (
      !config ||
      !config.widgetId ||
      !config.appUrl ||
      !config.currentProductId
    ) {
      return;
    }

    let isMounted = true;

    async function loadWidget() {
      if (!config) return;

      try {
        const cleanUrl = config.appUrl.replace(/\/$/, "");
        const apiUrl = `${cleanUrl}/api/widget/${config.widgetId}?productId=${encodeURIComponent(
          config.currentProductId,
        )}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("data =====>>>>>", data);

        if (isMounted) {
          // Обрабатываем продукты через buildProductsFromVariants
          if (data?.widget?.product?.childProducts && config) {
            const processedProducts = buildProductsFromVariants(
              data.widget.product.childProducts,
              config.currentMarketplace,
            );
            setProducts(processedProducts);
          }

          // Сохраняем настройки виджета
          if (data?.widget?.settings) {
            setSettings(data.widget.settings);
          }

          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }

    loadWidget();

    return () => {
      isMounted = false;
    };
  }, [config]);

  return {
    products,
    loading,
    error,
    settings,
    currentMarketplace: config?.currentMarketplace || "",
    shopId: config?.shopId || null,
    widgetId: config?.widgetId || "",
    appUrl: config?.appUrl || "",
    currentProductId: config?.currentProductId || "",
    sellenceWidgetId: config?.sellenceWidgetId,
    shop: config?.shop,
    widgetType: config?.widgetType || "products-page",
  };
}
