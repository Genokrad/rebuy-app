import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getOrdersBulk } from "../graphql/bulkOrdersService";
import {
  DateRangeFilter,
  OrdersTable,
  EmptyState,
  OrdersSummary,
  OrdersStats,
  WidgetClicksStats,
  type AnalyticsOrder,
} from "../components/analytics";
import { useState, useCallback, useEffect } from "react";
import prisma from "../db.server";

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const filterSellenceOnlyParam = url.searchParams.get("filterSellenceOnly");
  const filterSellenceOnly = filterSellenceOnlyParam === "true";

  // По умолчанию - сегодня
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const startDate = startDateParam ? new Date(startDateParam) : today;
  const endDate = endDateParam ? new Date(endDateParam) : endOfToday;

  // Устанавливаем время для корректного сравнения
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Получаем все заказы из Shopify используя bulk операцию
  const allOrders = await getOrdersBulk(
    request,
    startDate,
    endDate,
    filterSellenceOnly,
  );

  // Формируем данные для отображения
  const ordersData = allOrders.map((order) => {
    // Получаем тип виджета из первого line item с атрибутами Sellence
    let widgetType = "N/A";
    let sellenceDiscountTotal = 0;
    let discountPercent: string | null = null; // Процент скидки (только для PDP)

    // Сначала находим тип виджета
    for (const lineItem of order.lineItems) {
      const attributes = lineItem.customAttributes || [];
      for (const attr of attributes) {
        if (attr.key === "_sellence_widget_type" && attr.value) {
          widgetType = attr.value;
          break; // Нашли тип виджета, выходим из цикла
        }
      }
      if (widgetType !== "N/A") break; // Нашли тип виджета, выходим из внешнего цикла
    }

    // Теперь обрабатываем скидки и процент (только для PDP виджетов)
    for (const lineItem of order.lineItems) {
      const attributes = lineItem.customAttributes || [];
      let hasDiscount = false;
      let itemDiscountPercent: string | null = null;

      // Сначала проверяем все атрибуты этого line item
      for (const attr of attributes) {
        if (attr.key === "_sellence_discount" && attr.value === "true") {
          hasDiscount = true;
        }
        // Извлекаем процент скидки из того же line item
        if (
          attr.key === "_sellence_discount_percent" &&
          attr.value &&
          widgetType === "products-page"
        ) {
          itemDiscountPercent = attr.value;
        }
      }

      // Если в этом line item есть скидка, вычисляем сумму и берем процент
      if (hasDiscount) {
        const originalTotal = parseFloat(lineItem.originalTotal || "0");
        const discountedTotal = parseFloat(lineItem.discountedTotal || "0");
        sellenceDiscountTotal += originalTotal - discountedTotal;

        // Берем процент скидки из этого же line item
        if (itemDiscountPercent && widgetType === "products-page") {
          discountPercent = itemDiscountPercent;
        }
      }
    }

    // Формируем список товаров из заказа
    const products = order.lineItems.map((lineItem) => ({
      title: lineItem.title || "Unknown Product",
      variantTitle: lineItem.variantTitle,
      quantity: lineItem.quantity || 0,
      price: lineItem.discountedTotal || lineItem.originalTotal || "0",
      currency: lineItem.currencyCode || order.currencyCode || "USD",
    }));

    return {
      orderId: order.id.split("/").pop() || order.id,
      orderName: order.name,
      totalPrice: order.totalPrice || "0",
      priceWithDiscount: order.totalPrice || "0", // totalPrice уже включает все скидки
      discountTotal: sellenceDiscountTotal.toFixed(2),
      discountPercent, // Процент скидки (null для checkout виджетов)
      currency: order.currencyCode || "USD",
      widgetType,
      createdAt: order.createdAt
        ? formatDateForDisplay(order.createdAt)
        : "N/A",
      products,
    };
  });

  let widgetClickStats: Array<{
    widgetId: string;
    widgetType: string;
    clickCount: number;
    percentage: number;
  }> = [];

  try {
    const widgetClickEventClient = (prisma as any).widgetClickEvent;
    if (widgetClickEventClient?.groupBy) {
      // Добавляем фильтрацию по датам для кликов
      const rawStats = await widgetClickEventClient.groupBy({
        where: {
          shop: session.shop?.toLowerCase(),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        by: ["widgetId", "widgetType"],
        _count: {
          widgetId: true,
        },
        orderBy: {
          _count: {
            widgetId: "desc",
          },
        },
      });

      const totalClicks = rawStats.reduce(
        (sum: number, item: any) => sum + (item?._count?.widgetId ?? 0),
        0,
      );

      widgetClickStats = rawStats.map((item: any) => {
        const count = item?._count?.widgetId ?? 0;
        return {
          widgetId: item?.widgetId || "Unknown widget",
          widgetType: item?.widgetType || "N/A",
          clickCount: count,
          percentage:
            totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
        };
      });
    }
  } catch (error) {
    console.error("Failed to load widget click stats", error);
  }

  return {
    orders: ordersData as AnalyticsOrder[],
    totalOrders: ordersData.length,
    hasNextPage: false, // Bulk операции возвращают все данные сразу
    nextCursor: null, // Больше не нужен курсор
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    filterSellenceOnly,
    widgetClickStats,
  };
};

export default function Analytics() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();

  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    loaderData.startDate,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string>(
    loaderData.endDate,
  );
  const [filterSellenceOnly, setFilterSellenceOnly] = useState<boolean>(
    loaderData.filterSellenceOnly,
  );
  const [allOrders, setAllOrders] = useState(loaderData.orders);

  // Используем данные из fetcher, если они есть, иначе из loader
  const data = fetcher.data || loaderData;
  const widgetClickStats = data.widgetClickStats || [];

  // Обновляем список заказов и состояние фильтра при изменении данных из loader
  useEffect(() => {
    setAllOrders(loaderData.orders);
    setFilterSellenceOnly(loaderData.filterSellenceOnly);
  }, [loaderData.orders, loaderData.filterSellenceOnly]);

  // Обновляем список заказов при изменении данных из fetcher
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const newData = fetcher.data;
      // Заменяем все заказы при новом фильтре
      setAllOrders(newData.orders);
    }
  }, [fetcher.state, fetcher.data]);

  const handleStartDateChange = useCallback((value: string) => {
    setSelectedStartDate(value);
  }, []);

  const handleEndDateChange = useCallback((value: string) => {
    setSelectedEndDate(value);
  }, []);

  const handleApplyDateFilter = useCallback(() => {
    fetcher.load(
      `/app/analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${filterSellenceOnly}`,
    );
  }, [selectedStartDate, selectedEndDate, filterSellenceOnly, fetcher]);

  const handleFilterSellenceOnlyChange = useCallback(
    (checked: boolean) => {
      setFilterSellenceOnly(checked);
      fetcher.load(
        `/app/analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${checked}`,
      );
    },
    [selectedStartDate, selectedEndDate, fetcher],
  );

  return (
    <Page>
      <TitleBar title="Analytics - Sellence Orders" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h1" variant="headingLg">
                Sellence Orders Analytics
              </Text>
              <Link to="/app/products-analytics">
                <Button>View Products Analytics</Button>
              </Link>
            </InlineStack>

            <DateRangeFilter
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              filterSellenceOnly={filterSellenceOnly}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onFilterSellenceOnlyChange={handleFilterSellenceOnlyChange}
              onApplyFilter={handleApplyDateFilter}
              isLoading={fetcher.state === "loading"}
            />

            <WidgetClicksStats stats={widgetClickStats} />

            {allOrders.length > 0 && (
              <OrdersStats
                orders={allOrders}
                filterSellenceOnly={filterSellenceOnly}
              />
            )}

            <OrdersSummary totalOrders={allOrders.length} hasMore={false} />

            {allOrders.length > 0 ? (
              <OrdersTable orders={allOrders} />
            ) : (
              <EmptyState />
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
