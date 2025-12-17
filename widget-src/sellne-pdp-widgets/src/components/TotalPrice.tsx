import { useMemo } from "react";
import type { Product } from "../types";
import { CURRENCY_SYMBOLS } from "../utils/currencySymbols";
import styles from "../App.module.css";

interface TotalPriceProps {
  products: Product[];
  selectedProductIds: Set<string>;
  currentMarketplace?: string;
  discount: number;
}

export function TotalPrice({
  products,
  selectedProductIds,
  currentMarketplace,
  discount,
}: TotalPriceProps) {
  // Вычисляем общую сумму выбранных товаров
  const totalPrice = useMemo(() => {
    let total = 0;
    let currencyCode = "";

    // Проходим по всем выбранным товарам
    products.forEach((product) => {
      if (!selectedProductIds.has(product.productId)) {
        return; // Пропускаем невыбранные товары
      }

      // Берем первый доступный вариант (или можно использовать выбранный вариант)
      const variant = product.variants[0];
      if (!variant?.variantDetails) {
        return;
      }

      // Получаем цену для текущего маркетплейса
      let price = variant.variantDetails.price || "";
      let variantCurrencyCode = variant.variantDetails.currencyCode || "";

      if (currentMarketplace && variant.variantDetails.marketsPrice) {
        const marketPrice = variant.variantDetails.marketsPrice.find(
          (mp) => mp.countryCode === currentMarketplace,
        );
        if (marketPrice) {
          price = marketPrice.price || price;
          variantCurrencyCode = marketPrice.currencyCode || variantCurrencyCode;
        }
      }

      // Извлекаем числовое значение цены
      if (price) {
        const priceMatch = price.replace(/[^\d.]/g, "");
        const numericPrice = priceMatch ? parseFloat(priceMatch) : 0;
        total += numericPrice;
        if (!currencyCode && variantCurrencyCode) {
          currencyCode = variantCurrencyCode;
        }
      }
    });

    // Применяем скидку
    if (discount > 0 && total > 0) {
      total = total * (1 - discount / 100);
    }

    return { total, currencyCode };
  }, [products, selectedProductIds, currentMarketplace, discount]);

  const { total, currencyCode } = totalPrice;

  // Если итоговая сумма 0, вообще не отображаем блок Total Price
  if (total === 0) {
    return null;
  }

  // Форматируем общую цену
  const currencySymbol = currencyCode
    ? CURRENCY_SYMBOLS[currencyCode] || currencyCode
    : "";

  const formattedTotalPrice = currencySymbol
    ? `${currencySymbol}${total.toFixed(2)}`
    : total.toFixed(2);

  return (
    <div className={styles.totalPrice}>
      <p className={styles.totalPriceNew}>
        <span>Total Price:</span>{" "}
        <span className={styles.totalPrice}>{formattedTotalPrice}</span>
      </p>
    </div>
  );
}
