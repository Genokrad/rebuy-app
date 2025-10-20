import {
  BlockStack,
  Text,
  TextField,
  Card,
  InlineStack,
} from "@shopify/polaris";
import React, { useState } from "react";

interface WidgetSettingsProps {
  settings?: {
    discount1?: string;
    discount2?: string;
    discount3?: string;
    discount4?: string;
    discount5?: string;
  };
  onSettingsChange?: (settings: {
    discount1: string;
    discount2: string;
    discount3: string;
    discount4: string;
    discount5: string;
  }) => void;
}

export const WidgetSettings = ({
  settings = {},
  onSettingsChange,
}: WidgetSettingsProps) => {
  const [discounts, setDiscounts] = useState({
    discount1: settings.discount1 || "",
    discount2: settings.discount2 || "",
    discount3: settings.discount3 || "",
    discount4: settings.discount4 || "",
    discount5: settings.discount5 || "",
  });

  const handleDiscountChange = (
    field: keyof typeof discounts,
    value: string,
  ) => {
    const newDiscounts = { ...discounts, [field]: value };
    setDiscounts(newDiscounts);
    onSettingsChange?.(newDiscounts);
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Discount Settings
        </Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          Set discount percentages for different quantities of products
        </Text>

        <BlockStack gap="300">
          {[1, 2, 3, 4, 5].map((quantity) => (
            <InlineStack key={quantity} gap="300" align="space-between">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                {quantity} {quantity === 1 ? "product" : "products"}:
              </Text>
              <div style={{ width: "120px" }}>
                <TextField
                  label=""
                  value={
                    discounts[`discount${quantity}` as keyof typeof discounts]
                  }
                  onChange={(value) =>
                    handleDiscountChange(
                      `discount${quantity}` as keyof typeof discounts,
                      value,
                    )
                  }
                  placeholder="0%"
                  suffix="%"
                  autoComplete="off"
                />
              </div>
            </InlineStack>
          ))}
        </BlockStack>

        <Text as="p" variant="bodySm" tone="subdued">
          Example: 10% discount for 1 product, 15% for 2 products, etc.
        </Text>
      </BlockStack>
    </Card>
  );
};
