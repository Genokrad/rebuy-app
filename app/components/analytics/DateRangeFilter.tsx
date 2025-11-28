import {
  Card,
  BlockStack,
  Text,
  TextField,
  Button,
  InlineStack,
  Checkbox,
} from "@shopify/polaris";
import { useCallback } from "react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  filterSellenceOnly: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onFilterSellenceOnlyChange: (checked: boolean) => void;
  onApplyFilter: () => void;
  isLoading: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  filterSellenceOnly,
  onStartDateChange,
  onEndDateChange,
  onFilterSellenceOnlyChange,
  onApplyFilter,
  isLoading,
}: DateRangeFilterProps) {
  const handleStartDateChange = useCallback(
    (value: string) => {
      onStartDateChange(value);
    },
    [onStartDateChange],
  );

  const handleEndDateChange = useCallback(
    (value: string) => {
      onEndDateChange(value);
    },
    [onEndDateChange],
  );

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingMd">
          Date Range Filter
        </Text>
        <InlineStack gap="300" align="start">
          <div style={{ width: "200px" }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              autoComplete="off"
            />
          </div>
          <div style={{ width: "200px" }}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              autoComplete="off"
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <Button onClick={onApplyFilter} loading={isLoading}>
              Apply Filter
            </Button>
          </div>
        </InlineStack>
        <Checkbox
          label="Show only Sellence orders"
          checked={filterSellenceOnly}
          onChange={onFilterSellenceOnlyChange}
        />
        <Text as="p" variant="bodySm" tone="subdued">
          Selected range: {new Date(startDate).toLocaleDateString()} -{" "}
          {new Date(endDate).toLocaleDateString()}
        </Text>
      </BlockStack>
    </Card>
  );
}
