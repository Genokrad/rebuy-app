import { Text } from "@shopify/polaris";
import React from "react";
import type { ChildProduct } from "./types";

interface Product {
  id: string;
  title: string;
  variants?: Array<{
    id: string;
    title: string;
  }>;
}

interface SelectedChildProductsProps {
  selectedChildProducts: ChildProduct[];
  transformedProducts: Product[];
}

export function SelectedChildProducts({
  selectedChildProducts,
  transformedProducts,
}: SelectedChildProductsProps) {
  if (selectedChildProducts.length === 0) {
    return null;
  }

  return (
    <Text as="p" variant="bodySm" tone="subdued">
      Selected child products: {selectedChildProducts.length}
      {selectedChildProducts.length > 0 && (
        <span>
          {" "}
          (
          {selectedChildProducts
            .map((childProduct) => {
              const product = transformedProducts.find(
                (p) => p.id === childProduct.productId,
              );
              const variant = product?.variants?.find(
                (v: any) => v.id === childProduct.variantId,
              );
              return variant
                ? `${product?.title} - ${variant.title}`
                : product?.title || childProduct.productId;
            })
            .join(", ")}
          )
        </span>
      )}
    </Text>
  );
}
