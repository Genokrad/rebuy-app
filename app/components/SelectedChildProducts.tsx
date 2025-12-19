import {
  Text,
  InlineStack,
  Thumbnail,
  BlockStack,
  Card,
  Badge,
} from "@shopify/polaris";
import React, { useState } from "react";
import type { ChildProduct, ProductVariant } from "./types";

interface Product {
  id: string;
  title: string;
  variants?: ProductVariant[];
}

interface SelectedChildProductsProps {
  selectedChildProducts: ChildProduct[];
  transformedProducts: Product[];
  onReorder?: (next: ChildProduct[]) => void;
}

export function SelectedChildProducts({
  selectedChildProducts,
  transformedProducts,
  onReorder,
}: SelectedChildProductsProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Функция для нормализации ID продукта (убираем префикс gid://shopify/Product/ если есть)
  const normalizeProductId = (id: string | null | undefined): string => {
    if (!id) return "";
    // Если это GID формат, извлекаем числовой ID
    if (id.startsWith("gid://shopify/Product/")) {
      return id.replace("gid://shopify/Product/", "");
    }
    return id;
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex || !onReorder) {
      setDragIndex(null);
      return;
    }

    const next = [...selectedChildProducts];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    onReorder(next);
  };

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
            // Нормализуем ID для сравнения
            const normalizedChildProductId = normalizeProductId(
              childProduct.productId,
            );
            const product = transformedProducts.find((p) => {
              const normalizedPId = normalizeProductId(p.id);
              return normalizedPId === normalizedChildProductId;
            });
            const variant = product?.variants?.find(
              (v: any) => v.id === childProduct.variantId,
            );

            return (
              <div
                key={`${childProduct.productId}-${childProduct.variantId}`}
                draggable={!!onReorder}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
              >
                <Card background="bg-surface-secondary">
                  <InlineStack
                    gap="300"
                    align="space-between"
                    blockAlign="center"
                  >
                    <InlineStack gap="200" align="start">
                      {(childProduct.variantDetails?.image ||
                        variant?.image) && (
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
                        tone={
                          variant?.availableForSale ? "success" : "critical"
                        }
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
              </div>
            );
          })}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
