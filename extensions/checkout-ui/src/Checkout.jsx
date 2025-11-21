import "@shopify/ui-extensions/preact";
import { render } from "preact";
import {
  useCartLines,
  useDiscountCodes,
} from "@shopify/ui-extensions/checkout/preact";
import { useEffect, useState, useRef } from "preact/hooks";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body);
};

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
  // Используем useRef для отслеживания последнего сохраненного значения без триггера перерендера
  const lastSavedDiscountCodesRef = useRef(null);

  useEffect(() => {
    const variantIds = cartLines.map((line) => line.merchandise.id);
    setCartLinesVariantIds(variantIds);
  }, [cartLines]);

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

  // Отслеживаем изменения стоимости корзины (может изменяться при применении промокода)
  // Используем useMemo или убираем логирование, чтобы не вызывать бесконечные циклы
  // Закомментировано для предотвращения циклов - можно включить для отладки
  /*
  useEffect(() => {
    try {
      const totalAmount = shopify.cost?.totalAmount?.value?.amount;
      const subtotalAmount = shopify.cost?.subtotalAmount?.value?.amount;

      console.log("=== CHECKOUT COST INFO ===");
      console.log("Total Amount:", totalAmount);
      console.log("Subtotal Amount:", subtotalAmount);
      console.log("Full cost object:", shopify.cost);

      // Логируем все свойства cost для поиска discount info
      if (shopify.cost) {
        console.log("Cost object keys:", Object.keys(shopify.cost));
        // Проверяем возможные поля для discount
        // @ts-ignore - totalDiscountAmount может существовать в runtime
        const totalDiscount = shopify.cost.totalDiscountAmount;
        if (totalDiscount) {
          console.log("🎯 DISCOUNT AMOUNT FOUND:", totalDiscount);
        }
        // @ts-ignore - discountAmount может существовать в runtime
        const discount = shopify.cost.discountAmount;
        if (discount) {
          console.log("🎯 DISCOUNT AMOUNT FOUND:", discount);
        }
      }

      // Вычисляем скидку по разнице
      if (totalAmount && subtotalAmount) {
        const calculatedDiscount =
          parseFloat(String(subtotalAmount)) - parseFloat(String(totalAmount));
        if (calculatedDiscount > 0) {
          console.log("🎯 DISCOUNT CALCULATED! Amount:", calculatedDiscount);
        }
      }
    } catch (error) {
      console.error("Error reading cost info:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLines]); // Отслеживаем изменения через cartLines
  */

  // Получаем настройки из extension
  const widgetId =
    shopify.settings.value.widget_id || "cmi31w59t0000uoi7tcj01tsl";
  const appUrl =
    shopify.settings.value.app_url ||
    "https://delegation-exit-dramatically-ways.trycloudflare.com";
  const showBothPrices = shopify.settings.value.show_both_prices === true;

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
              // console.log(
              //   `Found product with ${childProducts.length} child products!`,
              //   data,
              // );
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
      const result = await shopify.applyCartLinesChange({
        type: "addCartLine",
        merchandiseId: variantId,
        quantity: 1,
      });

      if (result.type === "error") {
        console.error("Error adding product to cart:", result.message);
        // Можно показать ошибку пользователю
      } else {
        console.log("Product added to cart successfully");
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

  let count = 0;
  let productsForRender = [];

  childProducts.forEach((childProduct) => {
    if (cartLinesVariantIds.includes(childProduct.variantId)) {
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

  return (
    <s-stack gap="base">
      {childProducts.length > 0 && (
        <>
          <s-heading>Complete your purchase</s-heading>
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
                    <s-grid-item gridColumn="auto">
                      <s-stack gap="small">
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
                        variant="primary"
                        onClick={() => handleAddToCart(variantId)}
                        loading={isAdding}
                        disabled={isAdding}
                      >
                        Add
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
