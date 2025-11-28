import { Card, DataTable } from "@shopify/polaris";

export interface AnalyticsOrder {
  orderId: string;
  orderName: string;
  totalPrice: string;
  priceWithDiscount: string;
  discountTotal: string;
  discountPercent: string | null; // Процент скидки (только для PDP виджетов)
  currency: string;
  widgetType: string;
  createdAt: string;
}

interface OrdersTableProps {
  orders: AnalyticsOrder[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const tableRows = orders.map((order) => {
    // Формируем строку со скидкой
    let discountDisplay = "No discount";
    if (order.discountPercent && order.discountPercent !== "0") {
      // Для PDP виджетов показываем и процент, и сумму для наглядности
      if (order.widgetType === "products-page" && order.discountPercent) {
        discountDisplay = `${order.discountPercent}%`;
      } else {
        // Для других виджетов (checkout) показываем только сумму
        discountDisplay = `No discount`;
      }
    }

    return [
      order.orderName,
      `${order.priceWithDiscount} ${order.currency}`,
      discountDisplay,
      order.widgetType,
      order.createdAt,
    ];
  });

  return (
    <Card>
      <DataTable
        columnContentTypes={["text", "text", "text", "text", "text"]}
        headings={[
          "Order ID",
          "Total with Discount",
          "Sellence Discount",
          "Widget Type",
          "Date",
        ]}
        rows={tableRows}
      />
    </Card>
  );
}
