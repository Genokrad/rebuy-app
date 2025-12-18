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

/**
 * Форматирует дату в детерминированном формате для избежания ошибок гидратации
 * Использует фиксированную локаль 'en-US' для одинакового форматирования на сервере и клиенте
 */
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  // Используем фиксированную локаль для детерминированного форматирования
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  filterSellenceOnly: boolean;
  excludeCancelled?: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onFilterSellenceOnlyChange: (checked: boolean) => void;
  onExcludeCancelledChange?: (checked: boolean) => void;
  onApplyFilter: () => void;
  isLoading: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  filterSellenceOnly,
  excludeCancelled = false,
  onStartDateChange,
  onEndDateChange,
  onFilterSellenceOnlyChange,
  onExcludeCancelledChange,
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
        <BlockStack gap="200">
          <Checkbox
            label="Show only Sellence orders"
            checked={filterSellenceOnly}
            onChange={onFilterSellenceOnlyChange}
          />
          {onExcludeCancelledChange && (
            <Checkbox
              label="Exclude cancelled orders"
              checked={excludeCancelled}
              onChange={onExcludeCancelledChange}
            />
          )}
        </BlockStack>
        <Text as="p" variant="bodySm" tone="subdued">
          Selected range: {formatDateForDisplay(startDate)} -{" "}
          {formatDateForDisplay(endDate)}
        </Text>
      </BlockStack>
    </Card>
  );
}
