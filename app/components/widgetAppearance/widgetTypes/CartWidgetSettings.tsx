import { Card, BlockStack, Text } from "@shopify/polaris";
import type { BaseWidgetSettingsProps } from "./types";

export function CartWidgetSettings({
  widgetId,
  settings,
}: BaseWidgetSettingsProps) {
  return (
    <BlockStack gap="200">
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Cart Widget Settings
          </Text>
          <Text as="p" variant="bodyMd">
            Cart widget settings will be implemented here.
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Widget ID: {widgetId}
          </Text>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
