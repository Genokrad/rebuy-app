import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getUpsellOrders } from "../graphql/upsellOrdersService";

// YYYY-MM-DD
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * GET /api/upsell-orders?from=2026-01-01&to=2026-03-31&shop=<shop>.myshopify.com
 *   from, to            ISO date strings (default: last 30 days)
 *   include_refunds     "true" to keep cancelled / refunded orders (default: excluded)
 *   discount_names      comma-separated bundle-discount names to match
 *                       (default: ARTDUO,GYMDUO,JUNGLEDUO,KISSENDUO)
 *
 * Returns per-order revenue for line items that are EITHER a cart upsell
 * (_source = cart_upsell) OR carry one of the target bundle discounts, net of
 * all discounts, grouped by currency. See upsellOrdersService.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Establishes the admin session (and validates the embedded session token).
  await authenticate.admin(request);

  try {
    const url = new URL(request.url);

    // Default range: last 30 days (inclusive of today).
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const from = url.searchParams.get("from") ?? toDateOnly(thirtyDaysAgo);
    const to = url.searchParams.get("to") ?? toDateOnly(today);
    const includeRefunds = url.searchParams.get("include_refunds") === "true";

    // Optional override of the target bundle-discount names (comma-separated).
    // Defaults to TARGET_DISCOUNT_NAMES inside the service when omitted.
    const discountNamesParam = url.searchParams.get("discount_names");
    const discountNames = discountNamesParam
      ? discountNamesParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      return json(
        {
          success: false,
          error: "`from` and `to` must be ISO dates (YYYY-MM-DD)",
        },
        { status: 400 },
      );
    }

    if (from > to) {
      return json(
        { success: false, error: "`from` must not be after `to`" },
        { status: 400 },
      );
    }

    const result = await getUpsellOrders(request, {
      from,
      to,
      includeRefunds,
      discountNames,
    });

    return json({ success: true, ...result });
  } catch (error) {
    console.error("API: Error fetching upsell orders:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
