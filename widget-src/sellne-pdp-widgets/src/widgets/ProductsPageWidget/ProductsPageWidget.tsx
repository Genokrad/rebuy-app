import { useState, useMemo, useEffect, useCallback } from "react";
import { usePublishCartEvent } from "../../hooks/usePublishCartEvent";
import { useAddToCart } from "../../hooks/useAddToCart";
import { ProductCard } from "../../components/productCard/ProductCard";
import { TotalPrice } from "../../components/TotalPrice";
import { getFinalDiscount } from "../../utils/discountUtils";
import DiscountMessage from "../../components/discountMessage/DiscountMessage";
import type { ProductVariant, UseWidgetDataResult } from "../../types";
import styles from "../../App.module.css";
import Button from "../../components/Button";

const DEFAULT_LOCALE = "en";
const fallbackTexts = {
  title: "Buy more at a lower price",
  addedText: "Added",
  addText: "Add",
  totalPriceLabel: "Total Price:",
  discountText: "Add 1 more product to unlock a 2% discount!",
  addToCartText: "Create bundle",
  maxDiscountText:
    "You are already using the maximum discount of ${maxDiscount}% 🎉",
  nextDiscountText:
    "Add ${remaining} more products to your cart and unlock a ${nextDiscount}% discount!",
  widgetBackgroundColor: "#f5f5ee",
  buttonBackgroundColor: "#4B3E34",
  addedButtonBackgroundColor: "#000",
};

interface ProductsPageWidgetProps {
  widgetData: UseWidgetDataResult;
}

export function ProductsPageWidget({ widgetData }: ProductsPageWidgetProps) {
  const {
    products,
    settings,
    currentMarketplace,
    locale,
    shopId,
    appUrl,
    widgetId,
    currentProductId,
    shop,
    widgetType,
  } = widgetData;

  // Используем кастомные хуки (должны быть вызваны до любых условных return)
  const { publishAjaxProductAdded } = usePublishCartEvent();
  const { addToCart } = useAddToCart();

  // Ограничиваем количество товаров по slideCount из настроек
  const slideCount = settings?.slideCount || products.length;
  const displayedProducts = useMemo(
    () => products.slice(0, slideCount),
    [products, slideCount],
  );

  // Тексты для текущей локали (fallback на EN)
  const currentTexts = useMemo(() => {
    const textsByLocale =
      settings?.appearanceTexts ||
      (settings
        ? (
            settings as {
              appearanceTextsByLocale?: typeof settings.appearanceTexts;
            }
          )?.appearanceTextsByLocale
        : undefined);
    const localeFromConfig = locale ? locale.toLowerCase() : "";
    const localeKey = localeFromConfig || DEFAULT_LOCALE;

    console.log("localeKey ==>>>>", localeKey);
    console.log("textsByLocale ==>>>>", textsByLocale);

    const localeTexts =
      textsByLocale?.[localeKey] ??
      textsByLocale?.[DEFAULT_LOCALE] ??
      (textsByLocale
        ? textsByLocale[Object.keys(textsByLocale)[0]]
        : undefined);

    return {
      ...fallbackTexts,
      ...(localeTexts || {}),
    };
  }, [settings, locale]);

  const formatTemplate = useCallback(
    (template: string, vars: Record<string, string | number>) =>
      template.replace(/\$\{(\w+)\}/g, (_, key) =>
        vars[key] !== undefined ? String(vars[key]) : "",
      ),
    [],
  );

  const [selectedVariants, setSelectedVariants] = useState<
    (ProductVariant | null)[]
  >([]);

  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Создаем стабильную строку идентификаторов продуктов для зависимостей
  const displayedProductsKey = useMemo(
    () => displayedProducts.map((p) => p.productId).join(","),
    [displayedProducts],
  );

  // Состояние для отслеживания выбранных товаров (для расчета скидок)
  // Все товары изначально выбраны (isAdded = true)
  // Используем ленивую инициализацию для вычисления начального значения
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(() => {
    if (displayedProducts.length > 0) {
      return new Set(displayedProducts.map((p) => p.productId));
    }
    return new Set<string>();
  });

  const onSelectNewVariant = (
    variant: ProductVariant | null,
    productIndex: number,
  ) => {
    setSelectedVariants((prev) => {
      const newVariants = [...prev];
      newVariants[productIndex] = variant;
      return newVariants;
    });
  };

  const hasPromoCodeInCart = async () => {
    try {
      const cartResponse = await fetch("/cart.js");

      if (!cartResponse.ok) {
        console.warn("Failed to fetch cart, assuming no promo code");
        return false;
      }
      const cart = await cartResponse.json();

      let hasDiscountCodeAttr = false;

      if (cart?.discount_codes?.length > 0) {
        hasDiscountCodeAttr = true;
      }

      return hasDiscountCodeAttr;
    } catch (error) {
      console.error("Error checking cart for promo code:", error);
      return false; // В случае ошибки предполагаем, что промокода нет
    }
  };

  const onChangingTheOption = (
    variant: ProductVariant | null,
    productIndex: number,
    newIsAdded: boolean,
  ) => {
    setSelectedVariants((prev) => {
      const newVariants = [...prev];
      newVariants[productIndex] = newIsAdded ? variant : null;
      return newVariants;
    });
  };

  // Синхронизируем selectedProducts с displayedProducts только при первой загрузке
  // или когда список товаров изменился (добавляем новые, удаляем отсутствующие)
  // НО не перезаписываем выбор пользователя для существующих товаров
  useEffect(() => {
    if (displayedProducts.length === 0) {
      return;
    }
    const productIds = displayedProducts.map((p) => p.productId);
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      // Добавляем только новые товары (которых еще нет в selectedProducts)
      productIds.forEach((id) => {
        if (!newSet.has(id)) {
          newSet.add(id);
        }
      });
      // Удаляем товары, которых больше нет в списке displayedProducts
      Array.from(newSet).forEach((id) => {
        if (!productIds.includes(id)) {
          newSet.delete(id);
        }
      });
      return newSet;
    });

    // Инициализируем selectedVariants только при первой загрузке или при изменении количества продуктов
    setSelectedVariants((prev) => {
      // Если массив уже инициализирован и длина совпадает, не обновляем
      if (prev.length === displayedProducts.length) {
        return prev;
      }

      // Инициализируем массив нужной длины
      const newVariants: (ProductVariant | null)[] = new Array(
        displayedProducts.length,
      ).fill(null);
      // Заполняем начальными значениями из первого варианта каждого продукта
      displayedProducts.forEach((p, index) => {
        // Если уже есть значение для этого индекса, сохраняем его
        if (prev[index]) {
          newVariants[index] = prev[index];
        } else {
          const firstVariant = p.variants[0];
          if (firstVariant) {
            newVariants[index] = firstVariant;
          }
        }
      });
      return newVariants;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedProductsKey, displayedProducts.length]);

  // Вычисляем количество выбранных товаров
  const selectedProductsCount = selectedProducts.size;

  // Отсортированные скидки по количеству товаров (по возрастанию)
  const sortedDiscounts = useMemo(() => {
    if (!settings?.discounts || !Array.isArray(settings.discounts)) {
      return [];
    }
    return [...settings.discounts].sort((a, b) => {
      const countA = Number(Object.keys(a)[0]);
      const countB = Number(Object.keys(b)[0]);
      return countA - countB;
    });
  }, [settings?.discounts]);

  // Вычисляем финальную скидку на основе количества выбранных товаров
  const finalDiscount = useMemo(
    () => getFinalDiscount(selectedProductsCount, sortedDiscounts),
    [selectedProductsCount, sortedDiscounts],
  );

  // Сообщение о следующей максимальной доступной скидке
  const discountMessageText = useMemo(() => {
    if (!sortedDiscounts.length) {
      return "";
    }

    const totalProductsAvailable = displayedProducts.length;
    const canAddMore = Math.max(
      0,
      totalProductsAvailable - selectedProductsCount,
    );

    // Если нет ни одного порога, достижимого при текущем наличии — ничего не показываем
    const hasReachableTier = sortedDiscounts.some((tier) => {
      const [countStr, discountValue] = Object.entries(tier)[0];
      const count = Number(countStr);
      const discountNum = Number(discountValue);
      return discountNum > 0 && count <= totalProductsAvailable;
    });
    if (!hasReachableTier) {
      return "";
    }

    const lastTier = sortedDiscounts[sortedDiscounts.length - 1];
    const [lastCountStr, lastDiscountValue] = Object.entries(lastTier)[0];
    const maxThreshold = Number(lastCountStr);
    const maxDiscount = Number(lastDiscountValue);

    // Если уже достигнут или превышен максимальный порог и при этом скидка > 0
    // (и этот порог достижим, см. проверку выше) — показываем сообщение о максимальной скидке
    if (selectedProductsCount >= maxThreshold && maxDiscount > 0) {
      const template =
        currentTexts.maxDiscountText ||
        "You are already using the maximum discount of ${maxDiscount}% 🎉";
      return formatTemplate(template, { maxDiscount });
    }

    // Ищем следующий порог после текущего количества товаров,
    // у которого скидка строго больше 0
    const nextTierWithPositiveDiscount = sortedDiscounts.find((tier) => {
      const [countStr, discountValue] = Object.entries(tier)[0];
      const count = Number(countStr);
      const discountNum = Number(discountValue);
      return count > selectedProductsCount && discountNum > 0;
    });

    // Если впереди нет порогов со скидкой > 0 — ничего не показываем
    if (!nextTierWithPositiveDiscount) {
      return "";
    }

    const [nextCountStr, nextDiscountValue] = Object.entries(
      nextTierWithPositiveDiscount,
    )[0];
    const nextThreshold = Number(nextCountStr);
    const nextDiscount = Number(nextDiscountValue);

    const remaining = nextThreshold - selectedProductsCount;

    // Если достигнуть следующего порога невозможно (нет доступных товаров) — не показываем сообщение
    if (
      remaining <= 0 ||
      remaining > canAddMore ||
      nextThreshold > totalProductsAvailable
    ) {
      return "";
    }

    const productWord = remaining === 1 ? "product" : "products";
    const template =
      currentTexts.nextDiscountText ||
      "Add ${remaining} more products to your cart and unlock a ${nextDiscount}% discount!";
    return formatTemplate(template, {
      remaining,
      productWord,
      nextDiscount,
    });
  }, [
    selectedProductsCount,
    sortedDiscounts,
    displayedProducts.length,
    currentTexts.maxDiscountText,
    currentTexts.nextDiscountText,
    formatTemplate,
  ]);

  // Обработчик изменения состояния "added" товара
  const handleProductToggle = (productId: string, isAdded: boolean) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (isAdded) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  // Функция для отслеживания кликов по виджету
  const trackWidgetClick = async () => {
    if (!widgetId || !widgetType || !shop || !appUrl) {
      console.warn("[trackWidgetClick] Missing required data:", {
        widgetId,
        widgetType,
        shop,
        appUrl,
      });
      return;
    }

    try {
      const cleanUrl = appUrl.replace(/\/$/, "");
      const response = await fetch(`${cleanUrl}/api/analytics/widget-click`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          widgetId,
          widgetType,
          shop: shop.toLowerCase(),
        }),
      });

      if (!response.ok) {
        console.warn(
          `[trackWidgetClick] Failed to track click: ${response.status}`,
        );
      }
    } catch (error) {
      // Не блокируем основной процесс при ошибке аналитики
      console.warn("[trackWidgetClick] Error tracking click:", error);
    }
  };

  const handleAddToCart = async () => {
    console.log("handleAddToCart ===>>>>>");
    try {
      console.log("handleAddToCart ===>>>>> try");
      setIsAddingToCart(true);

      // Отправляем событие клика (не блокируем основной процесс)
      trackWidgetClick().catch((error) => {
        console.warn("Failed to track widget click:", error);
      });

      // Фильтруем выбранные варианты и извлекаем их ID
      const selectedVariantIds = selectedVariants
        .map((variant) => variant?.variantId || variant?.variantDetails?.id)
        .filter((id): id is string => !!id);

      if (selectedVariantIds.length === 0) {
        setIsAddingToCart(false);
        // alert("Please select at least one product");
        return;
      }

      // Отправляем запрос на сервер для вычисления скидки
      const discountResponse = await fetch(
        `${appUrl}/api/cart/calculate-discount`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantIds: selectedVariantIds, // Массив ID вариантов товаров
            widgetId: widgetId, // ID виджета
            parentProductId: currentProductId, // ID родительского продукта
          }),
        },
      );

      if (!discountResponse.ok) {
        const errorData = await discountResponse.json();
        throw new Error(errorData.error || "Failed to calculate discount");
      }

      const discountData = await discountResponse.json();

      if (!discountData.success) {
        throw new Error(discountData.error || "Failed to calculate discount");
      }

      console.log("discountData ===>>>>>", discountData);

      // Проверяем наличие промокода в корзине
      const hasPromoCode = await hasPromoCodeInCart();

      // Добавляем товары в корзину
      const addToCartResult = await addToCart({
        selectedVariants,
        discountData,
        hasPromoCode,
        currentMarketplace: currentMarketplace || "",
        widgetId,
        publishCartEvent: publishAjaxProductAdded,
        applyDiscountToEntireOrder:
          settings?.applyDiscountToEntireOrder || false,
      });

      console.log("addToCartResult ===>>>>>", addToCartResult);

      // Здесь можно добавить уведомление об успешном добавлении
      // alert("Products added to cart successfully!");
    } catch (error) {
      console.error("Error in handleAddToCart:", error);
      alert(
        `Error adding to cart: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Извлекаем цвета из настроек
  const widgetBackgroundColor =
    currentTexts.widgetBackgroundColor || fallbackTexts.widgetBackgroundColor;
  const buttonBackgroundColor =
    currentTexts.buttonBackgroundColor || fallbackTexts.buttonBackgroundColor;
  const addedButtonBackgroundColor =
    currentTexts.addedButtonBackgroundColor ||
    fallbackTexts.addedButtonBackgroundColor;

  return (
    <div
      id="sellence-widget-content"
      style={{ width: "100%", backgroundColor: widgetBackgroundColor }}
    >
      <div className={styles.container}>
        {currentTexts.title && (
          <h2 className={styles.title}>{currentTexts.title}</h2>
        )}

        <ul className={styles.productsList} id="items-list">
          {displayedProducts.map((product, index) => (
            <ProductCard
              key={product.productId}
              product={product}
              currentMarketplace={currentMarketplace}
              shopId={shopId}
              discount={finalDiscount}
              productIndex={index}
              onSelectNewVariant={onSelectNewVariant}
              onChangingTheOption={onChangingTheOption}
              onToggle={(isAdded) =>
                handleProductToggle(product.productId, isAdded)
              }
              addText={currentTexts.addText}
              addedText={currentTexts.addedText}
              buttonBackgroundColor={buttonBackgroundColor}
              addedButtonBackgroundColor={addedButtonBackgroundColor}
            />
          ))}
        </ul>
        <TotalPrice
          products={displayedProducts}
          selectedProductIds={selectedProducts}
          currentMarketplace={currentMarketplace}
          discount={finalDiscount}
          totalPriceLabel={currentTexts.totalPriceLabel}
        />
        <Button
          onClick={handleAddToCart}
          text={currentTexts.addToCartText || "Add to cart"}
          classProp={styles.addToCart}
          dataAttribute="add-to-cart"
          isLoading={isAddingToCart}
          disabled={isAddingToCart}
          backgroundColor={buttonBackgroundColor}
        />
        {discountMessageText && (
          <DiscountMessage
            text={discountMessageText}
            classProp={styles.discountMessage}
          />
        )}
      </div>
    </div>
  );
}
