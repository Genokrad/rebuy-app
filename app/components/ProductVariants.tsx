import {
  BlockStack,
  Text,
  InlineStack,
  Thumbnail,
  Badge,
  Card,
} from "@shopify/polaris";
import type { ProductVariant } from "./types";

interface ProductVariantsProps {
  variants: ProductVariant[];
  productTitle: string;
}

export function ProductVariants({
  variants,
  productTitle,
}: ProductVariantsProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm" fontWeight="medium">
          Варианты: {productTitle}
        </Text>

        <BlockStack gap="200">
          {variants.map((variant) => (
            <Card key={variant.id} background="bg-surface-secondary">
              <InlineStack gap="300" align="space-between" blockAlign="center">
                <InlineStack gap="200" align="start">
                  {variant.image && (
                    <Thumbnail
                      source={variant.image.url}
                      alt={variant.title}
                      size="small"
                    />
                  )}

                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      {variant.title}
                    </Text>

                    <InlineStack gap="200" align="start">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Цена: {variant.price}
                      </Text>

                      {variant.compareAtPrice && (
                        <Text as="p" variant="bodySm" tone="critical">
                          Было: {variant.compareAtPrice}
                        </Text>
                      )}
                    </InlineStack>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="200" align="center">
                  <Badge
                    tone={variant.availableForSale ? "success" : "critical"}
                    size="small"
                  >
                    {variant.availableForSale ? "В наличии" : "Нет в наличии"}
                  </Badge>

                  <Text as="p" variant="bodySm" tone="subdued">
                    ID: {variant.id.split("/").pop()}
                  </Text>
                </InlineStack>
              </InlineStack>
            </Card>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
