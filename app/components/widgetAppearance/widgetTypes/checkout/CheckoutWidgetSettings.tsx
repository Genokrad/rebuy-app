import { useState } from "react";
import { Card, BlockStack, Text, TextField, Select } from "@shopify/polaris";
import type { BaseWidgetSettingsProps, CheckoutTexts } from "../types";
import { CheckoutWidgetPreview } from "./CheckoutWidgetPreview";

export function CheckoutWidgetSettings({
  widgetId,
  settings,
  appearanceTexts: initialAppearanceTexts,
  availableLocales,
  onSave,
  isSaving = false,
}: BaseWidgetSettingsProps) {
  const initialLocale = Object.keys(initialAppearanceTexts)[0] || "en";
  const [currentLocale, setCurrentLocale] = useState(initialLocale);

  // Преобразуем appearanceTexts в CheckoutTexts
  const [checkoutTextsByLocale, setCheckoutTextsByLocale] = useState<
    Record<string, CheckoutTexts>
  >(() => {
    // Преобразуем initialAppearanceTexts в CheckoutTexts
    const converted: Record<string, CheckoutTexts> = {};
    if (initialAppearanceTexts) {
      Object.keys(initialAppearanceTexts).forEach((locale) => {
        const texts = initialAppearanceTexts[locale] as any;
        converted[locale] = {
          heading: texts?.heading || "Complete your purchase",
          buttonText: texts?.buttonText || "Add",
          buttonVariant: texts?.buttonVariant || "primary",
        };
      });
    }
    if (Object.keys(converted).length === 0) {
      converted.en = {
        heading: "Complete your purchase",
        buttonText: "Add",
        buttonVariant: "primary",
      };
    }
    return converted;
  });

  const handleTextChange = (
    key: keyof CheckoutTexts,
    value: string | CheckoutTexts["buttonVariant"],
  ) => {
    setCheckoutTextsByLocale((prev) => ({
      ...prev,
      [currentLocale]: {
        ...prev[currentLocale],
        [key]: value,
      },
    }));
  };

  const defaultTexts: CheckoutTexts = {
    heading: "Complete your purchase",
    buttonText: "Add",
    buttonVariant: "primary",
  };

  const currentTexts: CheckoutTexts =
    checkoutTextsByLocale[currentLocale] ||
    checkoutTextsByLocale.en ||
    defaultTexts;

  const handleSave = () => {
    onSave(checkoutTextsByLocale as any);
  };

  const buttonVariantOptions = [
    { label: "Primary", value: "primary" },
    { label: "Secondary", value: "secondary" },
    { label: "Plain", value: "plain" },
  ];

  return (
    <BlockStack gap="200">
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Checkout Widget Settings
          </Text>

          <Select
            label="Language"
            options={availableLocales.map((loc) => ({
              label: loc,
              value: loc,
            }))}
            value={currentLocale}
            onChange={(value) => setCurrentLocale(value)}
          />

          <TextField
            label="Heading Text"
            value={currentTexts.heading || ""}
            onChange={(value) => handleTextChange("heading", value)}
            placeholder="Complete your purchase"
            helpText="This text will appear as the heading in the checkout widget"
            autoComplete="off"
          />

          <TextField
            label="Button Text"
            value={currentTexts.buttonText || ""}
            onChange={(value) => handleTextChange("buttonText", value)}
            placeholder="Add"
            helpText="Text displayed on the add to cart button"
            autoComplete="off"
          />

          <Select
            label="Button Variant"
            options={buttonVariantOptions}
            value={currentTexts.buttonVariant || "primary"}
            onChange={(value) => {
              const variant = (value ||
                "primary") as CheckoutTexts["buttonVariant"];
              handleTextChange("buttonVariant", variant);
            }}
            helpText="Visual style of the button: Primary (main action), Secondary (secondary action), Plain (minimal style)"
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px solid #4B3E34",
                background: "#4B3E34",
                color: "#fff",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 500,
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Preview
          </Text>
          <CheckoutWidgetPreview texts={currentTexts} />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
