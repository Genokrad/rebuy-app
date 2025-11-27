import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "@remix-run/react";
import { Page, Layout, Text, BlockStack, Card, Badge } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function WidgetAppearanceRoute() {
  const { widgetId } = useParams();
  const [searchParams] = useSearchParams();
  const placementsParam = searchParams.get("placements");
  const placements = useMemo(() => {
    if (!placementsParam) return [];
    try {
      const parsed = JSON.parse(placementsParam);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to parse placements", error);
    }
    return [];
  }, [placementsParam]);

  useEffect(() => {
    if (widgetId) {
      console.log("Widget appearance route opened for:", widgetId);
    }
    if (placements.length > 0) {
      console.log("Placements:", placements);
    }
  }, [widgetId, placements]);

  return (
    <Page>
      <TitleBar title="Widget Appearance" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h1" variant="headingLg">
                Widget Appearance Playground
              </Text>
              <Text as="p" variant="bodyMd">
                Widget ID: {widgetId}
              </Text>
              {placements.length > 0 ? (
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">
                    Placements passed from editor:
                  </Text>
                  <InlinePlacements placements={placements} />
                </BlockStack>
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">
                  No placements were provided. When you open this page from the
                  widget editor we will receive the selected placements and
                  render controls accordingly.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function InlinePlacements({ placements }: { placements: string[] }) {
  return (
    <BlockStack gap="100">
      {placements.map((placement) => (
        <Badge key={placement} tone="info">
          {placement}
        </Badge>
      ))}
    </BlockStack>
  );
}
