import { Card, DataTable } from "@shopify/polaris";

export interface OrderProduct {
  title: string;
  variantTitle?: string;
  quantity: number;
  price: string;
  currency: string;
}

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
  products: OrderProduct[];
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

    // Формируем строку с товарами
    const productsDisplay =
      order.products.length > 0
        ? order.products
            .map((product) => {
              const variantInfo = product.variantTitle
                ? ` (${product.variantTitle})`
                : "";
              return `${product.title}${variantInfo} × ${product.quantity} - ${product.price} ${product.currency}`;
            })
            .join("; ")
        : "No products";

    return [
      order.orderName,
      `${order.priceWithDiscount} ${order.currency}`,
      discountDisplay,
      order.widgetType,
      productsDisplay,
      order.createdAt,
    ];
  });

  return (
    <Card>
      <DataTable
        columnContentTypes={["text", "text", "text", "text", "text", "text"]}
        headings={[
          "Order ID",
          "Total with Discount",
          "Sellence Discount",
          "Widget Type",
          "Products",
          "Date",
        ]}
        rows={tableRows}
      />
    </Card>
  );
}
