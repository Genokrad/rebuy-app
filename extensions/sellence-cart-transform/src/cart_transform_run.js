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

  // Проверяем, нужно ли применять скидку ко всей корзине
  const applyDiscountToEntireOrderAttr = input.cart?.applyDiscountToEntireOrder;
  const applyDiscountToEntireOrder = applyDiscountToEntireOrderAttr?.value === 'true';

  console.log('=== CART TRANSFORM INPUT ===');
  console.log('Has discount code attribute:', hasDiscountCodeAttr);
  console.log('Has discount code:', hasDiscountCode);
  console.log('Apply discount to entire order:', applyDiscountToEntireOrder);

  // Находим бесплатный товар и первый обычный товар
  let freeProductLine = null;
  let firstRegularLine = null;

  for (const line of input.cart.lines) {
    const freeProductAttr = line.freeProduct;
    if (freeProductAttr?.value === 'true') {
      freeProductLine = line;
      console.log(`🎁 Found free product line: ${line.id}`);
    } else if (!firstRegularLine) {
      // Первый товар, который не является бесплатным
      firstRegularLine = line;
    }
  }

  // Если есть бесплатный товар и есть хотя бы один обычный товар
  if (freeProductLine && firstRegularLine && 'id' in firstRegularLine.merchandise && firstRegularLine.merchandise.id) {
    // Сначала делаем бесплатный товар бесплатным (цена = 0)
    operations.push({
      lineUpdate: {
        cartLineId: freeProductLine.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: "0.00",
            },
          },
        },
      },
    });

    // Затем объединяем бесплатный товар с первым обычным товаром
    // parentVariantId - это ID варианта, который будет представлять объединенную линию (основной товар)
    // cartLines - массив линий для объединения
    const parentVariantId = 'id' in firstRegularLine.merchandise ? firstRegularLine.merchandise.id : null;
    if (parentVariantId) {
      operations.push({
        linesMerge: {
          parentVariantId: parentVariantId,
          cartLines: [
            {
              cartLineId: firstRegularLine.id,
              quantity: firstRegularLine.quantity,
            },
            {
              cartLineId: freeProductLine.id,
              quantity: freeProductLine.quantity,
            },
          ],
        },
      });
    }

    const currencyCode = firstRegularLine.cost?.amountPerQuantity?.currencyCode || "USD";
    console.log(`🎁 FREE PRODUCT - Merging free product (line ${freeProductLine.id}) with regular product (line ${firstRegularLine.id})`);
    if (parentVariantId) {
      console.log(`  Parent variant ID: ${parentVariantId}`);
    }
    console.log(`  Free product price set to: 0.00 ${currencyCode}`);
  }

  // Проверяем, есть ли хотя бы один товар с атрибутами Sellence в корзине
  // Это нужно для случая, когда пользователь удалил все товары Sellence, но остался товар с атрибутами
  let hasAnySellenceProduct = false;
  let sellenceDiscountPercent = null;

  // Сначала проверяем все товары на наличие атрибутов Sellence
  for (const line of input.cart.lines) {
    const sellenceDiscountAttr = line.sellenceDiscount;
    const sellenceDiscountPercentAttr = line.sellenceDiscountPercent;

    if (sellenceDiscountAttr?.value === "true" && sellenceDiscountPercentAttr?.value) {
      hasAnySellenceProduct = true;

      // Если нужно применять скидку ко всей корзине, сохраняем процент скидки из первого товара
      if (applyDiscountToEntireOrder && sellenceDiscountPercent === null) {
        sellenceDiscountPercent = parseFloat(sellenceDiscountPercentAttr.value);
        console.log(`🎯 APPLY TO ENTIRE ORDER - Found first Sellence product with discount:`, {
          lineId: line.id,
          discountPercent: sellenceDiscountPercent,
        });
      }
    }
  }

  // Если нет товаров с атрибутами Sellence, не применяем скидку ни к одному товару
  if (!hasAnySellenceProduct) {
    console.log(`⚠️ No Sellence products found in cart, skipping discount application`);
    return NO_CHANGES;
  }

  // Проходим по всем линиям корзины
  for (const line of input.cart.lines) {
    // Пропускаем бесплатный товар, так как мы уже обработали его выше
    if (line.freeProduct?.value === 'true') {
      continue;
    }
    // Пропускаем первую обычную линию, если она уже смерджится с бесплатным товаром
    if (freeProductLine && firstRegularLine && line.id === firstRegularLine.id) {
      continue;
    }
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
    // Если нужно применять скидку ко всей корзине, применяем скидку из первого товара ко всем товарам
    // Но только если есть хотя бы один товар с атрибутами Sellence в корзине
    if (!hasDiscountCode && hasAnySellenceProduct) {
      let discountPercentToApply = null;

      if (applyDiscountToEntireOrder && sellenceDiscountPercent !== null) {
        // Применяем скидку из первого товара ко всем товарам в корзине
        discountPercentToApply = sellenceDiscountPercent;
        console.log(`🎯 APPLY TO ENTIRE ORDER - Applying discount ${discountPercentToApply}% to line ${line.id}`);
      } else if (sellenceDiscountAttr?.value === "true" && sellenceDiscountPercentAttr?.value) {
        // Стандартная логика: применяем скидку только к товарам с атрибутом
        discountPercentToApply = parseFloat(sellenceDiscountPercentAttr.value);
      }

      // Проверяем, что процент скидки валидный
      if (discountPercentToApply !== null && !isNaN(discountPercentToApply) && discountPercentToApply > 0 && discountPercentToApply <= 100) {
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
          const discountedPrice = originalPrice * (1 - discountPercentToApply / 100);

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
          console.log(`  Discount percent: ${discountPercentToApply}%`);
          if (applyDiscountToEntireOrder) {
            console.log(`  Applied to entire order: true`);
          }
        }
      }
    }
  }

  return operations.length > 0 ? { operations } : NO_CHANGES;
}