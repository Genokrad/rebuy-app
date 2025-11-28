import { Text } from "@shopify/polaris";

interface OrdersSummaryProps {
  totalOrders: number;
  hasMore: boolean;
}

export function OrdersSummary({ totalOrders, hasMore }: OrdersSummaryProps) {
  return (
    <Text as="p" variant="bodyMd" tone="subdued">
      Showing {totalOrders} orders{hasMore && " (more available)"}
    </Text>
  );
}
