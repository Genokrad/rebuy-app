import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  DataTable,
} from "@shopify/polaris";

export interface WidgetClickStat {
  widgetId: string;
  widgetType: string;
  clickCount: number;
  percentage: number;
}

interface WidgetClicksStatsProps {
  stats: WidgetClickStat[];
}

export function WidgetClicksStats({ stats }: WidgetClicksStatsProps) {
  if (!stats || stats.length === 0) {
    return (
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Widget Clicks Overview
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            We haven’t recorded any widget clicks yet. Once shoppers start
            interacting with your widgets, click stats will appear here.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const totalClicks = stats.reduce((sum, item) => sum + item.clickCount, 0);
  const topWidget = stats[0];
  const dataRows = stats.map((item) => [
    item.widgetId,
    item.widgetType,
    `${item.clickCount}`,
    `${item.percentage}%`,
  ]);

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              Widget Clicks Overview
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Track the number of times shoppers interacted with your widgets.
            </Text>
          </BlockStack>

          <BlockStack gap="050" align="end">
            <Text as="span" tone="subdued" variant="bodySm">
              Total clicks
            </Text>
            <Text as="p" variant="headingLg">
              {totalClicks}
            </Text>
          </BlockStack>
        </InlineStack>

        {topWidget && (
          <InlineStack gap="300" align="start" blockAlign="center">
            <Badge tone="success">Top widget</Badge>
            <Text as="p" variant="bodyMd">
              {topWidget.widgetId} • {topWidget.widgetType} •{" "}
              {topWidget.clickCount} clicks ({topWidget.percentage}%)
            </Text>
          </InlineStack>
        )}

        <DataTable
          columnContentTypes={["text", "text", "numeric", "numeric"]}
          headings={["Widget ID", "Widget Type", "Clicks", "Share"]}
          rows={dataRows}
        />
      </BlockStack>
    </Card>
  );
}
