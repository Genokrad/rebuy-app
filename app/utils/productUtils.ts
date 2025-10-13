import type { ShopifyProduct, Product } from "../components/types";

export function transformShopifyProducts(shopifyProducts: any[]): Product[] {
  return shopifyProducts.map((product: any) => ({
    id: product.id,
    title: product.title,
    description: product.description || "No description available",
    image: product.image?.url || undefined,
  }));
}
