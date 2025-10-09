import React, { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Text, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAllProducts } from "../graphql/productsService";
import {
  createWidget,
  deleteWidget,
  getWidgetsByShop,
} from "../services/widgetService";
import { widgetCards } from "../data/default-data";
import {
  WidgetCards,
  WidgetsTable,
  WidgetSelectedNotification,
} from "../components";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Получаем все продукты
  const products = await getAllProducts(request);

  // Получаем все виджеты для текущего магазина
  const widgets = await getWidgetsByShop(session.shop);

  return { products, widgets };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();

  // Проверяем, это запрос на удаление виджета
  if (formData.get("widgetId")) {
    console.log("Deleting widget:", formData.get("widgetId"));
    const widgetId = formData.get("widgetId") as string;
    try {
      await deleteWidget(widgetId);
      return { success: true, deleted: true, widget: null, error: null };
    } catch (error) {
      console.error("Error deleting widget:", error);
      return { error: "Failed to delete widget", success: false, widget: null };
    }
  }

  // Проверяем данные для создания виджета
  const widgetType = formData.get("widgetType") as string;
  const widgetName = formData.get("widgetName") as string;

  if (!widgetType || !widgetName) {
    return { error: "Missing widget type or name", success: false };
  }

  try {
    const widget = await createWidget(widgetName, widgetType, session.shop);
    console.log("Created widget:", widget);
    return { success: true, widget, error: null };
  } catch (error) {
    console.error("Error creating widget:", error);
    return { error: "Failed to create widget", success: false, widget: null };
  }
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [clickedWidget, setClickedWidget] = useState<string | null>(null);

  // Выводим продукты в консоль при загрузке страницы
  React.useEffect(() => {
    if (loaderData?.products) {
      console.log("Загруженные продукты:", loaderData.products);
    }
  }, [loaderData?.products]);

  const handleWidgetClick = (widgetName: string, widgetType: string) => {
    setClickedWidget(widgetName);
    console.log(`Clicked on: ${widgetName}`);

    // Отправляем данные в action для сохранения в БД
    const formData = new FormData();
    formData.append("widgetName", widgetName);
    formData.append("widgetType", widgetType);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleDeleteWidget = (widgetId: string) => {
    const formData = new FormData();
    formData.append("widgetId", widgetId);
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <Page>
      <TitleBar title="Rebuy App" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Text as="h1" variant="headingLg">
                Widgets
              </Text>

              <WidgetCards
                widgetCards={widgetCards}
                onWidgetClick={handleWidgetClick}
              />

              {clickedWidget && (
                <WidgetSelectedNotification
                  clickedWidget={clickedWidget}
                  fetcher={fetcher}
                />
              )}

              {loaderData?.widgets && loaderData.widgets.length > 0 && (
                <WidgetsTable
                  widgets={loaderData.widgets}
                  deleteWidget={handleDeleteWidget}
                />
              )}
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
