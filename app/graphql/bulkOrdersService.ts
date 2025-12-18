import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import type { Order } from "./getOrders";

// Шаблон запроса для bulk операции (query будет вставлен динамически)
const BULK_OPERATION_QUERY_TEMPLATE = (dateQuery: string) => `
  {
    orders(query: "${dateQuery}") {
      edges {
        node {
          id
          name
          createdAt
          cancelledAt
          currencyCode
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 250) {
            edges {
              node {
                id
                title
                variantTitle
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                originalTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                variant {
                  id
                  product {
                    id
                  }
                }
                customAttributes {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

const BULK_OPERATION_RUN_QUERY = `
  mutation bulkOperationRunQuery($query: String!) {
    bulkOperationRunQuery(query: $query) {
      bulkOperation {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const BULK_OPERATION_STATUS_QUERY = `
  query bulkOperationStatus($id: ID!) {
    node(id: $id) {
      ... on BulkOperation {
        id
        status
        errorCode
        createdAt
        completedAt
        objectCount
        fileSize
        url
        partialDataUrl
      }
    }
  }
`;

interface BulkOperationResponse {
  bulkOperation: {
    id: string;
    status: string;
  };
  userErrors: Array<{
    field: string[];
    message: string;
  }>;
}

interface BulkOperationStatus {
  node: {
    id: string;
    status: string;
    errorCode: string | null;
    createdAt: string;
    completedAt: string | null;
    objectCount: string;
    fileSize: string | null;
    url: string | null;
    partialDataUrl: string | null;
  };
}

/**
 * Запускает bulk операцию для получения всех заказов в указанном диапазоне дат
 */
async function runBulkOperation(
  request: Request,
  startDate: Date,
  endDate: Date,
): Promise<string> {
  const { admin } = await authenticate.admin(request);

  // Формируем query для фильтрации по дате
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];
  const dateQuery = `created_at:>='${startDateStr}' AND created_at:<='${endDateStr}'`;

  // Формируем полный GraphQL запрос для bulk операции
  const fullQuery = BULK_OPERATION_QUERY_TEMPLATE(dateQuery);

  // Запускаем bulk операцию
  const response = await admin.graphql(BULK_OPERATION_RUN_QUERY, {
    variables: {
      query: fullQuery,
    },
    apiVersion: ApiVersion.January25,
  });

  const responseJson: any = await response.json();

  if (responseJson.errors) {
    console.error("GraphQL errors:", responseJson.errors);
    throw new Error(
      `Failed to start bulk operation: ${responseJson.errors.map((e: any) => e.message).join(", ")}`,
    );
  }

  // Логируем полный ответ для отладки
  console.log(
    "Bulk operation response:",
    JSON.stringify(responseJson, null, 2),
  );

  const data = responseJson.data?.bulkOperationRunQuery as
    | BulkOperationResponse
    | undefined;

  if (!data) {
    console.error("No data in response:", responseJson);
    throw new Error("No data returned from bulk operation query");
  }

  if (data.userErrors && data.userErrors.length > 0) {
    const errors = data.userErrors.map((e) => e.message).join(", ");
    throw new Error(`Bulk operation user errors: ${errors}`);
  }

  if (!data.bulkOperation) {
    console.error("No bulkOperation in response data:", data);
    throw new Error("No bulkOperation returned from bulk operation query");
  }

  if (!data.bulkOperation.id) {
    console.error("No id in bulkOperation:", data.bulkOperation);
    throw new Error("No id returned in bulkOperation");
  }

  return data.bulkOperation.id;
}

/**
 * Ожидает завершения bulk операции, опрашивая её статус
 */
async function waitForBulkOperation(
  request: Request,
  operationId: string,
  maxWaitTime: number = 300000, // 5 минут по умолчанию
  pollInterval: number = 2000, // 2 секунды
): Promise<string> {
  const { admin } = await authenticate.admin(request);
  const startTime = Date.now();
  let lastStatus = "";

  console.log(`Starting to poll bulk operation ${operationId}`);

  while (Date.now() - startTime < maxWaitTime) {
    const response = await admin.graphql(BULK_OPERATION_STATUS_QUERY, {
      variables: {
        id: operationId,
      },
      apiVersion: ApiVersion.January25,
    });

    const responseJson: any = await response.json();

    if (responseJson.errors) {
      throw new Error(
        `Failed to check bulk operation status: ${responseJson.errors.map((e: any) => e.message).join(", ")}`,
      );
    }

    const data = responseJson.data as BulkOperationStatus;

    if (!data || !data.node) {
      console.error("No node in bulk operation status response:", responseJson);
      throw new Error("No node returned from bulk operation status query");
    }

    const status = data.node.status;

    // Логируем изменение статуса
    if (status !== lastStatus) {
      console.log(
        `Bulk operation ${operationId} status changed: ${lastStatus} -> ${status}`,
      );
      lastStatus = status;
    }

    // Если операция завершена успешно
    if (status === "COMPLETED") {
      const url = data.node.url || data.node.partialDataUrl;

      console.log("Bulk operation completed. Details:", {
        id: data.node.id,
        status: data.node.status,
        objectCount: data.node.objectCount,
        fileSize: data.node.fileSize,
        hasUrl: !!data.node.url,
        hasPartialUrl: !!data.node.partialDataUrl,
      });

      if (!url) {
        // Если URL нет при статусе COMPLETED, это означает, что операция завершилась
        // но данных для возврата нет (например, нет заказов в указанном диапазоне)
        // Это нормальная ситуация, не ошибка
        console.log(
          "Bulk operation completed with no data - returning empty result",
        );
        return "";
      }

      console.log(`Bulk operation completed successfully. URL: ${url}`);
      return url;
    }

    // Если операция завершилась с ошибкой
    if (status === "FAILED" || status === "CANCELED") {
      const errorCode = data.node.errorCode || "UNKNOWN";
      console.error(`Bulk operation ${status.toLowerCase()}:`, {
        id: data.node.id,
        errorCode,
        objectCount: data.node.objectCount,
      });
      throw new Error(`Bulk operation ${status.toLowerCase()}: ${errorCode}`);
    }

    // Операция ещё выполняется (CREATED, RUNNING и т.д.)
    // Показываем прогресс, если доступен
    if (data.node.objectCount) {
      console.log(
        `Bulk operation in progress: ${status}, processed ${data.node.objectCount} objects`,
      );
    }

    // Ждём перед следующей проверкой статуса
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(
    `Bulk operation timeout: operation did not complete within ${maxWaitTime}ms`,
  );
}

/**
 * Скачивает и парсит JSONL файл с результатами bulk операции
 */
async function downloadAndParseBulkResults(url: string): Promise<Order[]> {
  // Если URL пустой, это означает, что нет данных для возврата
  if (!url || url === "") {
    console.log("No URL provided - returning empty orders array");
    return [];
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download bulk operation results: ${response.statusText}`,
    );
  }

  const text = await response.text();

  // Если файл пустой, возвращаем пустой массив
  if (!text || text.trim().length === 0) {
    console.log("Empty bulk operation results file");
    return [];
  }

  const lines = text
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  const ordersMap = new Map<string, any>();

  // Парсим JSONL файл
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);

      // Если это заказ (не имеет __parentId)
      if (!obj.__parentId) {
        // Проверяем, что это действительно заказ по наличию нужных полей
        if (obj.id && obj.name && obj.createdAt) {
          const orderId = obj.id;
          ordersMap.set(orderId, {
            id: obj.id,
            name: obj.name,
            createdAt: obj.createdAt,
            currencyCode: obj.currencyCode || "USD",
            totalPrice: obj.totalPriceSet?.shopMoney?.amount || "0",
            subtotalPrice: obj.subtotalPriceSet?.shopMoney?.amount || "0",
            totalDiscounts: obj.totalDiscountsSet?.shopMoney?.amount || "0",
            totalTax: obj.totalTaxSet?.shopMoney?.amount || "0",
            lineItems: [],
          });
        }
      } else {
        // Это line item, добавляем к родительскому заказу
        const parentId = obj.__parentId;
        const order = ordersMap.get(parentId);
        if (order) {
          order.lineItems.push({
            id: obj.id,
            title: obj.title || "",
            variantTitle: obj.variantTitle || undefined,
            quantity: obj.quantity || 0,
            originalUnitPrice:
              obj.originalUnitPriceSet?.shopMoney?.amount || "0",
            discountedUnitPrice:
              obj.discountedUnitPriceSet?.shopMoney?.amount || "0",
            originalTotal: obj.originalTotalSet?.shopMoney?.amount || "0",
            discountedTotal: obj.discountedTotalSet?.shopMoney?.amount || "0",
            currencyCode: obj.originalUnitPriceSet?.shopMoney?.currencyCode,
            variantId: obj.variant?.id?.split("/").pop(),
            productId: obj.variant?.product?.id?.split("/").pop(),
            customAttributes:
              obj.customAttributes?.map((attr: any) => ({
                key: attr.key || "",
                value: String(attr.value || ""),
              })) || [],
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse JSONL line:", line, error);
    }
  }

  // Преобразуем Map в массив
  return Array.from(ordersMap.values());
}

/**
 * Получает все заказы в указанном диапазоне дат используя bulk операции
 */
export async function getOrdersBulk(
  request: Request,
  startDate: Date,
  endDate: Date,
  filterSellenceOnly: boolean = false,
  excludeCancelled: boolean = false,
): Promise<Order[]> {
  try {
    // Запускаем bulk операцию
    const operationId = await runBulkOperation(request, startDate, endDate);

    // Ждём завершения операции
    const resultUrl = await waitForBulkOperation(request, operationId);

    // Скачиваем и парсим результаты
    let allOrders = await downloadAndParseBulkResults(resultUrl);

    // Фильтруем отмененные заказы, если нужно
    if (excludeCancelled) {
      allOrders = allOrders.filter((order) => !order.cancelledAt);
    }

    // Фильтруем заказы только если включен фильтр Sellence
    if (filterSellenceOnly) {
      return allOrders.filter((order) => {
        // Проверяем каждый line item на наличие атрибутов Sellence
        for (const lineItem of order.lineItems) {
          const attributes = lineItem.customAttributes || [];
          for (const attr of attributes) {
            const key = attr.key;
            const value = attr.value;

            if (
              key === "_sellence_discount" ||
              key === "_sellence_widget_id" ||
              key === "_sellence_widget_type" ||
              key === "_sellence_applied"
            ) {
              if (key === "_sellence_discount" || key === "_sellence_applied") {
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
      });
    }

    return allOrders;
  } catch (error) {
    console.error("Bulk operation error:", error);
    throw error;
  }
}
