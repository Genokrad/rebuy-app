import { Card, BlockStack, Text } from "@shopify/polaris";

interface ProductDebugProps {
  products: any[];
}

export function ProductDebug({ products }: ProductDebugProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingMd">
          Debug: Products loaded
        </Text>
        <Text as="p" variant="bodyMd">
          Total products: {products.length}
        </Text>
        {products.slice(0, 3).map((product, index) => (
          <div key={index}>
            <Text as="p" variant="bodySm">
              <strong>{product.title}</strong>
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              ID: {product.id}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Image: {product.image?.url || 'No image'}
            </Text>
          </div>
        ))}
      </BlockStack>
    </Card>
  );
}
