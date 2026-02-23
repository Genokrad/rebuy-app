import "@shopify/ui-extensions/preact";
import { render } from "preact";
import {
  useCartLines,
  useDiscountCodes,
  useShop,
} from "@shopify/ui-extensions/checkout/preact";
import { useEffect, useState, useRef } from "preact/hooks";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body);
};

const WIDGET_ID_FOR_CHECKOUT_APP = "cmjbgas460000uo5u16xoc2x8";
const URL_FOR_CHECKOUT_APP =
  " https://fcc-marketplace-advertisement-contributor.trycloudflare.com";

function Extension() {
  // Хуки должны вызываться до любых ранних return'ов
  const cartLines = useCartLines();
  const discountCodes = useDiscountCodes();
  const [widgetData, setWidgetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingProducts, setAddingProducts] = useState(new Set());
  const [cartLinesVariantIds, setCartLinesVariantIds] = useState([]);
  const [slideCount, setSlideCount] = useState(0);
  const shopInfo = useShop();
  // Используем useRef для отслеживания последнего сохраненного значения без триггера перерендера
  const lastSavedDiscountCodesRef = useRef(null);

  useEffect(() => {
    const variantIds = cartLines.map((line) => line.merchandise.id);
    setCartLinesVariantIds(variantIds);
  }, [cartLines]);

  // Сохраняем настройку applyDiscountToEntireOrder в атрибут корзины для Cart Transform Function
  useEffect(() => {
    const updateApplyDiscountToEntireOrderAttribute = async () => {
      if (!widgetData?.widget?.settings?.applyDiscountToEntireOrder) {
        // Если настройка выключена или не существует, удаляем атрибут
        try {
          const result = await shopify.applyAttributeChange({
            type: "removeAttribute",
            key: "_sellence_apply_discount_to_entire_order",
          });
          if (result.type === "success") {
            console.log("✅ Removed apply discount to entire order attribute");
          }
        } catch (error) {
          console.error(
            "Error removing apply discount to entire order attribute:",
            error,
          );
        }
        return;
      }

      // Если настройка включена, устанавливаем атрибут
      try {
        const result = await shopify.applyAttributeChange({
          type: "updateAttribute",
          key: "_sellence_apply_discount_to_entire_order",
          value: "true",
        });
        if (result.type === "success") {
          console.log("✅ Set apply discount to entire order attribute: true");
        } else {
          console.error(
            "Error setting apply discount to entire order attribute:",
            result.message,
          );
        }
      } catch (error) {
        console.error(
          "Error setting apply discount to entire order attribute:",
          error,
        );
      }
    };

    updateApplyDiscountToEntireOrderAttribute();
  }, [widgetData?.widget?.settings?.applyDiscountToEntireOrder]);

  // Сохраняем discount codes в атрибут корзины для Cart Transform Function
  useEffect(() => {
    const updateCartAttribute = async () => {
      // Извлекаем коды из объектов: discountCodes - это массив объектов вида [{code: 'test-sellence'}]
      const currentCodes =
        discountCodes && discountCodes.length > 0
          ? discountCodes
              .map((dc) => (typeof dc === "string" ? dc : dc.code))
              .filter(Boolean)
              .sort()
              .join(",")
          : null;

      // Проверяем, изменились ли коды с последнего сохранения
      if (currentCodes === lastSavedDiscountCodesRef.current) {
        return; // Не обновляем, если значения одинаковые
      }

      console.log("=== DISCOUNT CODES ===");
      console.log("Discount codes:", discountCodes);

      if (currentCodes) {
        console.log("🎯 DISCOUNT CODES APPLIED:", discountCodes);
        discountCodes.forEach((code, index) => {
          const codeValue = typeof code === "string" ? code : code.code;
          console.log(`  [${index + 1}] Code:`, codeValue);
        });

        try {
          // Сохраняем промокод в атрибут корзины
          const result = await shopify.applyAttributeChange({
            type: "updateAttribute",
            key: "_sellence_has_discount_code",
            value: currentCodes,
          });
          if (result.type === "success") {
            console.log(
              "✅ Discount code saved to cart attribute:",
              currentCodes,
            );
            lastSavedDiscountCodesRef.current = currentCodes;

            // Удаляем атрибуты скидки Sellence из всех товаров в корзине
            // чтобы Cart Transform не путался при множественных перерендерах
            if (cartLines && cartLines.length > 0) {
              console.log(
                "🗑️ Removing Sellence discount attributes from cart lines due to promo code",
              );
              for (const line of cartLines) {
                // Проверяем наличие атрибутов Sellence скидки
                const hasSellenceDiscount = line.attributes?.some(
                  (attr) =>
                    attr.key === "_sellence_discount" ||
                    attr.key === "_sellence_discount_percent",
                );

                if (hasSellenceDiscount) {
                  // Фильтруем атрибуты, оставляем только те, которые НЕ связаны со скидкой Sellence
                  const filteredAttributes =
                    line.attributes?.filter(
                      (attr) =>
                        attr.key !== "_sellence_discount" &&
                        attr.key !== "_sellence_discount_percent",
                    ) || [];

                  try {
                    // Обновляем товар, удаляя атрибуты скидки
                    const updateResult = await shopify.applyCartLinesChange({
                      type: "updateCartLine",
                      id: line.id,
                      quantity: line.quantity,
                      attributes: filteredAttributes,
                    });

                    if (updateResult.type === "success") {
                      console.log(
                        `✅ Removed Sellence discount attributes from line ${line.id}`,
                      );
                    } else {
                      console.error(
                        `Error removing Sellence discount attributes from line ${line.id}:`,
                        updateResult.message,
                      );
                    }
                  } catch (updateError) {
                    console.error(
                      `Error updating cart line ${line.id}:`,
                      updateError,
                    );
                  }
                }
              }
            }
          } else {
            console.error(
              "Error saving discount code to cart attribute:",
              result.message,
            );
          }
        } catch (error) {
          console.error("Error saving discount code to cart attribute:", error);
        }
      } else {
        // Проверяем, нужно ли удалять (если ранее было сохранено значение)
        if (lastSavedDiscountCodesRef.current !== null) {
          console.log("No discount codes applied");

          try {
            const result = await shopify.applyAttributeChange({
              type: "removeAttribute",
              key: "_sellence_has_discount_code",
            });
            if (result.type === "success") {
              console.log("✅ Discount code attribute removed from cart");
              lastSavedDiscountCodesRef.current = null;
            } else {
              console.error(
                "Error removing discount code attribute:",
                result.message,
              );
            }
          } catch (error) {
            console.error("Error removing discount code attribute:", error);
          }
        }
      }
    };

    updateCartAttribute();
  }, [discountCodes]); // Убрали lastSavedDiscountCodes из зависимостей, используем useRef

  // Получаем настройки из extension
  const widgetId =
    shopify.settings.value.widget_id || WIDGET_ID_FOR_CHECKOUT_APP;
  const appUrl = shopify.settings.value.app_url || URL_FOR_CHECKOUT_APP;
  const showBothPrices = shopify.settings.value.show_both_prices === true;
  const normalizedAppUrl =
    typeof appUrl === "string"
      ? appUrl.replace(/\/$/, "")
      : String(appUrl || "").replace(/\/$/, "");

  // Получаем язык клиента из локализации
  // В Shopify checkout UI extensions язык доступен через shopify.localization.language
  const getClientLocale = () => {
    try {
      const language = shopify.localization?.language?.value;
      if (language) {
        // isoCode может быть в формате "EN" или "en-US", нормализуем
        const isoCode = language.isoCode;
        if (isoCode) {
          return isoCode.toLowerCase().split("-")[0];
        }
      }
    } catch (e) {
      console.warn("Could not get client locale:", e);
    }
    return "en"; // Fallback на английский
  };

  const shopDomainFromContext =
    shopInfo?.myshopifyDomain ||
    shopInfo?.storefrontUrl ||
    shopInfo?.id ||
    "unknown-shop";

  async function trackWidgetClick(widgetIdToTrack, widgetType) {
    if (!normalizedAppUrl) return;

    try {
      await fetch(`${normalizedAppUrl}/api/analytics/widget-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: widgetIdToTrack,
          widgetType,
          shop: shopDomainFromContext,
        }),
      });
    } catch (error) {
      console.warn("Failed to track Sellence widget click", error);
    }
  }

  // Функция для добавления перечеркивания через Unicode символы
  function strikethrough(text) {
    return String(text)
      .split("")
      .map((char) => char + "\u0336")
      .join("");
  }

  // Функция для извлечения productId из GID формата
  function extractProductId(gid) {
    if (!gid) return null;
    // Если уже числовой ID, возвращаем как есть
    if (/^\d+$/.test(gid)) return gid;
    // Извлекаем числовой ID из GID формата: gid://shopify/Product/43622958399581
    const match = gid.match(/\/(\d+)$/);
    return match ? match[1] : null;
  }

  // Функция для получения цены из marketsPrice на основе текущего маркета
  function getMarketPrice(variantDetails) {
    const currentCountry = shopify.localization.country.value?.isoCode;

    if (!currentCountry || !variantDetails?.marketsPrice) {
      // Fallback на дефолтные значения, если маркет не найден
      return {
        price: variantDetails?.price || "0",
        compareAtPrice: variantDetails?.compareAtPrice || null,
        currencyCode: shopify.cost.totalAmount.value.currencyCode,
      };
    }

    // Ищем маркет по countryCode
    const marketPrice = variantDetails.marketsPrice.find(
      (mp) => mp.countryCode === currentCountry,
    );

    if (marketPrice) {
      return {
        price: marketPrice.price || "0",
        compareAtPrice: marketPrice.compareAtPrice || null,
        currencyCode:
          marketPrice.currencyCode ||
          shopify.cost.totalAmount.value.currencyCode,
      };
    }

    // Если маркет не найден, используем дефолтные значения
    return {
      price: variantDetails?.price || "0",
      compareAtPrice: variantDetails?.compareAtPrice || null,
      currencyCode: shopify.cost.totalAmount.value.currencyCode,
    };
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

          // console.log(
          //   `Checking product ${i + 1}/${cartLines.length} (ID: ${productId})...`,
          // );

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
              // Логируем для отладки переводов
              if (data.widget.settings?.appearanceTexts) {
                console.log(
                  "✅ Widget appearanceTexts loaded:",
                  data.widget.settings.appearanceTexts,
                );
              } else {
                console.log(
                  "⚠️ Widget settings found but no appearanceTexts:",
                  data.widget.settings,
                );
              }

              setWidgetData(data);
              setSlideCount(data?.widget?.settings?.slideCount || 0);
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

  // Функция для добавления товара в корзину
  async function handleAddToCart(variantId) {
    if (addingProducts.has(variantId)) {
      return; // Уже добавляем этот товар
    }

    setAddingProducts((prev) => new Set(prev).add(variantId));

    try {
      // Получаем тип виджета из widgetData
      const widgetType = widgetData?.widget?.type || "checkout";
      trackWidgetClick(widgetId, widgetType);

      // Формируем атрибуты для товара
      const attributes = [
        {
          key: "_sellence_widget_id",
          value: widgetId,
        },
        {
          key: "_sellence_widget_type",
          value: widgetType,
        },
        {
          key: "_sellence_applied",
          value: "true",
        },
      ];

      const result = await shopify.applyCartLinesChange({
        type: "addCartLine",
        merchandiseId: variantId,
        quantity: 1,
        attributes: attributes,
      });

      if (result.type === "error") {
        console.error("Error adding product to cart:", result.message);
        // Можно показать ошибку пользователю
      } else {
        console.log(
          "Product added to cart successfully with widget attributes",
        );
      }
    } catch (err) {
      console.error("Error adding product to cart:", err);
    } finally {
      setAddingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variantId);
        return newSet;
      });
    }
  }

  // Получаем дочерние товары
  const childProducts = widgetData?.widget?.product?.childProducts || [];

  // Функция для получения товаров с Sellence скидкой из корзины
  const getCartLinesWithSellenceDiscount = () => {
    if (!cartLines || cartLines.length === 0) {
      return [];
    }

    return cartLines
      .map((line) => {
        // Проверяем наличие атрибута _sellence_discount
        const sellenceDiscountAttr = line.attributes?.find(
          (attr) => attr.key === "_sellence_discount",
        );
        const sellenceDiscountPercentAttr = line.attributes?.find(
          (attr) => attr.key === "_sellence_discount_percent",
        );

        if (
          sellenceDiscountAttr?.value === "true" &&
          sellenceDiscountPercentAttr?.value
        ) {
          const discountPercent = parseFloat(sellenceDiscountPercentAttr.value);

          // Получаем цену из структуры cost
          // В Checkout UI Extension структура cost может отличаться
          const cost = line.cost;
          // @ts-ignore - cost структура может отличаться в разных версиях API
          const totalAmount =
            cost?.totalAmount?.amount ||
            // @ts-ignore
            cost?.amount?.amount ||
            // @ts-ignore
            cost?.amount ||
            "0";
          // @ts-ignore - currencyCode структура может отличаться
          const currencyCode =
            cost?.totalAmount?.currencyCode ||
            // @ts-ignore
            cost?.amount?.currencyCode ||
            // @ts-ignore
            cost?.currencyCode ||
            "USD";

          // Текущая цена (уже со скидкой от Cart Transform)
          const currentPrice =
            parseFloat(String(totalAmount)) / (line.quantity || 1);

          // Восстанавливаем оригинальную цену до скидки
          const originalPrice = currentPrice / (1 - discountPercent / 100);

          // Вычисляем сумму скидки
          const discountAmount = originalPrice - currentPrice;

          return {
            line,
            discountPercent,
            discountAmount,
            originalPrice,
            currentPrice,
            currencyCode,
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const cartLinesWithDiscount = getCartLinesWithSellenceDiscount();

  // Функция для проверки доступности товара для продажи
  function isAvailableForSale(childProduct) {
    const variantDetails = childProduct?.variantDetails;

    // Если availableForSale явно false, товар недоступен
    if (variantDetails?.availableForSale === false) {
      return false;
    }

    // Если inventoryPolicy === "CONTINUE", товар доступен для продажи даже при нулевом количестве
    const inventoryPolicy = variantDetails?.inventoryPolicy?.toUpperCase();
    if (inventoryPolicy === "CONTINUE") {
      return true;
    }

    // Для "DENY" проверяем наличие товара
    if (inventoryPolicy === "DENY") {
      let maxQuantity = 0;
      variantDetails?.inventoryLevels?.forEach((level) => {
        if (level.quantity > maxQuantity) {
          maxQuantity = level.quantity;
        }
      });

      // Если количество <= 0 и политика DENY, товар недоступен
      if (maxQuantity <= 0) {
        return false;
      }
    }

    // По умолчанию считаем товар доступным, если availableForSale !== false
    return true;
  }

  let count = 0;
  let productsForRender = [];

  childProducts.forEach((childProduct) => {
    // Пропускаем товары, которые уже в корзине
    if (cartLinesVariantIds.includes(childProduct.variantId)) {
      return null;
    }

    // Пропускаем недоступные товары
    if (!isAvailableForSale(childProduct)) {
      return null;
    }

    count++;

    if (count > slideCount) {
      return;
    }

    productsForRender.push(childProduct);
  });

  // console.log("productsForRender", productsForRender);

  // 3. Render a UI
  if (childProducts.length === 0) {
    return null;
  }

  // Получаем переводы из настроек виджета
  // appearanceTexts приходят вместе с данными виджета в одном API запросе
  const appearanceTexts = widgetData?.widget?.settings?.appearanceTexts || {};
  const clientLocale = getClientLocale();

  // Логируем для отладки

  // Функция для получения текста по языку с fallback на en
  const getText = (key) => {
    // Сначала пробуем получить текст для текущего языка
    const localeTexts = appearanceTexts[clientLocale];
    if (localeTexts && localeTexts[key]) {
      return localeTexts[key];
    }
    // Если нет, пробуем английский
    const enTexts = appearanceTexts["en"];
    if (enTexts && enTexts[key]) {
      return enTexts[key];
    }
    // Если нет, используем дефолт
    return getDefaultText(key);
  };

  // Дефолтные тексты
  const getDefaultText = (key) => {
    const defaults = {
      heading: "Complete your purchase",
      buttonText: "Add",
      buttonVariant: "primary",
    };
    return defaults[key] || "";
  };

  const headingText = getText("heading");
  const buttonText = getText("buttonText");
  const buttonVariant = getText("buttonVariant") || "primary";

  return (
    <s-stack gap="base">
      {childProducts.length > 0 && (
        <>
          <s-heading>{headingText}</s-heading>
          <s-grid
            gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
            gap="base"
          >
            {productsForRender.map((childProduct, index) => {
              if (cartLinesVariantIds.includes(childProduct.variantId)) {
                return null;
              }

              const variantDetails = childProduct.variantDetails;
              const imageUrl =
                variantDetails?.image?.url ||
                variantDetails?.product?.featuredImage?.url ||
                "";
              const productTitle =
                variantDetails?.product?.title ||
                variantDetails?.title ||
                "Product";

              // Получаем цену из marketsPrice на основе текущего маркета
              const marketPriceData = getMarketPrice(variantDetails);
              const price = marketPriceData.price;
              const compareAtPrice = marketPriceData.compareAtPrice;
              const currencyCode = marketPriceData.currencyCode;

              const variantId = childProduct.variantId;
              const isAdding = addingProducts.has(variantId);

              return (
                <s-grid-item gridColumn="auto" key={variantId || index}>
                  <s-grid
                    padding="base"
                    background="subdued"
                    border="base"
                    borderRadius="base"
                    gridTemplateColumns="auto 1fr auto"
                    gap="base"
                    alignItems="center"
                  >
                    <s-grid-item gridColumn="auto">
                      <s-product-thumbnail
                        src={imageUrl}
                        alt={productTitle}
                      ></s-product-thumbnail>
                    </s-grid-item>
                    <s-grid-item
                      gridColumn="auto"
                      minInlineSize="0"
                      overflow="hidden"
                    >
                      <s-stack gap="small" minInlineSize="0">
                        <s-text>{productTitle}</s-text>
                        <s-stack gap="small" direction="inline">
                          {(() => {
                            const priceNum = parseFloat(price) || 0;
                            const compareAtPriceNum = compareAtPrice
                              ? parseFloat(compareAtPrice) || 0
                              : null;

                            // Если обе цены нужно показать
                            if (showBothPrices && compareAtPriceNum) {
                              // Определяем какая цена больше
                              if (compareAtPriceNum > priceNum) {
                                // Старая цена больше - показываем обе, старую перечеркнутой
                                return (
                                  <>
                                    <s-text>
                                      {shopify.i18n.formatCurrency(priceNum, {
                                        currency: currencyCode,
                                      })}
                                    </s-text>
                                    <s-text tone="neutral">
                                      {strikethrough(
                                        shopify.i18n.formatCurrency(
                                          compareAtPriceNum,
                                          {
                                            currency: currencyCode,
                                          },
                                        ),
                                      )}
                                    </s-text>
                                  </>
                                );
                              } else {
                                // Новая цена больше (редкий случай) - показываем обе
                                return (
                                  <>
                                    <s-text>
                                      {shopify.i18n.formatCurrency(priceNum, {
                                        currency: currencyCode,
                                      })}
                                    </s-text>
                                  </>
                                );
                              }
                            } else {
                              // Показываем только меньшую цену (по умолчанию)
                              const displayPrice =
                                compareAtPriceNum &&
                                compareAtPriceNum < priceNum
                                  ? compareAtPriceNum
                                  : priceNum;

                              return (
                                <s-text>
                                  {shopify.i18n.formatCurrency(displayPrice, {
                                    currency: currencyCode,
                                  })}
                                </s-text>
                              );
                            }
                          })()}
                        </s-stack>
                      </s-stack>
                    </s-grid-item>
                    <s-grid-item gridColumn="auto">
                      <s-button
                        variant={buttonVariant}
                        onClick={() => handleAddToCart(variantId)}
                        loading={isAdding}
                        disabled={isAdding}
                      >
                        {buttonText}
                      </s-button>
                    </s-grid-item>
                  </s-grid>
                </s-grid-item>
              );
            })}
          </s-grid>
        </>
      )}
    </s-stack>
  );
}
