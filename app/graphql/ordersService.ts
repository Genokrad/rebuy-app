import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import { GET_ORDERS_QUERY, type Order, type OrdersResponse } from "./getOrders";

const SELLENCE_DISCOUNT_KEY = "_sellence_discount";
const SELLENCE_WIDGET_ID_KEY = "_sellence_widget_id";
const SELLENCE_WIDGET_TYPE_KEY = "_sellence_widget_type";
const SELLENCE_APPLIED_KEY = "_sellence_applied";

/**
 * Получает заказы из Shopify с фильтрацией по датам и Sellence
 */
export async function getOrders(
  request: Request,
  startDate: Date,
  endDate: Date,
  cursor?: string | null,
  limit: number = 20,
  filterSellenceOnly: boolean = false,
): Promise<{
  orders: Order[];
  hasNextPage: boolean;
  nextCursor: string | null;
}> {
  const { admin } = await authenticate.admin(request);

  // Формируем query для фильтрации по дате
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];
  const dateQuery = `created_at:>='${startDateStr}' AND created_at:<='${endDateStr}'`;

  // Запрашиваем больше заказов, так как после фильтрации останется меньше
  // Умножаем на 5, чтобы после фильтрации у нас было достаточно Sellence заказов
  // Это важно, так как не все заказы могут иметь Sellence атрибуты
  // Shopify API ограничивает максимум 250 заказов за раз
  const fetchLimit = Math.min(Math.max(limit * 5, 100), 250); // Максимум 250, минимум 100

  const variables: any = {
    first: fetchLimit, // Shopify API ограничивает максимум 250
    query: dateQuery,
  };

  if (cursor) {
    variables.after = cursor;
  }

  const response = await admin.graphql(GET_ORDERS_QUERY, {
    variables,
    apiVersion: ApiVersion.January25,
  });

  const responseJson: any = await response.json();

  if (responseJson.errors) {
    console.error("GraphQL errors:", responseJson.errors);
    throw new Error(
      `Failed to fetch orders: ${responseJson.errors.map((e: any) => e.message).join(", ")}`,
    );
  }

  const data = responseJson.data as OrdersResponse;

  // Преобразуем заказы
  const allOrders = data.orders.edges.map((edge) => {
    const node = edge.node;

    // Преобразуем line items
    const lineItems = node.lineItems.edges.map((itemEdge) => {
      const item = itemEdge.node;

      // Извлекаем customAttributes
      const customAttributes =
        item.customAttributes?.map((attr) => ({
          key: attr.key || "",
          value: String(attr.value || ""),
        })) || [];

      return {
        id: item.id,
        title: item.title,
        variantTitle: item.variantTitle || undefined,
        quantity: item.quantity,
        originalUnitPrice: item.originalUnitPriceSet?.shopMoney?.amount || "0",
        discountedUnitPrice:
          item.discountedUnitPriceSet?.shopMoney?.amount || "0",
        originalTotal: item.originalTotalSet?.shopMoney?.amount || "0",
        discountedTotal: item.discountedTotalSet?.shopMoney?.amount || "0",
        currencyCode: item.originalUnitPriceSet?.shopMoney?.currencyCode,
        variantId: item.variant?.id?.split("/").pop(),
        productId: item.variant?.product?.id?.split("/").pop(),
        customAttributes,
      };
    });

    return {
      id: node.id,
      name: node.name,
      createdAt: node.createdAt,
      currencyCode: node.currencyCode,
      totalPrice: node.totalPriceSet?.shopMoney?.amount || "0",
      subtotalPrice: node.subtotalPriceSet?.shopMoney?.amount || "0",
      totalDiscounts: node.totalDiscountsSet?.shopMoney?.amount || "0",
      totalTax: node.totalTaxSet?.shopMoney?.amount || "0",
      lineItems,
    };
  });

  // Фильтруем заказы только если включен фильтр Sellence
  const filteredOrders = filterSellenceOnly
    ? allOrders.filter((order) => {
    // Проверяем каждый line item на наличие атрибутов Sellence
    for (const lineItem of order.lineItems) {
      const attributes = lineItem.customAttributes || [];
      for (const attr of attributes) {
        const key = attr.key;
        const value = attr.value;

        if (
          key === SELLENCE_DISCOUNT_KEY ||
          key === SELLENCE_WIDGET_ID_KEY ||
          key === SELLENCE_WIDGET_TYPE_KEY ||
          key === SELLENCE_APPLIED_KEY
        ) {
              if (
                key === SELLENCE_DISCOUNT_KEY ||
                key === SELLENCE_APPLIED_KEY
              ) {
            if (value?.toLowerCase() === "true") {
              return true;
            }
          } else if (value) {
            // Для widget_id и widget_type достаточно наличия значения
            return true;
          }
        }
      }
    }
    return false;
      })
    : allOrders; // Если фильтр не включен, возвращаем все заказы

  // Проверяем наличие следующей страницы
  // Если мы получили все запрошенные заказы из Shopify, значит есть еще заказы
  const hasMoreFromShopify =
    allOrders.length >= fetchLimit || data.orders.pageInfo.hasNextPage;

  // Курсор берем из последнего заказа из Shopify (до фильтрации)
  const nextCursor =
    hasMoreFromShopify && data.orders.edges.length > 0
      ? data.orders.edges[data.orders.edges.length - 1].cursor
      : null;

  return {
    orders: filteredOrders,
    hasNextPage: hasMoreFromShopify,
    nextCursor,
  };
}
