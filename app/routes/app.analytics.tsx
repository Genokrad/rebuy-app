import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Text, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getOrders } from "../graphql/ordersService";
import {
  DateRangeFilter,
  OrdersTable,
  LoadMoreButton,
  EmptyState,
  OrdersSummary,
  OrdersStats,
  type AnalyticsOrder,
} from "../components/analytics";
import { useState, useCallback, useEffect } from "react";

const ITEMS_PER_LOAD = 50; // Количество заказов для загрузки за раз

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const cursorParam = url.searchParams.get("cursor");
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

  // Получаем заказы из Shopify
  const result = await getOrders(
    request,
    startDate,
    endDate,
    cursorParam || null,
    ITEMS_PER_LOAD,
    filterSellenceOnly,
  );

  // Формируем данные для отображения
  const ordersData = result.orders.map((order) => {
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
        ? new Date(order.createdAt).toLocaleDateString()
        : "N/A",
    };
  });

  return {
    orders: ordersData as AnalyticsOrder[],
    totalOrders: ordersData.length,
    hasNextPage: result.hasNextPage,
    nextCursor: result.nextCursor,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    filterSellenceOnly,
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
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allOrders, setAllOrders] = useState(loaderData.orders);

  // Используем данные из fetcher, если они есть (для пагинации), иначе из loader
  const data = fetcher.data || loaderData;
  const hasNextPage = data.hasNextPage;
  const nextCursor = data.nextCursor;

  // Обновляем список заказов и состояние фильтра при изменении данных из loader
  useEffect(() => {
    setAllOrders(loaderData.orders);
    setFilterSellenceOnly(loaderData.filterSellenceOnly);
  }, [loaderData.orders, loaderData.filterSellenceOnly]);

  // Обновляем список заказов при изменении данных из fetcher
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const newData = fetcher.data;
      if (cursor) {
        // Пагинация - добавляем к существующим
        setAllOrders((prev) => [...prev, ...newData.orders]);
        setIsLoadingMore(false);
      } else {
        // Новый фильтр - заменяем все
        setAllOrders(newData.orders);
      }
    }
  }, [fetcher.state, fetcher.data, cursor]);

  const handleStartDateChange = useCallback((value: string) => {
    setSelectedStartDate(value);
    setCursor(null); // Сбрасываем курсор при изменении даты
  }, []);

  const handleEndDateChange = useCallback((value: string) => {
    setSelectedEndDate(value);
    setCursor(null); // Сбрасываем курсор при изменении даты
  }, []);

  const handleApplyDateFilter = useCallback(() => {
    setCursor(null);
    fetcher.load(
      `/app/analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${filterSellenceOnly}`,
    );
  }, [selectedStartDate, selectedEndDate, filterSellenceOnly, fetcher]);

  const handleFilterSellenceOnlyChange = useCallback(
    (checked: boolean) => {
      setFilterSellenceOnly(checked);
      setCursor(null);
      fetcher.load(
        `/app/analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${checked}`,
      );
    },
    [selectedStartDate, selectedEndDate, fetcher],
  );

  const handleLoadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore || fetcher.state === "loading") return;

    setIsLoadingMore(true);
    setCursor(nextCursor);
    fetcher.load(
      `/app/analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${filterSellenceOnly}&cursor=${nextCursor}`,
    );
  }, [
    nextCursor,
    selectedStartDate,
    selectedEndDate,
    filterSellenceOnly,
    fetcher,
    isLoadingMore,
  ]);

  return (
    <Page>
      <TitleBar title="Analytics - Sellence Orders" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Text as="h1" variant="headingLg">
              Sellence Orders Analytics
            </Text>

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

            {allOrders.length > 0 && (
              <OrdersStats
                orders={allOrders}
                filterSellenceOnly={filterSellenceOnly}
              />
            )}

            <OrdersSummary
              totalOrders={allOrders.length}
              hasMore={hasNextPage}
            />

            {allOrders.length > 0 ? (
              <BlockStack gap="300">
                <OrdersTable orders={allOrders} />
                <LoadMoreButton
                  onLoadMore={handleLoadMore}
                  isLoading={isLoadingMore || fetcher.state === "loading"}
                  hasMore={hasNextPage}
                />
              </BlockStack>
            ) : (
              <EmptyState />
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
