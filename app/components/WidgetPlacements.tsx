import {
  Card,
  BlockStack,
  Text,
  Checkbox,
  InlineStack,
} from "@shopify/polaris";
import React from "react";

export type PlacementKey = "products" | "cart" | "checkout";

interface WidgetPlacementsProps {
  selected: PlacementKey[]; // e.g., ["products", "cart"]
  onChange: (next: PlacementKey[]) => void;
}

// const allKeys: PlacementKey[] = ["products", "cart", "checkout"];

const WidgetPlacements = ({ selected, onChange }: WidgetPlacementsProps) => {
  const isChecked = (k: PlacementKey) => selected.includes(k);

  const toggle = (k: PlacementKey, checked: boolean) => {
    if (checked) {
      const next = Array.from(new Set([...selected, k]));
      onChange(next);
    } else {
      const next = selected.filter((x) => x !== k);
      onChange(next);
    }
  };

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingMd">
          Widget placements
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Choose where to display the widget. You can select one or multiple.
        </Text>
        <InlineStack gap="400" blockAlign="center">
          <Checkbox
            label="Products page"
            checked={isChecked("products")}
            onChange={(v) => toggle("products", Boolean(v))}
          />
          <Checkbox
            label="Cart"
            checked={isChecked("cart")}
            onChange={(v) => toggle("cart", Boolean(v))}
          />
          <Checkbox
            label="Checkout page"
            checked={isChecked("checkout")}
            onChange={(v) => toggle("checkout", Boolean(v))}
          />
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export default WidgetPlacements;
