// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 * @typedef {import("../generated/api").Operation} Operation
 */

/**
 * @type {CartTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * Cart Transform Function для применения скидки Sellence
 * 
 * Проверяет каждую линию корзины и применяет скидку,
 * если у товара есть attribute '_sellence_discount' со значением 'true'
 * 
 * @param {RunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const operations = [];

  // Проверяем наличие промокода через атрибут корзины
  // Атрибут устанавливается в Checkout UI Extension при применении промокода
  const hasDiscountCodeAttr = input.cart?.hasDiscountCode;
  const hasDiscountCode = hasDiscountCodeAttr?.value && hasDiscountCodeAttr.value.trim() !== '';

  console.log('=== CART TRANSFORM INPUT ===');
  console.log('Has discount code attribute:', hasDiscountCodeAttr);
  console.log('Has discount code:', hasDiscountCode);

  // Проходим по всем линиям корзины
  for (const line of input.cart.lines) {
    // Получаем attributes через алиасы из GraphQL query
    const sellenceDiscountAttr = line.sellenceDiscount;
    const sellenceDiscountPercentAttr = line.sellenceDiscountPercent;
    const sellenceOriginalPriceAttr = line.sellenceOriginalPrice;

    // Если есть промокод и у товара есть оригинальная цена — возвращаем цену на оригинальную
    if (hasDiscountCode && sellenceOriginalPriceAttr?.value) {
      const originalPrice = parseFloat(sellenceOriginalPriceAttr.value);
      const currencyCode = line.cost?.amountPerQuantity?.currencyCode || "USD";

      if (!isNaN(originalPrice) && originalPrice > 0) {
        // Возвращаем цену на оригинальную (отменяем скидку Sellence)
        operations.push({
          lineUpdate: {
            cartLineId: line.id,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: originalPrice,
                },
              },
            },
          },
        });

        console.log(`🎯 PROMO CODE APPLIED - Restoring original price for line ${line.id}:`);
        console.log(`  Original price: ${originalPrice} ${currencyCode}`);
        continue; // Переходим к следующей линии корзины
      }
    }

    // Если промокода нет или у товара нет оригинальной цены — применяем стандартную логику Sellence
    // Проверяем, что скидка должна быть применена
    if (!hasDiscountCode && sellenceDiscountAttr?.value === "true" && sellenceDiscountPercentAttr?.value) {
      const discountPercent = parseFloat(sellenceDiscountPercentAttr.value);

      // Проверяем, что процент скидки валидный
      if (!isNaN(discountPercent) && discountPercent > 0 && discountPercent <= 100) {
        // Получаем оригинальную цену и валюту
        // Если есть сохраненная оригинальная цена в атрибуте, используем её
        // Иначе используем текущую цену из cost
        let originalPrice;
        if (sellenceOriginalPriceAttr?.value) {
          originalPrice = parseFloat(sellenceOriginalPriceAttr.value);
        } else {
          originalPrice = parseFloat(line.cost?.amountPerQuantity?.amount || "0");
        }
        const currencyCode = line.cost?.amountPerQuantity?.currencyCode || "USD";

        if (!isNaN(originalPrice) && originalPrice > 0) {
          // Вычисляем цену со скидкой
          const discountedPrice = originalPrice * (1 - discountPercent / 100);

          // Вычисляем сумму скидки (разница между оригинальной и скидочной ценой)
          const discountAmount = originalPrice - discountedPrice;

          // Создаем операцию для обновления цены
          operations.push({
            lineUpdate: {
              cartLineId: line.id,
              price: {
                adjustment: {
                  fixedPricePerUnit: {
                    amount: discountedPrice,
                  },
                },
              },
            },
          });

          console.log(`Applied Sellence discount to line ${line.id}:`);
          console.log(`  Original price: ${originalPrice} ${currencyCode}`);
          console.log(`  Discounted price: ${discountedPrice} ${currencyCode}`);
          console.log(`  Discount amount: ${discountAmount} ${currencyCode}`);
        }
      }
    }
  }

  return operations.length > 0 ? { operations } : NO_CHANGES;
}