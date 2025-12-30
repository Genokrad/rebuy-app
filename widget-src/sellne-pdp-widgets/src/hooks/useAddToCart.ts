import type { ProductVariant } from "../types";

interface DiscountData {
  success: boolean;
  discount: number;
  items: Array<{ variantId: string; discount: number }>;
}

interface AddToCartParams {
  selectedVariants: (ProductVariant | null)[];
  discountData: DiscountData;
  hasPromoCode: boolean;
  currentMarketplace: string;
  widgetId: string;
  publishCartEvent: (responseJson: unknown) => Promise<void>;
  applyDiscountToEntireOrder?: boolean;
}

/**
 * Функция для извлечения числового ID из GID формата
 */
const extractNumericId = (gid: string): string | null => {
  if (!gid) return null;
  // Если уже числовой ID, возвращаем как есть
  if (/^\d+$/.test(gid)) return gid;
  // Извлекаем числовой ID из GID формата: gid://shopify/ProductVariant/43622958399581
  const match = gid.match(/\/(\d+)$/);
  return match ? match[1] : null;
};

/**
 * Функция для получения оригинальной цены товара из варианта
 */
const getOriginalPrice = (
  variant: ProductVariant | null,
  currentMarketplace: string,
): string | null => {
  if (!variant?.variantDetails) {
    return null;
  }

  // Сначала пытаемся получить цену из marketsPrice по текущему маркетплейсу
  if (currentMarketplace && variant.variantDetails.marketsPrice) {
    const marketPrice = variant.variantDetails.marketsPrice.find(
      (mp) => mp.countryCode === currentMarketplace,
    );
    if (marketPrice?.price) {
      return marketPrice.price;
    }
  }

  // Если нет marketsPrice, пытаемся получить из inventoryLevels
  if (variant.variantDetails.inventoryLevels) {
    const inventoryLevel =
      variant.variantDetails.inventoryLevels.find(
        (level) => level.countryCode === currentMarketplace,
      ) || variant.variantDetails.inventoryLevels[0];

    if (inventoryLevel?.price) {
      return inventoryLevel.price;
    }
  }

  // Fallback на обычную цену
  return variant.variantDetails.price || null;
};

/**
 * Хук для добавления товаров в корзину
 */
export function useAddToCart() {
  const addToCart = async ({
    selectedVariants,
    discountData,
    hasPromoCode,
    currentMarketplace,
    widgetId,
    publishCartEvent,
    applyDiscountToEntireOrder = false,
  }: AddToCartParams) => {
    try {
      const cartItems: Array<{
        id: string;
        quantity: number;
        properties: Record<string, string>;
      }> = [];

      // Формируем товары для добавления в корзину с properties
      // Используем selectedVariants напрямую - там уже хранятся полные объекты вариантов
      for (let index = 0; index < selectedVariants.length; index++) {
        const selectedVariant = selectedVariants[index];
        if (!selectedVariant) {
          continue;
        }

        // Находим соответствующий item из discountData по variantId
        const variantId =
          selectedVariant.variantId || selectedVariant.variantDetails?.id;
        if (!variantId) {
          continue;
        }

        const discountItem = discountData.items.find(
          (item) => item.variantId === variantId,
        );
        if (!discountItem) {
          continue;
        }

        const numericId = extractNumericId(variantId);
        if (!numericId) {
          continue;
        }

        // Получаем оригинальную цену напрямую из варианта
        const originalPrice = getOriginalPrice(
          selectedVariant,
          currentMarketplace,
        );

        if (!originalPrice) {
          continue;
        }

        // Формируем properties для товара
        const itemProperties: Record<string, string> = {
          _sellence_original_price: originalPrice.toString(),
          _sellence_widget_id: widgetId,
          _sellence_widget_type: "products-page",
          _sellence_applied: "true",
        };

        // Добавляем атрибуты скидки только если нет промокода в корзине
        // Устанавливаем атрибуты на товары всегда, чтобы тема могла их использовать
        // даже когда applyDiscountToEntireOrder = true
        if (!hasPromoCode) {
          itemProperties["_sellence_discount"] = "true";
          itemProperties["_sellence_discount_percent"] =
            discountData.discount.toString();
        }

        cartItems.push({
          id: numericId,
          quantity: 1,
          properties: itemProperties,
        });
      }

      if (cartItems.length === 0) {
        throw new Error("No available products to add to cart");
      }

      // Добавляем товары в корзину через Shopify Cart API
      const addToCartResponse = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });

      const addResult = await addToCartResponse.json();

      if (!addToCartResponse.ok) {
        const errorMessage =
          addResult.description ||
          addResult.error ||
          addToCartResponse.statusText;
        throw new Error(`Error adding to cart: ${errorMessage}`);
      }

      // Обновляем корзину через /cart.js для синхронизации
      try {
        await fetch("/cart.js");
      } catch {
        // Игнорируем ошибки обновления корзины
      }

      // Устанавливаем атрибуты корзины для применения скидки ко всему заказу
      // и для отображения в теме
      if (applyDiscountToEntireOrder) {
        try {
          // Получаем процент скидки из первого товара (если есть)
          const discountPercent = discountData.discount.toString();

          // Устанавливаем атрибуты корзины через Cart API
          const updateResponse = await fetch("/cart/update.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attributes: {
                _sellence_apply_discount_to_entire_order: "true",
                _sellence_discount_percent: discountPercent,
              },
            }),
          });

          if (updateResponse.ok) {
            console.log(
              "✅ Set apply discount to entire order attribute in cart",
            );
            console.log(
              `✅ Set discount percent attribute in cart: ${discountPercent}%`,
            );
          } else {
            console.error(
              "Error setting apply discount to entire order attribute:",
              await updateResponse.text(),
            );
          }
        } catch (error) {
          console.error(
            "Error setting apply discount to entire order attribute:",
            error,
          );
        }
      } else {
        // Удаляем атрибуты, если настройка выключена
        try {
          const cartResponse = await fetch("/cart.js");
          const cart = await cartResponse.json();

          // Проверяем, есть ли атрибуты в корзине
          const hasApplyToEntireOrder =
            cart.attributes &&
            cart.attributes._sellence_apply_discount_to_entire_order;
          const hasDiscountPercent =
            cart.attributes && cart.attributes._sellence_discount_percent;

          if (hasApplyToEntireOrder || hasDiscountPercent) {
            // Удаляем атрибуты, устанавливая их в null
            const attributesToRemove: Record<string, null> = {};
            if (hasApplyToEntireOrder) {
              attributesToRemove._sellence_apply_discount_to_entire_order =
                null;
            }
            if (hasDiscountPercent) {
              attributesToRemove._sellence_discount_percent = null;
            }

            const updateResponse = await fetch("/cart/update.js", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                attributes: attributesToRemove,
              }),
            });

            if (updateResponse.ok) {
              console.log(
                "✅ Removed apply discount to entire order attributes from cart",
              );
            }
          }
        } catch (error) {
          console.error(
            "Error removing apply discount to entire order attribute:",
            error,
          );
        }
      }

      // Публикуем кастомное событие для обновления корзины (счетчик товаров и т.д.)
      await publishCartEvent(addResult).catch(() => {
        // Игнорируем ошибки публикации события
      });

      return addResult;
    } catch (error) {
      console.error("Error adding items to cart:", error);
      throw error;
    }
  };

  return { addToCart };
}
