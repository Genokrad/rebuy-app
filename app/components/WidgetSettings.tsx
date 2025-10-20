import {
  BlockStack,
  Text,
  TextField,
  Card,
  InlineStack,
  Button,
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
  // Internal state keeps all 5 fields (for UI), we render a dynamic count from 1..maxFields
  const [discounts, setDiscounts] = useState({
    discount1: settings.discount1 || "",
    discount2: settings.discount2 || "",
    discount3: settings.discount3 || "",
    discount4: settings.discount4 || "",
    discount5: settings.discount5 || "",
  });

  // Determine initial visible fields: if there are prefilled settings, show up to the highest non-empty key; otherwise 1
  const initialCount = (() => {
    const filled = [1, 2, 3, 4, 5].filter(
      (q) =>
        (settings as any)[`discount${q}`] &&
        String((settings as any)[`discount${q}`]).trim() !== "",
    );
    return Math.min(Math.max(filled.length || 1, 1), 5);
  })();
  const [visibleCount, setVisibleCount] = useState<number>(initialCount);

  const sanitizeToPercent = (raw: string) => {
    // Keep only digits and dot/comma, normalize comma to dot
    const normalized = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
    return normalized;
  };

  const emitNonZeroOnly = (all: typeof discounts) => {
    const payload: Record<string, string> = {};
    [1, 2, 3, 4, 5].forEach((q) => {
      const key = `discount${q}` as keyof typeof discounts;
      const v = (all[key] || "").trim();
      if (v !== "" && Number(v) > 0) {
        payload[key] = v;
      }
    });
    onSettingsChange?.(payload as any);
  };

  const handleRemoveAt = (index: number) => {
    if (visibleCount <= 1) return;
    const current = [
      discounts.discount1,
      discounts.discount2,
      discounts.discount3,
      discounts.discount4,
      discounts.discount5,
    ];
    const arr = current.slice(0, visibleCount);
    arr.splice(index - 1, 1);
    const newVisible = Math.max(1, visibleCount - 1);
    const rebuilt = ["", "", "", "", ""] as string[];
    for (let i = 0; i < arr.length && i < newVisible; i++)
      rebuilt[i] = arr[i] || "";
    const next = {
      discount1: rebuilt[0],
      discount2: rebuilt[1],
      discount3: rebuilt[2],
      discount4: rebuilt[3],
      discount5: rebuilt[4],
    };
    setDiscounts(next);
    setVisibleCount(newVisible);
    emitNonZeroOnly(next);
  };

  const handleDiscountChange = (
    field: keyof typeof discounts,
    value: string,
  ) => {
    const safe = sanitizeToPercent(value);
    const next = { ...discounts, [field]: safe };
    setDiscounts(next);
    emitNonZeroOnly(next);
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
          {[...Array(visibleCount)].map((_, idx) => {
            const quantity = idx + 1;
            return (
              <InlineStack key={quantity} gap="300" align="space-between">
                <Text as="p" variant="bodyMd" fontWeight="medium">
                  {quantity} {quantity === 1 ? "product" : "products"}:
                </Text>
                <InlineStack gap="200" align="end">
                  <div style={{ width: "120px" }}>
                    <TextField
                      label=""
                      value={
                        discounts[
                          `discount${quantity}` as keyof typeof discounts
                        ]
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
                  <Button
                    tone="critical"
                    variant="plain"
                    onClick={() => handleRemoveAt(quantity)}
                    disabled={visibleCount <= 1}
                  >
                    Remove
                  </Button>
                </InlineStack>
              </InlineStack>
            );
          })}
          <InlineStack gap="200">
            <Button
              onClick={() => setVisibleCount((c) => Math.min(c + 1, 5))}
              disabled={visibleCount >= 5}
            >
              Add discount
            </Button>
            {visibleCount < 5 && (
              <Text as="p" variant="bodySm" tone="subdued">
                You can add up to 5 discounts
              </Text>
            )}
          </InlineStack>
        </BlockStack>

        <Text as="p" variant="bodySm" tone="subdued">
          Example: 10% discount for 1 product, 15% for 2 products, etc.
        </Text>
      </BlockStack>
    </Card>
  );
};
