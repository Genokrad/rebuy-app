import { Card, BlockStack, Text, InlineStack, Box } from "@shopify/polaris";
import type { AnalyticsOrder } from "./OrdersTable";

interface OrdersStatsProps {
  orders: AnalyticsOrder[];
  filterSellenceOnly: boolean;
}

export function OrdersStats({ orders, filterSellenceOnly }: OrdersStatsProps) {
  // Вычисляем статистику из заказов
  const totalOrders = orders.length;

  // Определяем, является ли заказ Sellence заказом (по widgetType !== "N/A")
  const sellenceOrders = orders.filter(
    (order) => order.widgetType !== "N/A",
  ).length;

  // Вычисляем общую сумму всех заказов
  const totalRevenue = orders.reduce((sum, order) => {
    const price = parseFloat(
      order.priceWithDiscount || order.totalPrice || "0",
    );
    return sum + price;
  }, 0);

  // Вычисляем сумму заказов через Sellence
  const sellenceRevenue = orders
    .filter((order) => order.widgetType !== "N/A")
    .reduce((sum, order) => {
      const price = parseFloat(
        order.priceWithDiscount || order.totalPrice || "0",
      );
      return sum + price;
    }, 0);

  // Получаем валюту из первого заказа (предполагаем, что все заказы в одной валюте)
  const currency = orders[0]?.currency || "USD";
  // Вычисляем проценты
  const sellenceOrdersPercent =
    totalOrders > 0 ? Math.round((sellenceOrders / totalOrders) * 100) : 0;
  const otherOrdersPercent = 100 - sellenceOrdersPercent;

  // Вычисляем проценты для диаграммы (в градусах)
  const sellenceAngle = (sellenceOrdersPercent / 100) * 360;

  // Радиус круга
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  // Вычисляем координаты для сегментов круга
  const getPathData = (angle: number, startAngle: number = 0) => {
    const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
    const endAngleRad = ((startAngle + angle - 90) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h3" variant="headingMd">
          Orders Statistics
        </Text>

        <InlineStack gap="500" align="start" blockAlign="start">
          {/* Круговая диаграмма */}
          <div style={{ flexShrink: 0 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Фон (все заказы) - зеленый */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="#10b981"
                opacity={0.2}
              />
              {/* Сегмент Sellence заказов - синий */}
              {sellenceOrdersPercent > 0 && (
                <path
                  d={getPathData(sellenceAngle)}
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth="2"
                />
              )}
              {/* Центральный текст */}
              <text
                x={centerX}
                y={centerY - 10}
                textAnchor="middle"
                fontSize="24"
                fontWeight="bold"
                fill="#1f2937"
              >
                {totalOrders}
              </text>
              <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                Total Orders
              </text>
            </svg>
            {/* Легенда */}
            <Box paddingBlockStart="400">
              <BlockStack gap="200">
                <InlineStack gap="200" align="start">
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#10b981",
                      borderRadius: "2px",
                    }}
                  />
                  <Text as="span" variant="bodySm">
                    All Orders ({otherOrdersPercent}%)
                  </Text>
                </InlineStack>
                <InlineStack gap="200" align="start">
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#3b82f6",
                      borderRadius: "2px",
                    }}
                  />
                  <Text as="span" variant="bodySm">
                    Sellence Orders ({sellenceOrdersPercent}%)
                  </Text>
                </InlineStack>
              </BlockStack>
            </Box>
          </div>

          {/* Статистика */}
          <Box minWidth="200px">
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Total Orders
                </Text>
                <Text as="p" variant="headingLg">
                  {totalOrders}
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Total Revenue
                </Text>
                <Text as="p" variant="headingLg">
                  {formatCurrency(totalRevenue)}
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Sellence Orders
                </Text>
                <Text as="p" variant="headingLg">
                  {sellenceOrders} ({sellenceOrdersPercent}%)
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Sellence Revenue
                </Text>
                <Text as="p" variant="headingLg">
                  {formatCurrency(sellenceRevenue)}
                </Text>
              </BlockStack>
            </BlockStack>
          </Box>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
