import {
  TextField,
  BlockStack,
  Text,
  Checkbox,
  InlineStack,
  Thumbnail,
} from "@shopify/polaris";
import { useState } from "react";

interface Product {
  id: string;
  title: string;
  description: string;
  image?: string;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: string[];
  onSelectionChange: (productIds: string[]) => void;
  isMultiSelect?: boolean;
  placeholder?: string;
}

export function ProductSelector({
  products,
  selectedProducts,
  onSelectionChange,
  isMultiSelect = false,
  placeholder = "Search products...",
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleProductSelect = (productId: string) => {
    if (isMultiSelect) {
      const newSelection = selectedProducts.includes(productId)
        ? selectedProducts.filter((id) => id !== productId)
        : [...selectedProducts, productId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([productId]);
    }
  };

  return (
    <BlockStack gap="300">
      <TextField
        label=""
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={placeholder}
        prefix="🔍"
        autoComplete="off"
      />

      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #e1e3e5",
          borderRadius: "4px",
          padding: "8px",
        }}
      >
        <BlockStack gap="200">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductSelect(product.id)}
              style={{
                padding: "12px",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: selectedProducts.includes(product.id)
                  ? "#f0f8ff"
                  : "transparent",
                border: selectedProducts.includes(product.id)
                  ? "1px solid #007ace"
                  : "1px solid transparent",
              }}
            >
              <InlineStack gap="300" align="start">
                {isMultiSelect && (
                  <Checkbox
                    label=""
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleProductSelect(product.id)}
                  />
                )}

                {product.image && (
                  <Thumbnail
                    source={product.image}
                    alt={product.title}
                    size="small"
                  />
                )}

                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {product.title}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {product.description}
                  </Text>
                </BlockStack>
              </InlineStack>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
              No products found
            </Text>
          )}
        </BlockStack>
      </div>
    </BlockStack>
  );
}
