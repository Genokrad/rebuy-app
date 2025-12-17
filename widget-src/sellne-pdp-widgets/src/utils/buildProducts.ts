/**
 * Группирует варианты по productId и фильтрует по доступности
 */

import type { Variant, Product } from "../types";

// Реэкспортируем типы для обратной совместимости
export type { Variant, Product } from "../types";

export function buildProductsFromVariants(
  variants: Variant[],
  currentMarketplace: string,
): Product[] {
  const productsMap = new Map<string, Product>();

  variants.forEach((variant) => {
    const productId = variant.productId;

    if (!variant.variantDetails) {
      return;
    }

    // Находим marketPrice для текущего маркетплейса
    const marketPrice = variant.variantDetails.marketsPrice?.find(
      (market) => market.countryCode === currentMarketplace,
    );

    // Получаем массив warehouses из marketPrice
    const warehouses = marketPrice?.warehouses || [];

    // Если есть warehouses, фильтруем inventoryLevels по этим складам
    let totalQuantity = 0;
    let relevantInventoryLevels: Array<{
      id: string;
      quantity: number;
    }> = [];

    if (
      warehouses.length > 0 &&
      Array.isArray(variant.variantDetails.inventoryLevels)
    ) {
      relevantInventoryLevels = variant.variantDetails.inventoryLevels.filter(
        (level) => level.id && warehouses.includes(level.id),
      );
      totalQuantity = relevantInventoryLevels.reduce((sum, level) => {
        return sum + (level.quantity || 0);
      }, 0);
    } else {
      // Если warehouses нет, используем старую логику (поиск по countryCode)
      const currentInventoryLevel =
        variant.variantDetails.inventoryLevels?.find(
          (level) => level.countryCode === currentMarketplace,
        );
      totalQuantity = currentInventoryLevel?.quantity || 0;
    }

    // Проверяем, можно ли добавить этот вариант
    const inventoryPolicy = variant.variantDetails.inventoryPolicy;

    // Вариант добавляется только если:
    // 1. totalQuantity > 0, ИЛИ
    // 2. totalQuantity <= 0 И inventoryPolicy === 'CONTINUE'
    const canAddVariant =
      totalQuantity > 0 ||
      (totalQuantity <= 0 && inventoryPolicy === "CONTINUE");

    if (!canAddVariant) {
      return; // Пропускаем этот вариант
    }

    // Если продукта еще нет в Map, создаем его
    if (!productsMap.has(productId)) {
      productsMap.set(productId, {
        productId: productId,
        productTitle: variant.variantDetails.product?.title || "",
        variants: [],
      });
    }

    // Добавляем вариант к продукту
    const product = productsMap.get(productId);
    if (product) {
      product.variants.push({
        variantId: variant.variantId,
        variantDetails: variant.variantDetails,
        selectedOptions: variant.variantDetails.selectedOptions || undefined,
      });
    }
  });

  return Array.from(productsMap.values()).filter(
    (product) => product.variants.length > 0,
  );
}
