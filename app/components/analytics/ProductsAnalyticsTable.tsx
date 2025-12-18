import { useState, useCallback } from "react";
import {
  Card,
  DataTable,
  Button,
  InlineStack,
  BlockStack,
  Text,
} from "@shopify/polaris";
import type { ProductAnalytics } from "../../routes/app.products-analytics";

interface ProductsAnalyticsTableProps {
  products: ProductAnalytics[];
}

type SortField =
  | "title"
  | "purchaseCount"
  | "totalQuantity"
  | "totalRevenue"
  | "averagePrice";
type SortDirection = "asc" | "desc";

export function ProductsAnalyticsTable({
  products,
}: ProductsAnalyticsTableProps) {
  const [sortField, setSortField] = useState<SortField>("purchaseCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        // Если кликнули по той же колонке, меняем направление сортировки
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        // Если кликнули по другой колонке, устанавливаем новое поле и направление по умолчанию
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField, sortDirection],
  );

  // Сортируем товары
  const sortedProducts = [...products].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "purchaseCount":
        aValue = a.purchaseCount;
        bValue = b.purchaseCount;
        break;
      case "totalQuantity":
        aValue = a.totalQuantity;
        bValue = b.totalQuantity;
        break;
      case "totalRevenue":
        aValue = a.totalRevenue;
        bValue = b.totalRevenue;
        break;
      case "averagePrice":
        aValue = a.averagePrice;
        bValue = b.averagePrice;
        break;
      default:
        return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  const tableRows = sortedProducts.map((product) => {
    const variantInfo = product.variantTitle
      ? ` (${product.variantTitle})`
      : "";
    const title = `${product.title}${variantInfo}`;

    return [
      title,
      product.purchaseCount.toString(),
      product.totalQuantity.toString(),
      `${product.totalRevenue.toFixed(2)} ${product.currency}`,
      `${product.averagePrice.toFixed(2)} ${product.currency}`,
    ];
  });

  // Функция для отображения кнопки сортировки
  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => {
    const isActive = sortField === field;
    const direction = isActive ? sortDirection : undefined;
    const icon = direction === "asc" ? "↑" : direction === "desc" ? "↓" : "";

    return (
      <Button
        variant={isActive ? "primary" : "tertiary"}
        onClick={() => handleSort(field)}
        size="slim"
      >
        {label} {icon}
      </Button>
    );
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="200" align="start">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Sort by:
          </Text>
          <SortButton field="purchaseCount" label="Purchase Count" />
          <SortButton field="totalQuantity" label="Total Quantity" />
          <SortButton field="totalRevenue" label="Total Revenue" />
          <SortButton field="averagePrice" label="Average Price" />
          <SortButton field="title" label="Product Name" />
        </InlineStack>

        <DataTable
          columnContentTypes={[
            "text",
            "numeric",
            "numeric",
            "numeric",
            "numeric",
          ]}
          headings={[
            "Product",
            "Purchase Count",
            "Total Quantity",
            "Total Revenue",
            "Average Price",
          ]}
          rows={tableRows}
        />
      </BlockStack>
    </Card>
  );
}
