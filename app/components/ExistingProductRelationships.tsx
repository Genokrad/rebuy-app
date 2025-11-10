import { BlockStack, Text, Card } from "@shopify/polaris";
import React from "react";

interface Product {
  id: string;
  title: string;
}

interface ExistingProductRelationshipsProps {
  existingProducts: any[];
  transformedProducts: Product[];
  currentParentProduct: string;
  onParentProductChange: (parentProductId: string) => void;
}

export function ExistingProductRelationships({
  existingProducts,
  transformedProducts,
  currentParentProduct,
  onParentProductChange,
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
              const parentProduct = transformedProducts.find(
                (p) => p.id === rel.parentProduct,
              );
              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => onParentProductChange(rel.parentProduct)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor:
                      currentParentProduct === rel.parentProduct
                        ? "#f0f8ff"
                        : "transparent",
                    border:
                      currentParentProduct === rel.parentProduct
                        ? "2px solid #007ace"
                        : "1px solid #e1e3e5",
                    color: "inherit",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentParentProduct !== rel.parentProduct) {
                      e.currentTarget.style.backgroundColor = "#f9f9f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentParentProduct !== rel.parentProduct) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {parentProduct?.title || rel.parentProduct}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Children: {rel.childProducts.length} products
                    </Text>
                  </BlockStack>
                </button>
              );
            })}
          </BlockStack>
        </div>
      </BlockStack>
    </Card>
  );
}
