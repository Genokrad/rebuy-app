import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Text, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getOrdersBulk } from "../graphql/bulkOrdersService";
import { ProductsAnalyticsTable } from "../components/analytics/ProductsAnalyticsTable";
import { DateRangeFilter } from "../components/analytics/DateRangeFilter";
import { useState, useCallback, useEffect } from "react";

export interface ProductAnalytics {
  productId: string | null;
  title: string;
  variantTitle?: string;
  totalQuantity: number;
  purchaseCount: number; // Количество раз, когда товар был куплен
  totalRevenue: number;
  averagePrice: number;
  currency: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const filterSellenceOnlyParam = url.searchParams.get("filterSellenceOnly");
  const filterSellenceOnly = filterSellenceOnlyParam === "true";
  const excludeCancelledParam = url.searchParams.get("excludeCancelled");
  const excludeCancelled = excludeCancelledParam === "true";

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
    excludeCancelled,
  );

  // Агрегируем данные по товарам
  const productsMap = new Map<string, ProductAnalytics>();

  for (const order of allOrders) {
    for (const lineItem of order.lineItems) {
      // Создаем уникальный ключ для товара (productId + variantTitle)
      const variantKey = lineItem.variantTitle || "default";
      const productKey = lineItem.productId
        ? `${lineItem.productId}_${variantKey}`
        : `${lineItem.title}_${variantKey}`;

      const quantity = lineItem.quantity || 0;
      const price = parseFloat(
        lineItem.discountedTotal || lineItem.originalTotal || "0",
      );
      const currency = lineItem.currencyCode || order.currencyCode || "USD";

      if (productsMap.has(productKey)) {
        const existing = productsMap.get(productKey)!;
        existing.totalQuantity += quantity;
        existing.purchaseCount += 1; // Каждый lineItem - это одна покупка
        existing.totalRevenue += price;
        existing.averagePrice =
          existing.totalQuantity > 0
            ? existing.totalRevenue / existing.totalQuantity
            : 0;
      } else {
        productsMap.set(productKey, {
          productId: lineItem.productId || null,
          title: lineItem.title || "Unknown Product",
          variantTitle: lineItem.variantTitle,
          totalQuantity: quantity,
          purchaseCount: 1,
          totalRevenue: price,
          averagePrice: quantity > 0 ? price / quantity : 0,
          currency,
        });
      }
    }
  }

  // Преобразуем Map в массив и сортируем по количеству покупок по умолчанию
  const productsData = Array.from(productsMap.values()).sort(
    (a, b) => b.purchaseCount - a.purchaseCount,
  );

  return {
    products: productsData,
    totalProducts: productsData.length,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    filterSellenceOnly,
    excludeCancelled,
  };
};

export default function ProductsAnalytics() {
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
  const [excludeCancelled, setExcludeCancelled] = useState<boolean>(
    loaderData.excludeCancelled,
  );
  const [allProducts, setAllProducts] = useState(loaderData.products);

  // Обновляем список товаров и состояние фильтра при изменении данных из loader
  useEffect(() => {
    setAllProducts(loaderData.products);
    setFilterSellenceOnly(loaderData.filterSellenceOnly);
    setExcludeCancelled(loaderData.excludeCancelled);
  }, [
    loaderData.products,
    loaderData.filterSellenceOnly,
    loaderData.excludeCancelled,
  ]);

  // Обновляем список товаров при изменении данных из fetcher
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const newData = fetcher.data;
      setAllProducts(newData.products);
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
      `/app/products-analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${filterSellenceOnly}&excludeCancelled=${excludeCancelled}`,
    );
  }, [
    selectedStartDate,
    selectedEndDate,
    filterSellenceOnly,
    excludeCancelled,
    fetcher,
  ]);

  const handleFilterSellenceOnlyChange = useCallback(
    (checked: boolean) => {
      setFilterSellenceOnly(checked);
      fetcher.load(
        `/app/products-analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${checked}&excludeCancelled=${excludeCancelled}`,
      );
    },
    [selectedStartDate, selectedEndDate, excludeCancelled, fetcher],
  );

  const handleExcludeCancelledChange = useCallback(
    (checked: boolean) => {
      setExcludeCancelled(checked);
      fetcher.load(
        `/app/products-analytics?startDate=${selectedStartDate}&endDate=${selectedEndDate}&filterSellenceOnly=${filterSellenceOnly}&excludeCancelled=${checked}`,
      );
    },
    [selectedStartDate, selectedEndDate, filterSellenceOnly, fetcher],
  );

  return (
    <Page>
      <TitleBar title="Products Analytics - Sellence" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Text as="h1" variant="headingLg">
              Products Analytics
            </Text>

            <DateRangeFilter
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              filterSellenceOnly={filterSellenceOnly}
              excludeCancelled={excludeCancelled}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onFilterSellenceOnlyChange={handleFilterSellenceOnlyChange}
              onExcludeCancelledChange={handleExcludeCancelledChange}
              onApplyFilter={handleApplyDateFilter}
              isLoading={fetcher.state === "loading"}
            />

            <Text as="p" variant="bodyMd">
              Total unique products: {allProducts.length}
            </Text>

            {allProducts.length > 0 ? (
              <ProductsAnalyticsTable products={allProducts} />
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">
                No products found for the selected date range.
              </Text>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
