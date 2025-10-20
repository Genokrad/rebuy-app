import {
  BlockStack,
  TextField,
  Card,
} from "@shopify/polaris";
import React from "react";

interface WidgetFormProps {
  name: string;
  value: string;
  onNameChange: (name: string) => void;
  onValueChange: (value: string) => void;
}

export function WidgetForm({
  name,
  value,
  onNameChange,
  onValueChange,
}: WidgetFormProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <TextField
          label="Name"
          value={name}
          onChange={onNameChange}
          placeholder="Enter widget name"
          autoComplete="off"
        />
        <TextField
          label="Value"
          value={value}
          onChange={onValueChange}
          placeholder="Enter widget value"
          autoComplete="off"
        />
      </BlockStack>
    </Card>
  );
}
