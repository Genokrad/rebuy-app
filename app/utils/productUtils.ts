import type { Product } from "../components/types";

export function transformShopifyProducts(shopifyProducts: any[]): Product[] {
  return shopifyProducts.map((product: any) => ({
    id: product.id,
    title: product.title,
    description: product.description || "No description available",
    image: product.image?.url || undefined,
    handle: product.handle || "",
    status: product.status || "unknown",
    variants:
      product.variants?.edges?.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        price: edge.node.price,
        compareAtPrice: edge.node.compareAtPrice,
        availableForSale: edge.node.availableForSale,
        image: edge.node.image
          ? {
              url: edge.node.image.url,
              altText: edge.node.image.altText,
            }
          : undefined,
      })) || [],
  }));
}
