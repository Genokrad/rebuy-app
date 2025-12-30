/**
 * Оптимизирует URL изображения Shopify для получения миниатюры нужного размера
 * @param imageUrl - Исходный URL изображения Shopify
 * @param width - Ширина миниатюры (по умолчанию 100)
 * @param height - Высота миниатюры (по умолчанию 100)
 * @returns Оптимизированный URL с параметрами размера
 */
export function optimizeShopifyImageUrl(
  imageUrl: string,
  width: number = 100,
  height: number = 100,
): string {
  if (!imageUrl) return imageUrl;

  // Проверяем, является ли это URL Shopify CDN
  const isShopifyCdn = imageUrl.includes("cdn.shopify.com");

  if (!isShopifyCdn) {
    // Если это не Shopify CDN, возвращаем исходный URL
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);

    // Удаляем существующие параметры width и height, если они есть
    url.searchParams.delete("width");
    url.searchParams.delete("height");

    // Добавляем новые параметры для оптимизации
    url.searchParams.set("width", width.toString());
    url.searchParams.set("height", height.toString());

    return url.toString();
  } catch (error) {
    // Если не удалось распарсить URL, возвращаем исходный
    console.warn("Failed to optimize image URL:", error);
    return imageUrl;
  }
}
