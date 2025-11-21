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

  // Если есть промокод — не применяем скидку Sellence
  if (hasDiscountCode) {
    console.log('🎯 DISCOUNT CODE FOUND IN CART - Skipping Sellence discount');
    console.log('Discount code value:', hasDiscountCodeAttr.value);
    return NO_CHANGES;
  }

  // Проходим по всем линиям корзины
  for (const line of input.cart.lines) {
    // Получаем attributes через алиасы из GraphQL query
    const sellenceDiscountAttr = line.sellenceDiscount;
    const sellenceDiscountPercentAttr = line.sellenceDiscountPercent;

    // Проверяем, что скидка должна быть применена
    if (sellenceDiscountAttr?.value === "true" && sellenceDiscountPercentAttr?.value) {
      const discountPercent = parseFloat(sellenceDiscountPercentAttr.value);

      // Проверяем, что процент скидки валидный
      if (!isNaN(discountPercent) && discountPercent > 0 && discountPercent <= 100) {
        // Получаем оригинальную цену и валюту
        const originalPrice = parseFloat(line.cost?.amountPerQuantity?.amount || "0");
        const currencyCode = line.cost?.amountPerQuantity?.currencyCode || "USD";

        if (!isNaN(originalPrice) && originalPrice > 0) {
          // Вычисляем цену со скидкой
          const discountedPrice = originalPrice * (1 - discountPercent / 100);

          // Вычисляем сумму скидки (разница между оригинальной и скидочной ценой)
          const discountAmount = originalPrice - discountedPrice;

          // Создаем операцию для обновления цены
          // Для JavaScript amount может быть числом или строкой
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
              // Добавляем информацию о скидке в title через суффикс
              // Формат: "Original Title | Sellence discount: -$5.00"
              // Но это не очень хорошее решение, так как изменяет название товара
              // Вместо этого, информацию о скидке мы будем хранить в атрибутах,
              // которые уже установлены при добавлении товара
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