import {
  Text,
  InlineStack,
  Thumbnail,
  BlockStack,
  Card,
  Badge,
} from "@shopify/polaris";
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
    <Card>
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm" fontWeight="medium">
          Выбранные товары ({selectedChildProducts.length})
        </Text>

        <BlockStack gap="200">
          {selectedChildProducts.map((childProduct, index) => {
            const product = transformedProducts.find(
              (p) => p.id === childProduct.productId,
            );
            const variant = product?.variants?.find(
              (v: any) => v.id === childProduct.variantId,
            );

            return (
              <Card
                key={`${childProduct.productId}-${childProduct.variantId}`}
                background="bg-surface-secondary"
              >
                <InlineStack
                  gap="300"
                  align="space-between"
                  blockAlign="center"
                >
                  <InlineStack gap="200" align="start">
                    {(childProduct.variantDetails?.image || variant?.image) && (
                      <Thumbnail
                        source={
                          childProduct.variantDetails?.image?.url ||
                          variant?.image?.url ||
                          ""
                        }
                        alt={variant?.title || "Product"}
                        size="small"
                      />
                    )}

                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="medium">
                        {product?.title || childProduct.productId}
                      </Text>

                      {variant && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          Вариант: {variant.title}
                        </Text>
                      )}

                      <InlineStack gap="200" align="start">
                        <Text as="p" variant="bodySm" tone="subdued">
                          Цена: {variant?.price || "N/A"}
                        </Text>

                        {variant?.compareAtPrice && (
                          <Text as="p" variant="bodySm" tone="critical">
                            Было: {variant.compareAtPrice}
                          </Text>
                        )}
                      </InlineStack>
                    </BlockStack>
                  </InlineStack>

                  <InlineStack gap="200" align="center">
                    <Badge
                      tone={variant?.availableForSale ? "success" : "critical"}
                      size="small"
                    >
                      {variant?.availableForSale
                        ? "В наличии"
                        : "Нет в наличии"}
                    </Badge>

                    <Text as="p" variant="bodySm" tone="subdued">
                      ID: {childProduct.variantId.split("/").pop()}
                    </Text>
                  </InlineStack>
                </InlineStack>
              </Card>
            );
          })}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
