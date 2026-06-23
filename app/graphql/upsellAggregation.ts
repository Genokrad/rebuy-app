// Pure upsell / promo attribution + aggregation logic.
//
// This module has NO Shopify/network dependency on purpose, so it can be unit
// tested in isolation. The I/O wrapper (bulk operation + JSONL parsing) lives
// in upsellOrdersService.ts and feeds the parsed orders into here.
//
// A line item qualifies for the report if EITHER:
//   1. it is a cart-upsell line (hidden property _source = cart_upsell), OR
//   2. one of the target bundle discounts is applied to it (by name).
// These are two independent "kinds" of products; an item can match one or both.

// --- Kind 1: cart upsell --------------------------------------------------
// Hidden line item properties stamped by the storefront cart upsell widget on
// /cart/add.js. Returned by the Admin API via `customAttributes` (only hidden
// in the customer-facing UI, not in the Admin API).
export const UPSELL_PROPERTY_KEY = "_source";
export const UPSELL_PROPERTY_VALUE = "cart_upsell";

// --- Kind 2: bundle discounts ---------------------------------------------
// Discounts (codes OR automatic discounts) whose name identifies a bundle.
// Matched case-insensitively against each line's discount names.
export const TARGET_DISCOUNT_NAMES = [
  "ARTDUO",
  "GYMDUO",
  "JUNGLEDUO",
  "KISSENDUO",
];

// ---------------------------------------------------------------------------
// Public result types (this is the JSON shape returned by /api/upsell-orders)
// ---------------------------------------------------------------------------

export interface UpsellItem {
  title: string;
  variant_id: string | null; // full gid, e.g. gid://shopify/ProductVariant/123
  sku: string | null;
  quantity: number;
  unit_price: number; // original unit price, BEFORE discounts (reference)
  original_total: number; // unit_price * quantity, before discounts
  discount_amount: number; // all discounts allocated to this line, incl. order-level
  net_total: number; // original_total - discount_amount (the revenue basis)
  is_upsell: boolean; // matched via _source = cart_upsell
  discount_names: string[]; // all discount names applied to this line (code or title)
  matched_discounts: string[]; // subset of discount_names that are in the target list
}

export interface UpsellOrderRow {
  order_id: string;
  order_name: string;
  created_at: string;
  currency: string;
  upsell_revenue: number; // sum of net_total over qualifying line items
  discount_names: string[]; // union of discount names across qualifying items
  matched_discounts: string[]; // union of target-discount names across qualifying items
  upsell_items: UpsellItem[];
}

export interface CurrencyBreakdown {
  currency: string;
  total_upsell_revenue: number; // net of discounts
  orders_count: number;
}

export interface UpsellOrdersResult {
  from: string;
  to: string;
  currency_breakdown: CurrencyBreakdown[];
  orders: UpsellOrderRow[];
}

export interface GetUpsellOrdersOptions {
  from: string; // ISO date (YYYY-MM-DD)
  to: string; // ISO date (YYYY-MM-DD)
  // When false (default) we drop cancelled orders and refunded /
  // partially-refunded orders. Set true to keep them.
  includeRefunds?: boolean;
  // Override the bundle-discount names to match (defaults to TARGET_DISCOUNT_NAMES).
  discountNames?: string[];
}

// ---------------------------------------------------------------------------
// Parsed input shapes (produced by the bulk-operation JSONL parser)
// ---------------------------------------------------------------------------

export interface ParsedDiscountAllocation {
  amount: number; // allocatedAmount in shop currency
  name: string | null; // discount code (code discounts) or title (automatic/manual/script)
  type: string | null; // GraphQL __typename of the discount application
}

export interface ParsedLineItem {
  title: string;
  quantity: number;
  variantId: string | null;
  sku: string | null;
  originalUnitPrice: number; // before discounts
  originalTotal: number; // unit * qty, before discounts (exact, from originalTotalSet)
  // All discounts allocated to this line. Order-level (cart / discount-code /
  // automatic) discounts are distributed across line items and appear here,
  // which is the only reliable way to net them out per line.
  discountAllocations: ParsedDiscountAllocation[];
  customAttributes: Array<{ key: string; value: string }>;
}

export interface ParsedOrder {
  id: string;
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  financialStatus: string | null;
  currencyCode: string;
  lineItems: ParsedLineItem[];
}

// ---------------------------------------------------------------------------
// Logic
// ---------------------------------------------------------------------------

function isUpsellLine(line: ParsedLineItem): boolean {
  return line.customAttributes.some(
    (attr) =>
      attr.key === UPSELL_PROPERTY_KEY && attr.value === UPSELL_PROPERTY_VALUE,
  );
}

function lineDiscountNames(line: ParsedLineItem): string[] {
  return Array.from(
    new Set(
      line.discountAllocations
        .map((alloc) => alloc.name)
        .filter((name): name is string => !!name),
    ),
  );
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function buildUpsellItem(
  line: ParsedLineItem,
  targetSet: Set<string>,
): { item: UpsellItem; netTotal: number } {
  const discountAmount = line.discountAllocations.reduce(
    (sum, alloc) => sum + alloc.amount,
    0,
  );
  // Net of ALL discounts (line-level + order-level / automatic allocations).
  const netTotal = line.originalTotal - discountAmount;

  const discount_names = lineDiscountNames(line);
  const matched_discounts = discount_names.filter((name) =>
    targetSet.has(name.toUpperCase()),
  );

  return {
    netTotal,
    item: {
      title: line.title,
      variant_id: line.variantId,
      sku: line.sku,
      quantity: line.quantity,
      unit_price: line.originalUnitPrice,
      original_total: round2(line.originalTotal),
      discount_amount: round2(discountAmount),
      net_total: round2(netTotal),
      is_upsell: isUpsellLine(line),
      discount_names,
      matched_discounts,
    },
  };
}

function processOrder(
  order: ParsedOrder,
  targetSet: Set<string>,
): UpsellOrderRow | null {
  // A line qualifies if it is an upsell line OR carries a target discount.
  const qualifying = order.lineItems
    .map((line) => buildUpsellItem(line, targetSet))
    .filter(
      ({ item }) => item.is_upsell || item.matched_discounts.length > 0,
    );

  if (qualifying.length === 0) return null;

  let upsellRevenue = 0;
  const discountNames = new Set<string>();
  const matched = new Set<string>();
  const upsell_items: UpsellItem[] = qualifying.map(({ item, netTotal }) => {
    upsellRevenue += netTotal;
    item.discount_names.forEach((n) => discountNames.add(n));
    item.matched_discounts.forEach((n) => matched.add(n));
    return item;
  });

  return {
    order_id: order.id,
    order_name: order.name,
    created_at: order.createdAt,
    currency: order.currencyCode,
    upsell_revenue: round2(upsellRevenue),
    discount_names: Array.from(discountNames),
    matched_discounts: Array.from(matched),
    upsell_items,
  };
}

/**
 * Pure aggregation: turns parsed orders into the upsell / promo revenue report.
 *
 * A line item is included if it is a cart-upsell line (_source = cart_upsell)
 * OR a target bundle discount (e.g. ARTDUO) is applied to it. Only those
 * matching lines contribute to revenue. Revenue is NET of all discounts —
 * including the share of an order-level / automatic discount allocated to the
 * line. Totals are grouped by currency — mixed currencies are never summed.
 */
export function aggregateUpsellOrders(
  orders: ParsedOrder[],
  {
    from,
    to,
    includeRefunds = false,
    discountNames = TARGET_DISCOUNT_NAMES,
  }: GetUpsellOrdersOptions,
): UpsellOrdersResult {
  const targetSet = new Set(discountNames.map((n) => n.toUpperCase()));

  const considered = includeRefunds
    ? orders
    : orders.filter((order) => {
        if (order.cancelledAt) return false;
        const status = order.financialStatus?.toUpperCase();
        if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") {
          return false;
        }
        return true;
      });

  const rows: UpsellOrderRow[] = [];
  for (const order of considered) {
    const row = processOrder(order, targetSet);
    if (row) rows.push(row);
  }

  const breakdownMap = new Map<string, CurrencyBreakdown>();
  for (const row of rows) {
    const entry = breakdownMap.get(row.currency) ?? {
      currency: row.currency,
      total_upsell_revenue: 0,
      orders_count: 0,
    };
    entry.total_upsell_revenue += row.upsell_revenue;
    entry.orders_count += 1;
    breakdownMap.set(row.currency, entry);
  }

  const currency_breakdown = Array.from(breakdownMap.values()).map((b) => ({
    ...b,
    total_upsell_revenue: round2(b.total_upsell_revenue),
  }));

  return { from, to, currency_breakdown, orders: rows };
}
