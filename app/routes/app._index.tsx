import React, { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Banner,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAllProducts } from "../graphql/productsService";
import { GET_SHOP_PLAN_QUERY } from "../graphql/getShopPlan";
import {
  ACTIVATE_CART_TRANSFORM_MUTATION,
  GET_CART_TRANSFORM_FUNCTIONS_QUERY,
} from "../graphql/activateCartTransform";
import {
  createWidget,
  deleteWidget,
  updateWidget,
  getWidgetsByShop,
} from "../services/widgetService";
import { widgetCards } from "../data/default-data";
import {
  WidgetCards,
  WidgetsTable,
  WidgetSelectedNotification,
  WidgetEditor,
} from "../components";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Получаем план магазина
  const shopPlanResponse = await admin.graphql(GET_SHOP_PLAN_QUERY);
  const shopPlanData = await shopPlanResponse.json();
  const shopPlan = shopPlanData?.data?.shop?.plan;
  const isPlus =
    shopPlan?.displayName === "Shopify Plus" ||
    shopPlan?.partnerDevelopment === true;

  // Получаем все продукты
  const products = await getAllProducts(request);

  // Получаем все виджеты для текущего магазина
  const { session } = await authenticate.admin(request);
  const widgets = await getWidgetsByShop(session.shop);

  // Проверяем и активируем Cart Transform Function, если нужно
  let cartTransformActive = false;
  let activationError = null;
  if (isPlus) {
    try {
      // Проверяем, активирована ли функция
      const checkResponse = await admin.graphql(`
        query {
          cartTransforms(first: 1) {
            nodes {
              id
              functionId
            }
          }
        }
      `);
      const checkData = await checkResponse.json();

      if (checkData?.errors) {
        activationError = checkData.errors
          .map((e: any) => e.message)
          .join(", ");
        console.error("Error checking cart transforms:", checkData.errors);
      } else {
        const existingTransforms = checkData?.data?.cartTransforms?.nodes || [];

        if (existingTransforms.length === 0) {
          // Сначала получаем functionId через query
          const functionsQueryResponse = await admin.graphql(
            GET_CART_TRANSFORM_FUNCTIONS_QUERY,
          );
          const functionsQueryData = await functionsQueryResponse.json();

          if (functionsQueryData?.errors) {
            activationError = functionsQueryData.errors
              .map((e: any) => e.message)
              .join(", ");
            console.error(
              "Error querying cart transform functions:",
              functionsQueryData.errors,
            );
          } else {
            const functions =
              functionsQueryData?.data?.shopifyFunctions?.nodes || [];

            if (functions.length === 0) {
              activationError =
                "No cart transform functions found. Please ensure the function is deployed.";
              console.error("No cart transform functions found");
            } else {
              // Берем первую функцию (обычно у приложения одна Cart Transform функция)
              const targetFunction = functions[0];

              // Активируем функцию используя functionId
              const activateResponse = await admin.graphql(
                ACTIVATE_CART_TRANSFORM_MUTATION,
                {
                  variables: {
                    functionId: targetFunction.id,
                  },
                },
              );
              const activateData = await activateResponse.json();

              if (activateData?.errors) {
                activationError = activateData.errors
                  .map((e: any) => e.message)
                  .join(", ");
                console.error(
                  "GraphQL errors activating cart transform:",
                  activateData.errors,
                );
              } else if (
                activateData?.data?.cartTransformCreate?.userErrors?.length > 0
              ) {
                activationError =
                  activateData.data.cartTransformCreate.userErrors
                    .map((e: any) => e.message)
                    .join(", ");
                console.error(
                  "Failed to activate cart transform:",
                  activateData.data.cartTransformCreate.userErrors,
                );
              } else if (
                activateData?.data?.cartTransformCreate?.cartTransform
              ) {
                cartTransformActive = true;
              }
            }
          }
        } else {
          cartTransformActive = true;
        }
      }
    } catch (error) {
      activationError =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error checking/activating cart transform:", error);
    }
  }

  return {
    products,
    widgets,
    shopPlan: shopPlan?.displayName || "Unknown",
    isPlus,
    cartTransformActive,
    activationError,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();

  // Проверяем, это запрос на удаление виджета
  if (formData.get("widgetId")) {
    const widgetId = formData.get("widgetId") as string;
    try {
      await deleteWidget(widgetId);
      return { success: true, deleted: true, widget: null, error: null };
    } catch (error) {
      console.error("Error deleting widget:", error);
      return { error: "Failed to delete widget", success: false, widget: null };
    }
  }

  // Проверяем, это обновление существующего виджета
  const updateWidgetId = formData.get("updateWidgetId") as string;
  if (updateWidgetId) {
    const widgetName = formData.get("widgetName") as string;
    const widgetType = formData.get("widgetType") as string;
    const allRelations = formData.get("allRelations") as string;
    const settingsStr = formData.get("settings") as string;

    if (!widgetName || !widgetType) {
      return { error: "Missing widget name or type", success: false };
    }

    try {
      let products = undefined;
      if (allRelations) {
        products = JSON.parse(allRelations);
      }

      let settings = undefined;
      if (settingsStr) {
        settings = JSON.parse(settingsStr);
      }

      const widget = await updateWidget(
        updateWidgetId,
        widgetName,
        widgetType,
        products,
        settings,
      );
      return { success: true, widget, error: null };
    } catch (error) {
      console.error("Error updating widget:", error);
      return { error: "Failed to update widget", success: false, widget: null };
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
  const [currentWidgets, setCurrentWidgets] = useState<{
    id: string;
    name: string;
    type: string;
    products?: any[];
    settings?: any;
  } | null>(null);

  const handleWidgetClick = (widgetName: string, widgetType: string) => {
    setClickedWidget(widgetName);
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

  const handleEditeWidgets = (widgets: string, name: string, type: string) => {
    // Находим виджет в данных для получения products
    const widget = loaderData?.widgets?.find((w) => w.id === widgets);
    setCurrentWidgets({
      id: widgets,
      name,
      type,
      products: widget?.products,
      // прокидываем сохраненные настройки
      settings: (widget as any)?.settings,
    });
  };

  const handleBackToWidgets = () => {
    setCurrentWidgets(null);
  };

  const handleSaveWidget = (
    name: string,
    value: string,
    parentProduct: any,
    allRelations: any[],
    widgetId: string,
    settings?: any,
  ) => {
    // Отправляем данные в action для обновления виджета
    const formData = new FormData();
    formData.append("updateWidgetId", widgetId);
    formData.append("widgetName", name);
    formData.append("widgetType", currentWidgets?.type || "");

    if (allRelations && allRelations.length > 0) {
      formData.append("allRelations", JSON.stringify(allRelations));
    }

    if (settings) {
      formData.append("settings", JSON.stringify(settings));
    }

    fetcher.submit(formData, { method: "POST" });
    setCurrentWidgets(null);
  };

  return (
    <Page>
      <TitleBar title="Rebuy App" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            {!currentWidgets && (
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h1" variant="headingLg">
                    Widgets
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Plan: {loaderData?.shopPlan}{" "}
                    {loaderData?.isPlus ? "✓" : "⚠"}
                  </Text>
                </InlineStack>

                {!loaderData?.isPlus && (
                  <Banner tone="warning" title="Shopify Plus Required">
                    <p>
                      Cart Transform Functions require Shopify Plus. Your
                      current plan: <strong>{loaderData?.shopPlan}</strong>.
                      Cart discounts will not be applied automatically.
                    </p>
                  </Banner>
                )}

                {loaderData?.isPlus && (
                  <Banner
                    tone={
                      loaderData?.cartTransformActive ? "success" : "warning"
                    }
                    title={
                      loaderData?.cartTransformActive
                        ? "Cart Transform Function Active"
                        : "Cart Transform Function Not Active"
                    }
                  >
                    {}
                    <p>
                      {loaderData?.cartTransformActive
                        ? "Your store is on Shopify Plus and Cart Transform Function is active. Discounts will be applied automatically."
                        : loaderData?.activationError
                          ? `Error activating Cart Transform Function: ${loaderData.activationError}. Please check that the function is deployed and you have the required scopes (read_cart_transforms, write_cart_transforms).`
                          : "Your store is on Shopify Plus, but Cart Transform Function is not active. Please refresh the page to activate it."}
                    </p>
                  </Banner>
                )}

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
                    handleEditeWidgets={handleEditeWidgets}
                  />
                )}
              </BlockStack>
            )}

            {currentWidgets && (
              <WidgetEditor
                widgetName={currentWidgets.name}
                widgetId={currentWidgets.id}
                widgetType={currentWidgets.type}
                products={loaderData?.products || []}
                existingProducts={currentWidgets.products}
                // прокидываем сохраненные настройки
                settings={(currentWidgets as any)?.settings}
                onBack={handleBackToWidgets}
                onSave={handleSaveWidget}
              />
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
