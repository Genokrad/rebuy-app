import { describe, it, expect } from "vitest";
import {
  aggregateUpsellOrders,
  UPSELL_PROPERTY_KEY,
  UPSELL_PROPERTY_VALUE,
  type ParsedDiscountAllocation,
  type ParsedLineItem,
  type ParsedOrder,
} from "./upsellAggregation";

// --- builders -------------------------------------------------------------

const upsellAttr = [{ key: UPSELL_PROPERTY_KEY, value: UPSELL_PROPERTY_VALUE }];

function line(overrides: Partial<ParsedLineItem> = {}): ParsedLineItem {
  const quantity = overrides.quantity ?? 1;
  const originalUnitPrice = overrides.originalUnitPrice ?? 10;
  return {
    title: "Item",
    quantity,
    variantId: "gid://shopify/ProductVariant/1",
    sku: "SKU-1",
    originalUnitPrice,
    originalTotal: originalUnitPrice * quantity,
    discountAllocations: [],
    customAttributes: [],
    ...overrides,
  };
}

function upsellLine(overrides: Partial<ParsedLineItem> = {}): ParsedLineItem {
  return line({ customAttributes: upsellAttr, ...overrides });
}

// A discount code allocation (customer typed a code).
function codeAlloc(amount: number, code: string): ParsedDiscountAllocation {
  return { amount, name: code, type: "DiscountCodeApplication" };
}

// An automatic discount allocation (title carries the name, no code).
function autoAlloc(amount: number, title: string): ParsedDiscountAllocation {
  return { amount, name: title, type: "AutomaticDiscountApplication" };
}

function order(overrides: Partial<ParsedOrder> = {}): ParsedOrder {
  return {
    id: "gid://shopify/Order/1",
    name: "#1001",
    createdAt: "2026-02-15T10:23:00Z",
    cancelledAt: null,
    financialStatus: "PAID",
    currencyCode: "EUR",
    lineItems: [],
    ...overrides,
  };
}

const opts = { from: "2026-01-01", to: "2026-03-31" };

// --- tests ----------------------------------------------------------------

describe("aggregateUpsellOrders", () => {
  it("returns empty result for no orders", () => {
    expect(aggregateUpsellOrders([], opts)).toEqual({
      from: "2026-01-01",
      to: "2026-03-31",
      currency_breakdown: [],
      orders: [],
    });
  });

  it("excludes orders with neither upsell nor target-discount lines", () => {
    const orders = [
      order({
        lineItems: [
          line(),
          line({ discountAllocations: [codeAlloc(2, "RANDOM")] }), // non-target discount
        ],
      }),
    ];
    const result = aggregateUpsellOrders(orders, opts);
    expect(result.orders).toHaveLength(0);
  });

  // --- Kind 1: cart upsell ------------------------------------------------

  it("includes only upsell line items, not the whole order", () => {
    const orders = [
      order({
        lineItems: [
          line({ title: "Regular", originalUnitPrice: 100, quantity: 2 }), // ignored
          upsellLine({ title: "Wooden Slide", originalUnitPrice: 49.99 }),
        ],
      }),
    ];

    const result = aggregateUpsellOrders(orders, opts);
    expect(result.orders).toHaveLength(1);
    const row = result.orders[0];
    expect(row.upsell_revenue).toBe(49.99);
    expect(row.upsell_items).toHaveLength(1);
    expect(row.upsell_items[0]).toMatchObject({
      title: "Wooden Slide",
      is_upsell: true,
      net_total: 49.99,
      discount_names: [],
      matched_discounts: [],
    });
  });

  it("nets out an order-level discount allocated to the upsell line", () => {
    const orders = [
      order({
        lineItems: [
          upsellLine({
            originalUnitPrice: 50,
            quantity: 1,
            discountAllocations: [codeAlloc(10, "SAVE10")],
          }),
        ],
      }),
    ];

    const item = aggregateUpsellOrders(orders, opts).orders[0].upsell_items[0];
    expect(item.original_total).toBe(50);
    expect(item.discount_amount).toBe(10);
    expect(item.net_total).toBe(40);
    expect(item.discount_names).toEqual(["SAVE10"]);
    expect(aggregateUpsellOrders(orders, opts).orders[0].upsell_revenue).toBe(40);
  });

  // --- Kind 2: target bundle discounts ------------------------------------

  it("includes a line with a target discount even WITHOUT _source", () => {
    const orders = [
      order({
        lineItems: [
          // No _source attribute — qualifies purely via the ARTDUO discount.
          line({
            title: "Art Print A",
            originalUnitPrice: 30,
            quantity: 2, // 60
            discountAllocations: [autoAlloc(12, "ARTDUO")],
          }),
        ],
      }),
    ];

    const result = aggregateUpsellOrders(orders, opts);
    expect(result.orders).toHaveLength(1);
    const item = result.orders[0].upsell_items[0];
    expect(item.is_upsell).toBe(false);
    expect(item.matched_discounts).toEqual(["ARTDUO"]);
    expect(item.discount_amount).toBe(12);
    expect(item.net_total).toBe(48); // 60 - 12
    expect(result.orders[0].matched_discounts).toEqual(["ARTDUO"]);
  });

  it("detects target discounts from a CODE application too", () => {
    const orders = [
      order({
        lineItems: [
          line({
            originalUnitPrice: 20,
            discountAllocations: [codeAlloc(5, "GYMDUO")],
          }),
        ],
      }),
    ];
    const item = aggregateUpsellOrders(orders, opts).orders[0].upsell_items[0];
    expect(item.matched_discounts).toEqual(["GYMDUO"]);
    expect(item.net_total).toBe(15);
  });

  it("matches target discount names case-insensitively", () => {
    const orders = [
      order({
        lineItems: [
          line({ discountAllocations: [autoAlloc(1, "junglEduo")] }),
        ],
      }),
    ];
    const item = aggregateUpsellOrders(orders, opts).orders[0].upsell_items[0];
    expect(item.matched_discounts).toEqual(["junglEduo"]); // original casing preserved
  });

  it("ignores non-target discounts (line not upsell)", () => {
    const orders = [
      order({
        lineItems: [
          line({ discountAllocations: [autoAlloc(3, "SOMEOTHER")] }),
        ],
      }),
    ];
    expect(aggregateUpsellOrders(orders, opts).orders).toHaveLength(0);
  });

  it("supports overriding the discount-name list", () => {
    const orders = [
      order({
        lineItems: [line({ discountAllocations: [autoAlloc(3, "BLACKFRIDAY")] })],
      }),
    ];
    const result = aggregateUpsellOrders(orders, {
      ...opts,
      discountNames: ["BLACKFRIDAY"],
    });
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].upsell_items[0].matched_discounts).toEqual([
      "BLACKFRIDAY",
    ]);
  });

  // --- mixed kinds + aggregation -----------------------------------------

  it("includes both upsell AND target-discount lines in one order", () => {
    const orders = [
      order({
        lineItems: [
          upsellLine({ title: "Upsell", originalUnitPrice: 10 }), // net 10
          line({
            title: "Bundle",
            originalUnitPrice: 40,
            discountAllocations: [autoAlloc(8, "KISSENDUO")],
          }), // net 32
          line({ title: "Regular", originalUnitPrice: 999 }), // ignored
        ],
      }),
    ];

    const row = aggregateUpsellOrders(orders, opts).orders[0];
    expect(row.upsell_items).toHaveLength(2);
    expect(row.upsell_revenue).toBe(42); // 10 + 32
    expect(row.matched_discounts).toEqual(["KISSENDUO"]);
    const [a, b] = row.upsell_items;
    expect(a.is_upsell).toBe(true);
    expect(b.is_upsell).toBe(false);
    expect(b.matched_discounts).toEqual(["KISSENDUO"]);
  });

  it("rounds money to 2 decimals", () => {
    const orders = [
      order({ lineItems: [upsellLine({ originalUnitPrice: 0.1, quantity: 3 })] }),
    ];
    const result = aggregateUpsellOrders(orders, opts);
    expect(result.orders[0].upsell_items[0].net_total).toBe(0.3);
    expect(result.orders[0].upsell_revenue).toBe(0.3);
  });

  it("groups net totals by currency without mixing", () => {
    const orders = [
      order({ id: "gid://shopify/Order/1", currencyCode: "EUR", lineItems: [upsellLine({ originalUnitPrice: 10 })] }),
      order({ id: "gid://shopify/Order/2", currencyCode: "EUR", lineItems: [upsellLine({ originalUnitPrice: 5 })] }),
      order({ id: "gid://shopify/Order/3", currencyCode: "USD", lineItems: [upsellLine({ originalUnitPrice: 7 })] }),
    ];

    const result = aggregateUpsellOrders(orders, opts);
    const eur = result.currency_breakdown.find((c) => c.currency === "EUR");
    const usd = result.currency_breakdown.find((c) => c.currency === "USD");
    expect(eur).toEqual({ currency: "EUR", total_upsell_revenue: 15, orders_count: 2 });
    expect(usd).toEqual({ currency: "USD", total_upsell_revenue: 7, orders_count: 1 });
  });

  it("excludes cancelled and refunded orders by default", () => {
    const orders = [
      order({ id: "gid://shopify/Order/1", lineItems: [upsellLine({ originalUnitPrice: 10 })] }),
      order({ id: "gid://shopify/Order/2", cancelledAt: "2026-02-16T00:00:00Z", lineItems: [upsellLine({ originalUnitPrice: 99 })] }),
      order({ id: "gid://shopify/Order/3", financialStatus: "REFUNDED", lineItems: [upsellLine({ originalUnitPrice: 99 })] }),
      order({ id: "gid://shopify/Order/4", financialStatus: "PARTIALLY_REFUNDED", lineItems: [upsellLine({ originalUnitPrice: 99 })] }),
    ];

    const result = aggregateUpsellOrders(orders, opts);
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].order_id).toBe("gid://shopify/Order/1");
  });

  it("keeps cancelled/refunded orders when includeRefunds is true", () => {
    const orders = [
      order({ id: "gid://shopify/Order/1", lineItems: [upsellLine({ originalUnitPrice: 10 })] }),
      order({ id: "gid://shopify/Order/2", financialStatus: "REFUNDED", lineItems: [upsellLine({ originalUnitPrice: 99 })] }),
    ];
    const result = aggregateUpsellOrders(orders, { ...opts, includeRefunds: true });
    expect(result.orders).toHaveLength(2);
    expect(result.currency_breakdown[0].total_upsell_revenue).toBe(109);
  });

  it("matches the upsell property by exact key AND value", () => {
    const orders = [
      order({
        lineItems: [
          line({ customAttributes: [{ key: "_source", value: "post_purchase" }] }),
          line({ customAttributes: [{ key: "_other", value: "cart_upsell" }] }),
        ],
      }),
    ];
    expect(aggregateUpsellOrders(orders, opts).orders).toHaveLength(0);
  });

  it("carries variant_id and sku into the output item", () => {
    const orders = [
      order({
        lineItems: [
          upsellLine({
            variantId: "gid://shopify/ProductVariant/987654321",
            sku: "WS-002",
          }),
        ],
      }),
    ];
    expect(aggregateUpsellOrders(orders, opts).orders[0].upsell_items[0]).toMatchObject({
      variant_id: "gid://shopify/ProductVariant/987654321",
      sku: "WS-002",
    });
  });
});
