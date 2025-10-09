import { Layout, Card, BlockStack, Box, Text, Button } from "@shopify/polaris";
import type { WidgetCard } from "./types";

interface WidgetCardsProps {
  widgetCards: WidgetCard[];
  onWidgetClick: (widgetName: string, widgetType: string) => void;
}

export function WidgetCards({ widgetCards, onWidgetClick }: WidgetCardsProps) {
  return (
    <Layout>
      {widgetCards.map((widget) => (
        <Layout.Section key={widget.id} variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Box
                padding="400"
                background="bg-surface"
                borderRadius="200"
                minHeight="80px"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <Text as="span" variant="headingXl">
                    {widget.icon}
                  </Text>
                </div>
              </Box>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  {widget.title}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {widget.description}
                </Text>
              </BlockStack>

              <Button
                variant="primary"
                onClick={() => onWidgetClick(widget.title, widget.type)}
              >
                Create widget
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      ))}
    </Layout>
  );
}

