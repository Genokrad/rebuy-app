import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useSearchParams,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { Page, Layout, Text, BlockStack, Card, Badge } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  WidgetAppearancePreviewLite,
  type PreviewTexts,
} from "../components/widgetAppearance/WidgetAppearancePreviewLite";
import { WidgetAppearanceControls } from "../components/widgetAppearance/WidgetAppearanceControls";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getWidgetById, updateWidget } from "../services/widgetService";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { widgetId: paramWidgetId } = params;
  await authenticate.admin(request);
  const widgetId = paramWidgetId;

  if (!widgetId) {
    return json(
      { success: false, error: "Widget ID is required" },
      { status: 400 },
    );
  }

  const widget = await getWidgetById(widgetId);
  if (!widget) {
    return json({ success: false, error: "Widget not found" }, { status: 404 });
  }

  // appearanceTexts лежат в settings
  const appearanceTexts =
    ((widget as any).settings?.appearanceTexts as Record<
      string,
      PreviewTexts
    >) || {};

  return json({
    success: true,
    widgetId,
    appearanceTexts,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { widgetId: paramWidgetId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const widgetId = (formData.get("widgetId") as string) || paramWidgetId;
  const previewTextsRaw = formData.get("previewTexts") as string | null;

  if (intent !== "saveTexts" || !widgetId || !previewTextsRaw) {
    return json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    await authenticate.admin(request);
    const widget = await getWidgetById(widgetId);
    if (!widget) {
      return json(
        { success: false, error: "Widget not found" },
        { status: 404 },
      );
    }

    const parsedTexts = JSON.parse(previewTextsRaw);

    // Сохраняем в settings под ключом appearanceTexts, не трогая остальные настройки
    const nextSettings = {
      ...(widget as any).settings,
      appearanceTexts: parsedTexts,
    };

    await updateWidget(
      widgetId,
      widget.name,
      widget.type,
      widget.products,
      nextSettings,
    );

    return json({ success: true });
  } catch (error) {
    console.error("Failed to save appearance texts", error);
    return json(
      { success: false, error: "Failed to save appearance texts" },
      { status: 500 },
    );
  }
};

export default function WidgetAppearanceRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const { widgetId } = useParams();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<typeof action>();
  const placementsParam = searchParams.get("placements");
  const availableLocales = [
    "en",
    "uk",
    "it",
    "sk",
    "hr",
    "el",
    "cs",
    "da",
    "fi",
    "hu",
    "fr",
    "de",
    "no",
    "pt",
    "ro",
    "sl",
    "sv",
    "pl",
    "nl",
    "es",
  ];
  const initialAppearanceTexts = (loaderData as any).appearanceTexts || {};

  const initialLocale = Object.keys(initialAppearanceTexts)[0] || "en";
  const [currentLocale, setCurrentLocale] = useState(initialLocale);
  const [previewTextsByLocale, setPreviewTextsByLocale] = useState<
    Record<string, PreviewTexts>
  >({
    ...(initialAppearanceTexts || {
      en: {
        title: "Buy more at a lower price",
        addedText: "Added",
        addText: "Add",
        totalPriceLabel: "Total Price:",
        discountText: "Add 1 more product to unlock a 2% discount!",
        addToCartText: "Add to cart",
      },
    }),
  });

  const handlePreviewTextChange = (key: keyof PreviewTexts, value: string) => {
    setPreviewTextsByLocale((prev) => ({
      ...prev,
      [currentLocale]: {
        ...prev[currentLocale],
        [key]: value,
      },
    }));
  };

  const defaultTexts: PreviewTexts = {
    title: "Buy more at a lower price",
    addedText: "Added",
    addText: "Add",
    totalPriceLabel: "Total Price:",
    discountText: "Add 1 more product to unlock a 2% discount!",
    addToCartText: "Add to cart",
  };

  const currentTexts: PreviewTexts =
    previewTextsByLocale[currentLocale] ||
    previewTextsByLocale.en ||
    defaultTexts;

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

  const isSaving = fetcher.state === "submitting";

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

              <BlockStack gap="200">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Text settings by locale
                    </Text>
                    <WidgetAppearanceControls
                      texts={currentTexts}
                      onChange={handlePreviewTextChange}
                      currentLocale={currentLocale}
                      availableLocales={availableLocales}
                      onLocaleChange={setCurrentLocale}
                      isSaving={isSaving}
                      onSave={() => {
                        if (!widgetId) return;
                        const formData = new FormData();
                        formData.append("intent", "saveTexts");
                        formData.append("widgetId", widgetId);
                        formData.append(
                          "previewTexts",
                          JSON.stringify(previewTextsByLocale),
                        );
                        fetcher.submit(formData, { method: "post" });
                      }}
                    />
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Preview
                    </Text>
                    <WidgetAppearancePreviewLite
                      texts={currentTexts}
                      onChange={handlePreviewTextChange}
                    />
                  </BlockStack>
                </Card>
              </BlockStack>
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
