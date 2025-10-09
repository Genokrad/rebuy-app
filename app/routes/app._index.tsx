import React, { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  DataTable,
  Badge,
  InlineStack,
  ButtonGroup,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAllProducts } from "../graphql/productsService";
import { createWidget, getWidgetsByShop } from "../services/widgetService";
import { CartSvg, PageSvg, ProductSvg } from "../svg";

// Функция для форматирования даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

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

  const widgetCards = [
    {
      id: "products-page",
      title: "Products page",
      type: "products-page",
      description: "Create an upsell widget on the product page",
      icon: <ProductSvg />,
    },
    {
      id: "cart",
      title: "Cart",
      type: "cart",
      description: "Create an upsell widget on the Cart",
      icon: <CartSvg />,
    },
    {
      id: "checkout",
      title: "Checkout page",
      type: "checkout",
      description: "Create an upsell widget on the checkout page",
      icon: <PageSvg />,
    },
  ];

  // Подготавливаем данные для таблицы
  const tableRows =
    loaderData?.widgets?.map((widget) => [
      <InlineStack key={`${widget.id}-name`} gap="200" align="start">
        <input type="checkbox" />
        <Text as="span" variant="bodyMd">
          {widget.name}
        </Text>
      </InlineStack>,
      <Text key={`${widget.id}-widget`} as="span" variant="bodyMd">
        {widget.type === "products-page"
          ? "Products page"
          : widget.type === "cart"
            ? "Cart"
            : "Checkout page"}
      </Text>,
      <Text key={`${widget.id}-id`} as="span" variant="bodyMd">
        {widget.id}
      </Text>,
      <Badge key={`${widget.id}-status`} tone="success">
        Active
      </Badge>,
      <Text key={`${widget.id}-created`} as="span" variant="bodyMd">
        {formatDate(widget.createdAt)}
      </Text>,
      <ButtonGroup key={`${widget.id}-actions`} variant="segmented">
        <Button icon="EditIcon" accessibilityLabel="Edit widget" />
        <Button icon="DeleteIcon" accessibilityLabel="Delete widget" />
      </ButtonGroup>,
    ]) || [];

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

              <Layout>
                {widgetCards.map((widget) => (
                  <Layout.Section key={widget.id} variant="oneThird">
                    <Card>
                      <BlockStack gap="400">
                        <Box
                          padding="400"
                          background="bg-surface"
                          borderRadius="200"
                          minHeight="80px"
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                            }}
                          >
                            <Text as="span" variant="headingXl">
                              {widget.icon}
                            </Text>
                          </div>
                        </Box>

                        <BlockStack gap="200">
                          <Text as="h3" variant="headingMd">
                            {widget.title}
                          </Text>
                          <Text as="p" variant="bodyMd" tone="subdued">
                            {widget.description}
                          </Text>
                        </BlockStack>

                        <Button
                          variant="primary"
                          onClick={() =>
                            handleWidgetClick(widget.title, widget.type)
                          }
                        >
                          Create widget
                        </Button>
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                ))}
              </Layout>

              {clickedWidget && (
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Widget Selected
                    </Text>
                    <Text as="p" variant="bodyMd">
                      You clicked on: <strong>{clickedWidget}</strong>
                    </Text>
                    {fetcher.data &&
                      (fetcher.data as any).success &&
                      (fetcher.data as any).widget && (
                        <Text as="p" variant="bodyMd" tone="success">
                          ✅ Widget created successfully! ID:{" "}
                          {(fetcher.data as any).widget.id}
                        </Text>
                      )}
                    {fetcher.data && (fetcher.data as any).error && (
                      <Text as="p" variant="bodyMd" tone="critical">
                        ❌ Error: {(fetcher.data as any).error}
                      </Text>
                    )}
                    {fetcher.state === "submitting" && (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        ⏳ Creating widget...
                      </Text>
                    )}
                  </BlockStack>
                </Card>
              )}

              {/* Таблица виджетов */}
              {loaderData?.widgets && loaderData.widgets.length > 0 && (
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">
                      Created Widgets
                    </Text>
                    <DataTable
                      columnContentTypes={[
                        "text",
                        "text",
                        "text",
                        "text",
                        "text",
                        "text",
                      ]}
                      headings={[
                        "Name",
                        "Widget",
                        "ID",
                        "Status",
                        "Created",
                        "Action",
                      ]}
                      rows={tableRows}
                    />
                  </BlockStack>
                </Card>
              )}
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
