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
 * Cart Transform Function для применения скидки Rebuy
 * 
 * Проверяет каждую линию корзины и применяет скидку,
 * если у товара есть attribute '_rebuy_discount' со значением 'true'
 * 
 * @param {RunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const operations = [];

  console.log('input ===>>>>>:', input);

  // Проходим по всем линиям корзины
  for (const line of input.cart.lines) {
    // Получаем attributes через алиасы из GraphQL query
    const rebuyDiscountAttr = line.rebuyDiscount;
    const rebuyDiscountPercentAttr = line.rebuyDiscountPercent;

    // Проверяем, что скидка должна быть применена
    if (rebuyDiscountAttr?.value === "true" && rebuyDiscountPercentAttr?.value) {
      const discountPercent = parseFloat(rebuyDiscountPercentAttr.value);

      // Проверяем, что процент скидки валидный
      if (!isNaN(discountPercent) && discountPercent > 0 && discountPercent <= 100) {
        // Получаем оригинальную цену
        const originalPrice = parseFloat(line.cost?.amountPerQuantity?.amount || "0");

        if (!isNaN(originalPrice) && originalPrice > 0) {
          // Вычисляем цену со скидкой
          const discountedPrice = originalPrice * (1 - discountPercent / 100);

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
            },
          });
        }
      }
    }
  }

  return operations.length > 0 ? { operations } : NO_CHANGES;
};