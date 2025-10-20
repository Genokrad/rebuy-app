import {
  BlockStack,
  Text,
  Layout,
  Card,
} from "@shopify/polaris";
import React, { useState, useCallback } from "react";
import { ProductSelector } from "./ProductSelector";
import { ProductWithVariantsSelector } from "./ProductWithVariantsSelector";
import { SelectedChildProducts } from "./SelectedChildProducts";
import type { ChildProduct } from "./types";

interface Product {
  id: string;
  title: string;
  variants?: Array<{
    id: string;
    title: string;
  }>;
}

interface ProductRelationshipSelectorProps {
  transformedProducts: Product[];
  currentParentProduct: string;
  selectedChildProducts: ChildProduct[];
  existingProducts: any[];
  onParentProductChange: (parentProductId: string) => void;
  onChildProductsChange: (childProducts: ChildProduct[]) => void;
}

export function ProductRelationshipSelector({
  transformedProducts,
  currentParentProduct,
  selectedChildProducts,
  existingProducts,
  onParentProductChange,
  onChildProductsChange,
}: ProductRelationshipSelectorProps) {
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);

  // Функция для преобразования старых данных в новый формат
  const convertToChildProducts = useCallback(
    (childProducts: any[]): ChildProduct[] => {
      return childProducts.map((item: any) => {
        // Если это уже новый формат (объект с productId и variantId)
        if (typeof item === "object" && item.productId) {
          return item;
        }
        // Если это старый формат (просто строка с ID продукта)
        // Находим продукт и берем его первый вариант
        const product = transformedProducts.find((p) => p.id === item);
        if (product && product.variants && product.variants.length > 0) {
          return {
            productId: item,
            variantId: product.variants[0].id,
          };
        }
        // Если продукт без вариантов, возвращаем как есть (но это не должно происходить)
        return {
          productId: item,
          variantId: item, // fallback
        };
      });
    },
    [transformedProducts],
  );

  // Функция для переключения между родительскими продуктами
  const handleParentProductChange = (parentProductId: string) => {
    onParentProductChange(parentProductId);

    // Находим дочерние продукты для выбранного родительского
    const existingRelation = existingProducts.find(
      (rel) => rel.parentProduct === parentProductId,
    );

    if (existingRelation) {
      onChildProductsChange(
        convertToChildProducts(existingRelation.childProducts),
      );
    } else {
      onChildProductsChange([]);
    }

    // Сбрасываем фильтр при переключении родительского продукта
    setShowOnlySelected(false);
  };

  return (
    <Layout>
      <Layout.Section variant="oneHalf">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Parent product
            </Text>
            <ProductSelector
              products={transformedProducts}
              selectedProducts={
                currentParentProduct ? [currentParentProduct] : []
              }
              onSelectionChange={(selectedIds) => {
                if (selectedIds.length > 0) {
                  // Переключаемся на выбранный родительский продукт
                  handleParentProductChange(selectedIds[0]);
                }
              }}
              isMultiSelect={false}
              placeholder="Search for parent product..."
            />
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section variant="oneHalf">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Child products
            </Text>
            {currentParentProduct ? (
              <BlockStack gap="200">
                <SelectedChildProducts
                  selectedChildProducts={selectedChildProducts}
                  transformedProducts={transformedProducts}
                />

                {/* Filter checkbox */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showOnlySelected}
                    onChange={(e) =>
                      setShowOnlySelected(e.target.checked)
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <Text as="span" variant="bodyMd">
                    Show only selected products (
                    {selectedChildProducts.length})
                  </Text>
                </label>

                <ProductWithVariantsSelector
                  products={
                    showOnlySelected
                      ? transformedProducts.filter((p) =>
                          selectedChildProducts.some(
                            (cp) => cp.productId === p.id,
                          ),
                        )
                      : transformedProducts
                  }
                  selectedProducts={selectedChildProducts}
                  onSelectionChange={onChildProductsChange}
                  isMultiSelect={true}
                  placeholder={
                    showOnlySelected
                      ? "All selected products..."
                      : "Search for child products..."
                  }
                />
              </BlockStack>
            ) : (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  background: "#f6f6f7",
                  borderRadius: "4px",
                }}
              >
                <Text as="p" variant="bodyMd" tone="subdued">
                  Please select a parent product first
                </Text>
              </div>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
