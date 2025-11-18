import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useCartLines } from "@shopify/ui-extensions/checkout/preact";
import { useEffect, useState } from "preact/hooks";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // Хуки должны вызываться до любых ранних return'ов
  const cartLines = useCartLines();
  const [widgetData, setWidgetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Получаем настройки из extension
  const widgetId =
    shopify.settings.value.widget_id || "cmi31w59t0000uoi7tcj01tsl";
  const appUrl =
    shopify.settings.value.app_url ||
    "https://injuries-candles-enquiry-formula.trycloudflare.com";

  // Функция для извлечения productId из GID формата
  function extractProductId(gid) {
    if (!gid) return null;
    // Если уже числовой ID, возвращаем как есть
    if (/^\d+$/.test(gid)) return gid;
    // Извлекаем числовой ID из GID формата: gid://shopify/Product/43622958399581
    const match = gid.match(/\/(\d+)$/);
    return match ? match[1] : null;
  }

  // Загружаем данные виджета
  useEffect(() => {
    async function loadWidgetData() {
      // Проверяем необходимые настройки
      if (!widgetId || !appUrl) {
        console.log("Widget ID or App URL not configured");
        return;
      }

      // Проверяем наличие товаров в корзине
      if (!cartLines || cartLines.length === 0) {
        console.log("No items in cart");
        return;
      }

      setLoading(true);
      setError(null);

      // Формируем базовый URL
      const cleanUrl =
        typeof appUrl === "string"
          ? appUrl.replace(/\/$/, "")
          : String(appUrl).replace(/\/$/, "");

      // Перебираем все товары в корзине, пока не найдем товар с childProducts
      for (let i = 0; i < cartLines.length; i++) {
        const cartLine = cartLines[i];

        // Проверяем валидность товара
        if (!cartLine || !cartLine.merchandise) {
          console.log(`Cart line ${i} is invalid, skipping...`);
          continue;
        }

        // Извлекаем productId из текущего товара
        const productId = extractProductId(cartLine.merchandise.product.id);
        if (!productId) {
          console.log(
            `Could not extract product ID from cart line ${i}, skipping...`,
          );
          continue;
        }

        try {
          // Формируем URL запроса
          const apiUrl = `${cleanUrl}/api/widget/${widgetId}?productId=${encodeURIComponent(productId)}`;

          console.log(
            `Checking product ${i + 1}/${cartLines.length} (ID: ${productId})...`,
          );

          // Делаем запрос к API
          const response = await fetch(apiUrl);

          if (!response.ok) {
            console.log(
              `HTTP error for product ${productId}: ${response.status}`,
            );
            // Продолжаем со следующим товаром, если это не критическая ошибка
            if (response.status >= 500) {
              // Серверные ошибки пропускаем, но логируем
              continue;
            }
            continue;
          }

          const data = await response.json();

          // Проверяем успешность ответа и наличие данных виджета
          if (data.success && data.widget && data.widget.product) {
            // Проверяем наличие childProducts и что массив не пустой
            const childProducts = data.widget.product.childProducts;
            if (
              childProducts &&
              Array.isArray(childProducts) &&
              childProducts.length > 0
            ) {
              console.log(
                `Found product with ${childProducts.length} child products!`,
                data,
              );
              setWidgetData(data);
              setLoading(false);
              return; // Останавливаем перебор, так как нашли товар с childProducts
            } else {
              console.log(
                `Product ${productId} has no child products, checking next...`,
              );
              // Продолжаем поиск со следующим товаром
            }
          } else {
            console.log(
              `Product ${productId} not found in widget or invalid response`,
            );
            // Продолжаем поиск со следующим товаром
          }
        } catch (err) {
          console.error(`Error checking product ${productId}:`, err);
          // Продолжаем со следующим товаром при ошибке
          continue;
        }
      }

      // Если дошли до сюда, значит ни у одного товара нет childProducts
      console.log("No products with child products found in cart");
      setWidgetData(null);
      setLoading(false);
    }

    loadWidgetData();
  }, [cartLines, widgetId, appUrl]);

  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!shopify.instructions.value.attributes.canUpdateAttributes) {
    // For checkouts such as draft order invoices, cart attributes may not be allowed
    // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
    return (
      <s-banner heading="checkout-ui" tone="warning">
        {shopify.i18n.translate("attributeChangesAreNotSupported")}
      </s-banner>
    );
  }

  // Если нет настроек, ничего не показываем
  if (!widgetId || !appUrl) {
    return null;
  }

  // Показываем состояние загрузки
  if (loading) {
    return (
      <s-banner heading="checkout-ui">
        <s-text>Loading...</s-text>
      </s-banner>
    );
  }

  // Показываем ошибку, если есть
  if (error) {
    return (
      <s-banner heading="checkout-ui" tone="critical">
        <s-text>Error: {error}</s-text>
      </s-banner>
    );
  }

  // Если загрузка завершена, но данных нет (не найдено товаров с childProducts)
  if (!loading && !widgetData) {
    // Не показываем ничего, если товаров с childProducts не найдено
    return null;
  }

  // 3. Render a UI
  return (
    <s-banner heading="checkout-ui">
      <s-stack gap="base">
        <s-text>
          {shopify.i18n.translate("welcome", {
            target: <s-text type="emphasis">{shopify.extension.target}</s-text>,
          })}
        </s-text>
        {widgetData && widgetData.widget && (
          <s-text>
            Widget: {widgetData.widget.name} - Products found:{" "}
            {widgetData.widget.product?.childProducts?.length || 0}
          </s-text>
        )}
        <s-button onClick={handleClick}>
          {shopify.i18n.translate("addAFreeGiftToMyOrder")}
        </s-button>
      </s-stack>
    </s-banner>
  );

  async function handleClick() {
    // 4. Call the API to modify checkout
    const result = await shopify.applyAttributeChange({
      key: "requestedFreeGift",
      type: "updateAttribute",
      value: "yes",
    });
    console.log("applyAttributeChange result", result);
  }
}
