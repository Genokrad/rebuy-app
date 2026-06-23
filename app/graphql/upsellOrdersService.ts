import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import {
  aggregateUpsellOrders,
  type GetUpsellOrdersOptions,
  type ParsedOrder,
  type UpsellOrdersResult,
} from "./upsellAggregation";

// Re-export the pure pieces so callers can keep importing from this service.
export {
  aggregateUpsellOrders,
  UPSELL_PROPERTY_KEY,
  UPSELL_PROPERTY_VALUE,
  TARGET_DISCOUNT_NAMES,
} from "./upsellAggregation";
export type {
  GetUpsellOrdersOptions,
  UpsellItem,
  UpsellOrderRow,
  CurrencyBreakdown,
  UpsellOrdersResult,
} from "./upsellAggregation";

const API_VERSION = "2026-01" as ApiVersion;

// ---------------------------------------------------------------------------
// Bulk operation GraphQL
// ---------------------------------------------------------------------------

// Field set is intentionally narrow: only what upsell attribution needs.
// `customAttributes` carries the hidden _source / _upsell_collection properties.
const buildBulkQuery = (dateQuery: string): string => `
  {
    orders(query: ${JSON.stringify(dateQuery)}) {
      edges {
        node {
          id
          name
          createdAt
          cancelledAt
          displayFinancialStatus
          currencyCode
          lineItems(first: 250) {
            edges {
              node {
                id
                title
                quantity
                sku
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                originalTotalSet { shopMoney { amount currencyCode } }
                discountAllocations {
                  allocatedAmountSet { shopMoney { amount currencyCode } }
                  discountApplication {
                    __typename
                    ... on DiscountCodeApplication { code }
                    ... on AutomaticDiscountApplication { title }
                    ... on ManualDiscountApplication { title }
                    ... on ScriptDiscountApplication { title }
                  }
                }
                variant { id sku }
                customAttributes { key value }
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
      bulkOperation { id status }
      userErrors { field message }
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
        objectCount
        url
        partialDataUrl
      }
    }
  }
`;

async function startBulkOperation(
  request: Request,
  dateQuery: string,
): Promise<string> {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(BULK_OPERATION_RUN_QUERY, {
    variables: { query: buildBulkQuery(dateQuery) },
    apiVersion: API_VERSION,
  });

  const json: any = await response.json();

  if (json.errors) {
    throw new Error(
      `Failed to start upsell bulk operation: ${json.errors
        .map((e: any) => e.message)
        .join(", ")}`,
    );
  }

  const data = json.data?.bulkOperationRunQuery;
  if (data?.userErrors?.length) {
    // A common one here is "A bulk query operation for this app and shop is
    // already in progress" — Shopify allows only one bulk op per shop at a time.
    throw new Error(
      `Upsell bulk operation user errors: ${data.userErrors
        .map((e: any) => e.message)
        .join(", ")}`,
    );
  }

  const id = data?.bulkOperation?.id;
  if (!id) {
    throw new Error("No bulk operation id returned from Shopify");
  }
  return id;
}

async function waitForBulkOperation(
  request: Request,
  operationId: string,
  maxWaitTime = 300000, // 5 minutes
  pollInterval = 2000,
): Promise<string> {
  const { admin } = await authenticate.admin(request);
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const response = await admin.graphql(BULK_OPERATION_STATUS_QUERY, {
      variables: { id: operationId },
      apiVersion: API_VERSION,
    });

    const json: any = await response.json();
    if (json.errors) {
      throw new Error(
        `Failed to poll bulk operation: ${json.errors
          .map((e: any) => e.message)
          .join(", ")}`,
      );
    }

    const node = json.data?.node;
    if (!node) {
      throw new Error("No node returned while polling bulk operation");
    }

    if (node.status === "COMPLETED") {
      // No url at COMPLETED means there were simply no matching orders.
      return node.url || node.partialDataUrl || "";
    }

    if (node.status === "FAILED" || node.status === "CANCELED") {
      throw new Error(
        `Bulk operation ${node.status.toLowerCase()}: ${node.errorCode || "UNKNOWN"}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(
    `Bulk operation timeout: did not complete within ${maxWaitTime}ms`,
  );
}

function toNumber(amount: string | undefined | null): number {
  const n = Number(amount);
  return Number.isFinite(n) ? n : 0;
}

async function downloadAndParseBulkResults(url: string): Promise<ParsedOrder[]> {
  if (!url) return [];

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download bulk results: ${response.statusText}`);
  }

  const text = await response.text();
  if (!text.trim()) return [];

  const lines = text
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  const ordersMap = new Map<string, ParsedOrder>();

  for (const line of lines) {
    let obj: any;
    try {
      obj = JSON.parse(line);
    } catch (error) {
      console.error("Failed to parse JSONL line:", line, error);
      continue;
    }

    if (!obj.__parentId) {
      // Order node.
      if (obj.id && obj.name && obj.createdAt) {
        ordersMap.set(obj.id, {
          id: obj.id,
          name: obj.name,
          createdAt: obj.createdAt,
          cancelledAt: obj.cancelledAt ?? null,
          financialStatus: obj.displayFinancialStatus ?? null,
          currencyCode: obj.currencyCode || "USD",
          lineItems: [],
        });
      }
    } else {
      // Line item node — attach to its parent order.
      const order = ordersMap.get(obj.__parentId);
      if (order) {
        const quantity = obj.quantity || 0;
        const originalUnitPrice = toNumber(
          obj.originalUnitPriceSet?.shopMoney?.amount,
        );
        order.lineItems.push({
          title: obj.title || "",
          quantity,
          variantId: obj.variant?.id ?? null,
          sku: obj.sku || obj.variant?.sku || null,
          originalUnitPrice,
          // Prefer the exact line total from the API; fall back to unit * qty.
          originalTotal: obj.originalTotalSet?.shopMoney?.amount
            ? toNumber(obj.originalTotalSet.shopMoney.amount)
            : originalUnitPrice * quantity,
          discountAllocations:
            obj.discountAllocations?.map((alloc: any) => {
              const app = alloc.discountApplication;
              // Name = code for code discounts, title for automatic/manual/script.
              const name = app?.code ?? app?.title ?? null;
              return {
                amount: toNumber(alloc.allocatedAmountSet?.shopMoney?.amount),
                name,
                type: app?.__typename ?? null,
              };
            }) || [],
          customAttributes:
            obj.customAttributes?.map((attr: any) => ({
              key: attr.key || "",
              value: String(attr.value ?? ""),
            })) || [],
        });
      }
    }
  }

  return Array.from(ordersMap.values());
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Returns upsell-attributed revenue per order for the given date range.
 *
 * Uses the Admin GraphQL Bulk Operations API — required for ranges that can
 * span thousands of orders. Note Shopify permits only ONE bulk operation per
 * shop at a time, so concurrent calls (e.g. the analytics page running its own
 * bulk op) may surface an "already in progress" error.
 *
 * The actual filtering/aggregation is the pure `aggregateUpsellOrders`.
 */
export async function getUpsellOrders(
  request: Request,
  { from, to, includeRefunds = false, discountNames }: GetUpsellOrdersOptions,
): Promise<UpsellOrdersResult> {
  // Span the full days. created_at:<='2026-03-31' alone compares against the
  // start of that day and would drop most of it, so we pin explicit times.
  const dateQuery = `created_at:>='${from}T00:00:00Z' AND created_at:<='${to}T23:59:59Z'`;

  const operationId = await startBulkOperation(request, dateQuery);
  const resultUrl = await waitForBulkOperation(request, operationId);
  const orders = await downloadAndParseBulkResults(resultUrl);

  return aggregateUpsellOrders(orders, {
    from,
    to,
    includeRefunds,
    discountNames,
  });
}
