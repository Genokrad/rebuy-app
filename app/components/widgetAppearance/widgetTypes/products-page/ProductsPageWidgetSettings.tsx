import { useState } from "react";
import { Card, BlockStack, Text } from "@shopify/polaris";
import type { BaseWidgetSettingsProps, PreviewTexts } from "../types";
import { WidgetAppearanceControls } from "../../WidgetAppearanceControls";
import { WidgetAppearancePreviewLite } from "./WidgetAppearancePreviewLite";

export function ProductsPageWidgetSettings({
  appearanceTexts: initialAppearanceTexts,
  availableLocales,
  onSave,
  isSaving = false,
}: BaseWidgetSettingsProps) {
  const initialLocale = Object.keys(initialAppearanceTexts)[0] || "en";
  const [currentLocale, setCurrentLocale] = useState(initialLocale);
  const [previewTextsByLocale, setPreviewTextsByLocale] = useState<
    Record<string, PreviewTexts>
  >(() => {
    // Преобразуем initialAppearanceTexts в PreviewTexts
    const converted: Record<string, PreviewTexts> = {};
    if (initialAppearanceTexts) {
      Object.keys(initialAppearanceTexts).forEach((locale) => {
        const texts = initialAppearanceTexts[locale] as any;
        // Проверяем, что это PreviewTexts (не CheckoutTexts)
        if (texts && typeof texts === "object" && !texts.heading) {
          converted[locale] = texts as PreviewTexts;
        }
      });
    }
    if (Object.keys(converted).length === 0) {
      converted.en = {
        title: "Buy more at a lower price",
        addedText: "Added",
        addText: "Add",
        totalPriceLabel: "Total Price:",
        discountText: "Add 1 more product to unlock a 2% discount!",
        addToCartText: "Add to cart",
      };
    }
    return converted;
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

  const handleSave = () => {
    onSave(previewTextsByLocale);
  };

  return (
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
            onSave={handleSave}
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
  );
}
