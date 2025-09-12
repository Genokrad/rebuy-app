import React, { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAllProducts } from "../graphql/productsService";
import { CartSvg, PageSvg, ProductSvg } from "../svg";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Получаем все продукты
  const products = await getAllProducts(request);

  return { products };
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [clickedWidget, setClickedWidget] = useState<string | null>(null);

  // Выводим продукты в консоль при загрузке страницы
  React.useEffect(() => {
    if (loaderData?.products) {
      console.log("Загруженные продукты:", loaderData.products);
    }
  }, [loaderData?.products]);

  const handleWidgetClick = (widgetName: string) => {
    setClickedWidget(widgetName);
    console.log(`Clicked on: ${widgetName}`);
  };

  const widgetCards = [
    {
      id: "products-page",
      title: "Products page",
      description: "Create an upsell widget on the product page",
      icon: <ProductSvg />, // Используем эмодзи как иконки
    },
    {
      id: "cart",
      title: "Cart",
      description: "Create an upsell widget on the Cart",
      icon: <CartSvg />,
    },
    {
      id: "checkout",
      title: "Checkout page",
      description: "Create an upsell widget on the checkout page",
      icon: <PageSvg />,
    },
  ];

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
                          onClick={() => handleWidgetClick(widget.title)}
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
