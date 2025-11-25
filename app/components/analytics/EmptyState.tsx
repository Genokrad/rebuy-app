import { Card, BlockStack, Text } from "@shopify/polaris";

export function EmptyState() {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd">
          No orders found for the selected date range
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Orders will appear here after customers make purchases through Sellence
          widgets
        </Text>
      </BlockStack>
    </Card>
  );
}

