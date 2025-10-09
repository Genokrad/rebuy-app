import { Card, BlockStack, Text } from "@shopify/polaris";
import type { FetcherWithComponents } from "@remix-run/react";

interface WidgetSelectedNotificationProps {
  clickedWidget: string;
  fetcher: FetcherWithComponents<any>;
}

export function WidgetSelectedNotification({
  clickedWidget,
  fetcher,
}: WidgetSelectedNotificationProps) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingMd">
          Widget Selected
        </Text>
        <Text as="p" variant="bodyMd">
          You clicked on: <strong>{clickedWidget}</strong>
        </Text>
        {fetcher.data &&
          (fetcher.data as any).success &&
          (fetcher.data as any).widget && (
            <Text as="p" variant="bodyMd" tone="success">
              ✅ Widget created successfully! ID:{" "}
              {(fetcher.data as any).widget.id}
            </Text>
          )}
        {fetcher.data && (fetcher.data as any).error && (
          <Text as="p" variant="bodyMd" tone="critical">
            ❌ Error: {(fetcher.data as any).error}
          </Text>
        )}
        {fetcher.state === "submitting" && (
          <Text as="p" variant="bodyMd" tone="subdued">
            ⏳ Creating widget...
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

