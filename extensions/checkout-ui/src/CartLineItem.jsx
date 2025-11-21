// import "@shopify/ui-extensions/preact";
// import { render } from "preact";

// // 1. Export the extension
// export default async () => {
//   render(<CartLineItemExtension />, document.body);
// };

// function CartLineItemExtension() {
//   // Получаем информацию о текущем товаре в корзине через shopify API
//   // Для target purchase.checkout.cart-line-item.render-after доступен CartLineItemApi
//   // который содержит target как SubscribableSignalLike<CartLine>
//   // @ts-ignore - target доступен через shopify для этого target
//   const target = shopify.target;
//   // Получаем значение из SubscribableSignalLike (если это сигнал) или используем напрямую
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore - получаем CartLine из сигнала или используем напрямую
//   const cartLine = target?.value !== undefined ? target.value : target;

//   if (!cartLine) {
//     return null;
//   }

//   // Проверяем наличие атрибутов Sellence скидки
//   // @ts-ignore - attributes доступен на CartLine
//   const sellenceDiscountAttr = cartLine.attributes?.find(
//     (attr) => attr.key === "_sellence_discount",
//   );
//   // @ts-ignore - attributes доступен на CartLine
//   const sellenceDiscountPercentAttr = cartLine.attributes?.find(
//     (attr) => attr.key === "_sellence_discount_percent",
//   );
//   // @ts-ignore - attributes доступен на CartLine
//   const sellenceOriginalPriceAttr = cartLine.attributes?.find(
//     (attr) => attr.key === "_sellence_original_price",
//   );

//   // Если нет скидки Sellence - ничего не показываем
//   if (
//     !sellenceDiscountAttr ||
//     sellenceDiscountAttr.value !== "true" ||
//     !sellenceDiscountPercentAttr?.value
//   ) {
//     return null;
//   }

//   const discountPercent = parseFloat(sellenceDiscountPercentAttr.value);

//   if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
//     return null;
//   }

//   // Получаем цену из структуры cost
//   // @ts-ignore - cost доступен на CartLine
//   const cost = cartLine.cost;

//   // Получаем валюту для форматирования
//   // @ts-ignore - currencyCode доступен на CartLineCost
//   const currencyCode =
//     cost?.totalAmount?.currencyCode ||
//     // @ts-ignore
//     cost?.amountPerQuantity?.currencyCode ||
//     "USD";

//   // Используем сохраненную оригинальную цену из атрибута (из marketsPrice по маркету)
//   let originalPrice;
//   if (sellenceOriginalPriceAttr?.value) {
//     // Используем сохраненную оригинальную цену из виджета (правильная цена из marketsPrice)
//     originalPrice = parseFloat(String(sellenceOriginalPriceAttr.value));
//   } else {
//     // Fallback: если оригинальная цена не сохранена, не показываем скидку
//     // так как без оригинальной цены мы не можем правильно вычислить сумму скидки
//     console.warn(
//       "Original price not found in attributes, cannot calculate discount amount",
//     );
//     return null;
//   }

//   // Вычисляем сумму скидки напрямую от оригинальной цены и процента скидки
//   // Формула: discountAmount = originalPrice * (discountPercent / 100)
//   // Например: $7.00 * (7 / 100) = $7.00 * 0.07 = $0.49
//   const discountAmount = originalPrice * (discountPercent / 100);

//   console.log("originalPrice:", originalPrice);
//   console.log("discountPercent:", discountPercent, "%");
//   console.log("discountAmount:", discountAmount);

//   // Форматируем сумму скидки (отрицательная сумма, как в примере Rebuy)
//   const formattedDiscount = shopify.i18n.formatCurrency(-discountAmount, {
//     currency: currencyCode,
//   });

//   // Отображаем информацию о скидке под товаром (как в примере Rebuy: "REBUY PRODUCT DISCOUNT (-$X.XX)")
//   return (
//     <s-text tone="neutral">Sellence discount ({formattedDiscount})</s-text>
//   );
// }
