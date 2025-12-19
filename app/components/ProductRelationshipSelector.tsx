import { BlockStack, Text, Layout, Card } from "@shopify/polaris";
import React, { useState, useCallback, useMemo } from "react";
import { ProductSelector } from "./ProductSelector";
import { ProductWithVariantsSelector } from "./ProductWithVariantsSelector";
import { SelectedChildProducts } from "./SelectedChildProducts";
import type { ChildProduct } from "./types";

interface Product {
  id: string;
  title: string;
  description: string;
  variants?: Array<{
    id: string;
    title: string;
    price: string;
    compareAtPrice?: string;
    availableForSale: boolean;
    image?: {
      url: string;
      altText?: string;
    };
  }>;
}

interface ProductRelationshipSelectorProps {
  transformedProducts: Product[];
  currentParentProducts: string | string[]; // Support both single and array for backward compatibility
  selectedChildProducts: ChildProduct[];
  existingProducts: any[];
  onParentProductsChange: (parentProductIds: string | string[]) => void;
  onChildProductsChange: (childProducts: ChildProduct[]) => void;
}

export function ProductRelationshipSelector({
  transformedProducts,
  currentParentProducts,
  selectedChildProducts,
  existingProducts,
  onParentProductsChange,
  onChildProductsChange,
}: ProductRelationshipSelectorProps) {
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);
  const [showOnlySelectedParents, setShowOnlySelectedParents] =
    useState<boolean>(false);

  // Функция для нормализации ID продукта (убираем префикс gid://shopify/Product/ если есть)
  const normalizeProductId = (id: string | null | undefined): string => {
    if (!id) return "";
    // Если это GID формат, извлекаем числовой ID
    if (id.startsWith("gid://shopify/Product/")) {
      return id.replace("gid://shopify/Product/", "");
    }
    return id;
  };

  // Нормализуем currentParentProducts в массив для удобства работы
  const currentParentProductsArray = useMemo(() => {
    let normalized: string[];
    if (Array.isArray(currentParentProducts)) {
      normalized = currentParentProducts.map(normalizeProductId);
    } else {
      normalized = currentParentProducts
        ? [normalizeProductId(currentParentProducts)]
        : [];
    }
    return normalized;
  }, [currentParentProducts]);

  // Вычисляем selectedProducts для ProductSelector (ID в формате product.id)
  const selectedParentProductsForSelector = useMemo(() => {
    return transformedProducts
      .filter((p) => {
        const normalizedProductId = normalizeProductId(p.id);
        return currentParentProductsArray.includes(normalizedProductId);
      })
      .map((p) => p.id);
  }, [transformedProducts, currentParentProductsArray]);

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

  // Функция для изменения родительских продуктов
  const handleParentProductsChange = (selectedIds: string[]) => {
    // Нормализуем выбранные ID (они могут быть в формате GID)
    const normalizedIds = selectedIds.map(normalizeProductId);

    // Если выбран только один продукт, сохраняем как строку для обратной совместимости
    // Если выбрано несколько, сохраняем как массив
    const newParentProducts =
      normalizedIds.length === 1 ? normalizedIds[0] : normalizedIds;
    onParentProductsChange(newParentProducts);

    // Находим дочерние продукты для выбранных родительских
    // Ищем relationship, где parentProduct содержит любой из выбранных ID
    // Используем нормализованные ID для поиска
    const existingRelation = existingProducts.find((rel) => {
      const normalizeRelParent = (parent: string | string[]): string[] => {
        if (Array.isArray(parent)) {
          return parent.map(normalizeProductId);
        }
        return [normalizeProductId(parent)];
      };
      const normalizedRelParent = normalizeRelParent(rel.parentProduct);
      return normalizedIds.some((id) => normalizedRelParent.includes(id));
    });

    if (existingRelation) {
      onChildProductsChange(
        convertToChildProducts(existingRelation.childProducts),
      );
    } else {
      onChildProductsChange([]);
    }

    // Сбрасываем фильтры при переключении родительских продуктов
    setShowOnlySelected(false);
    setShowOnlySelectedParents(false);
  };

  return (
    <Layout>
      <Layout.Section variant="oneHalf">
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              Parent products
            </Text>
            {/* Filter checkbox for parent products */}
            {currentParentProductsArray.length > 0 && (
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
                  checked={showOnlySelectedParents}
                  onChange={(e) => setShowOnlySelectedParents(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <Text as="span" variant="bodyMd">
                  Show only selected products (
                  {currentParentProductsArray.length})
                </Text>
              </label>
            )}
            <ProductSelector
              products={
                showOnlySelectedParents
                  ? transformedProducts.filter((p) => {
                      const normalizedProductId = normalizeProductId(p.id);
                      return currentParentProductsArray.includes(
                        normalizedProductId,
                      );
                    })
                  : transformedProducts
              }
              selectedProducts={selectedParentProductsForSelector}
              onSelectionChange={(selectedIds) => {
                // Нормализуем выбранные ID перед передачей
                const normalizedIds = selectedIds.map(normalizeProductId);
                handleParentProductsChange(normalizedIds);
              }}
              isMultiSelect={true}
              placeholder={
                showOnlySelectedParents
                  ? "All selected products..."
                  : "Search for parent products..."
              }
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
            {currentParentProductsArray.length > 0 ? (
              <BlockStack gap="200">
                <SelectedChildProducts
                  selectedChildProducts={selectedChildProducts}
                  transformedProducts={transformedProducts}
                  onReorder={onChildProductsChange}
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
                    onChange={(e) => setShowOnlySelected(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <Text as="span" variant="bodyMd">
                    Show only selected products ({selectedChildProducts.length})
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
