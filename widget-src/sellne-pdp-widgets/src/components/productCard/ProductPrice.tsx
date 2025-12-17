import { useMemo } from "react";
import { CURRENCY_SYMBOLS } from "../../utils/currencySymbols";
import type { ProductPriceProps } from "../../types";
import styles from "./ProductCard.module.css";

export function ProductPrice({
  price,
  compareAtPrice,
  currencyCode,
  discount = 0,
}: ProductPriceProps) {
  // Извлекаем числовое значение цены
  const numericPrice = useMemo(() => {
    if (!price) return 0;
    // Убираем все символы кроме цифр и точки
    const priceMatch = price.replace(/[^\d.]/g, "");
    return priceMatch ? parseFloat(priceMatch) : 0;
  }, [price]);

  // Извлекаем числовое значение перечеркнутой цены
  const numericCompareAtPrice = useMemo(() => {
    if (!compareAtPrice) return 0;
    // Убираем все символы кроме цифр и точки
    const priceMatch = compareAtPrice.replace(/[^\d.]/g, "");
    return priceMatch ? parseFloat(priceMatch) : 0;
  }, [compareAtPrice]);

  // Вычисляем цену со скидкой
  const discountedPrice = useMemo(() => {
    if (discount > 0 && numericPrice > 0) {
      return numericPrice * (1 - discount / 100);
    }
    return numericPrice;
  }, [numericPrice, discount]);

  // Получаем символ валюты
  const currencySymbol = currencyCode
    ? CURRENCY_SYMBOLS[currencyCode] || currencyCode
    : "";

  // Извлекаем символ валюты из исходной цены, если не указан currencyCode
  const extractedSymbol = useMemo(() => {
    if (currencySymbol) return currencySymbol;
    if (!price) return "";
    // Пытаемся извлечь символ валюты из начала строки
    const symbolMatch = price.match(/^[^\d\s]+/);
    return symbolMatch ? symbolMatch[0].trim() : "";
  }, [price, currencySymbol]);

  // Форматируем цену
  const formatPrice = (value: number) => {
    const formatted = value.toFixed(2);
    return extractedSymbol ? `${extractedSymbol}${formatted}` : formatted;
  };

  // Форматируем перечеркнутую цену (используем символ валюты из price или compareAtPrice)
  const formatCompareAtPrice = (value: number) => {
    const formatted = value.toFixed(2);
    // Пытаемся извлечь символ валюты из compareAtPrice, если его нет в price
    let symbol = extractedSymbol;
    if (!symbol && compareAtPrice) {
      const symbolMatch = compareAtPrice.match(/^[^\d\s]+/);
      symbol = symbolMatch ? symbolMatch[0].trim() : "";
    }
    return symbol ? `${symbol}${formatted}` : formatted;
  };

  const hasDiscount = discount > 0 && discountedPrice < numericPrice;
  const showCompareAtPrice =
    compareAtPrice && compareAtPrice !== price && compareAtPrice !== "";

  return (
    <div className={styles.itemPrice}>
      {hasDiscount ? (
        <>
          <p className={styles.priceOld}>
            <span>{formatPrice(numericPrice)}</span>
          </p>
          <p className={styles.priceNew}>
            <span>{formatPrice(discountedPrice)}</span>
          </p>
        </>
      ) : (
        <>
          <p className={styles.priceNew}>
            <span>{price}</span>
          </p>
          {showCompareAtPrice && (
            <p className={styles.priceOld}>
              <span>
                {numericCompareAtPrice > 0
                  ? formatCompareAtPrice(numericCompareAtPrice)
                  : compareAtPrice}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
