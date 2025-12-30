import {
  BlockStack,
  Text,
  Card,
  InlineStack,
  Icon,
  Button,
} from "@shopify/polaris";
import React from "react";
import { DeleteIcon } from "@shopify/polaris-icons";

interface Product {
  id: string;
  title: string;
}

interface ExistingProductRelationshipsProps {
  existingProducts: any[];
  transformedProducts: Product[];
  currentParentProduct: string;
  onParentProductChange: (parentProductId: string) => void;
  onRelationshipSelect?: (
    parentProducts: string | string[],
    childProducts: any[],
  ) => void;
  onRemoveParentProduct?: (
    relationshipIndex: number,
    parentProductId: string,
  ) => void;
  onRemoveRelationship?: (relationshipIndex: number) => void;
}

export function ExistingProductRelationships({
  existingProducts,
  transformedProducts,
  currentParentProduct,
  onParentProductChange,
  onRelationshipSelect,
  onRemoveParentProduct,
  onRemoveRelationship,
}: ExistingProductRelationshipsProps) {
  if (existingProducts.length === 0) {
    return null;
  }

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingMd">
          All Product Relationships ({existingProducts.length})
        </Text>
        <div
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <BlockStack gap="200">
            {existingProducts.map((rel, index) => {
              // Нормализуем parentProduct в массив для отображения
              const parentProductIds = Array.isArray(rel.parentProduct)
                ? rel.parentProduct
                : [rel.parentProduct];

              // Находим все родительские продукты
              const parentProducts = parentProductIds
                .map((id: string) =>
                  transformedProducts.find((p) => p.id === id),
                )
                .filter(Boolean);

              // Проверяем, является ли текущий продукт частью этого relationship
              const isSelected = Array.isArray(rel.parentProduct)
                ? rel.parentProduct.includes(currentParentProduct)
                : rel.parentProduct === currentParentProduct;

              return (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: isSelected ? "#f0f8ff" : "transparent",
                    border: isSelected
                      ? "2px solid #007ace"
                      : "1px solid #e1e3e5",
                    transition: "all 0.2s ease",
                  }}
                >
                  <BlockStack gap="200">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          // При клике устанавливаем все родительские продукты и дочерние продукты из этого relationship
                          if (onRelationshipSelect) {
                            onRelationshipSelect(
                              rel.parentProduct,
                              rel.childProducts,
                            );
                          } else {
                            // Fallback для обратной совместимости
                            onParentProductChange(
                              Array.isArray(rel.parentProduct)
                                ? rel.parentProduct[0] || ""
                                : rel.parentProduct,
                            );
                          }
                        }}
                        style={{
                          flex: 1,
                          textAlign: "left",
                          padding: 0,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "inherit",
                          outline: "none",
                        }}
                      >
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {parentProducts.length > 0
                              ? parentProducts
                                  .map((p: Product | undefined) => p?.title)
                                  .filter(Boolean)
                                  .join(", ") || parentProductIds.join(", ")
                              : parentProductIds.join(", ")}
                            {parentProductIds.length > 1 && (
                              <Text as="span" variant="bodySm" tone="subdued">
                                {" "}
                                ({parentProductIds.length} parents)
                              </Text>
                            )}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Children: {rel.childProducts.length} products
                          </Text>
                        </BlockStack>
                      </button>

                      {/* Кнопка удаления всей связи */}
                      {onRemoveRelationship && (
                        <Button
                          variant="plain"
                          tone="critical"
                          icon={DeleteIcon}
                          onClick={() => {
                            onRemoveRelationship(index);
                          }}
                          accessibilityLabel="Delete entire relationship"
                        />
                      )}
                    </div>

                    {/* Список родительских продуктов с кнопками удаления */}
                    {parentProductIds.length > 1 && onRemoveParentProduct && (
                      <div
                        style={{
                          paddingTop: "8px",
                          borderTop: "1px solid #e1e3e5",
                        }}
                      >
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">
                            Remove parent product:
                          </Text>
                          <InlineStack gap="200" wrap>
                            {parentProductIds.map((parentId: string) => {
                              const parentProduct = transformedProducts.find(
                                (p) => p.id === parentId,
                              );
                              return (
                                <button
                                  key={parentId}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveParentProduct(index, parentId);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid #d1d5db",
                                    backgroundColor: "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    color: "#6b7280",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#fee2e2";
                                    e.currentTarget.style.borderColor =
                                      "#ef4444";
                                    e.currentTarget.style.color = "#dc2626";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#fff";
                                    e.currentTarget.style.borderColor =
                                      "#d1d5db";
                                    e.currentTarget.style.color = "#6b7280";
                                  }}
                                >
                                  <Icon source={DeleteIcon} tone="subdued" />
                                  <span>
                                    {parentProduct?.title || parentId}
                                  </span>
                                </button>
                              );
                            })}
                          </InlineStack>
                        </BlockStack>
                      </div>
                    )}
                  </BlockStack>
                </div>
              );
            })}
          </BlockStack>
        </div>
      </BlockStack>
    </Card>
  );
}
