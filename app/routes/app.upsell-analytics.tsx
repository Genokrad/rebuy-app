import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  TextField,
  Checkbox,
  Button,
  Text,
  DataTable,
  Badge,
  Banner,
  Spinner,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getUpsellOrders } from "../graphql/upsellOrdersService";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const url = new URL(request.url);

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const from = url.searchParams.get("from") ?? toDateOnly(thirtyDaysAgo);
  const to = url.searchParams.get("to") ?? toDateOnly(today);
  const includeRefunds = url.searchParams.get("include_refunds") === "true";

  if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
    return {
      from,
      to,
      includeRefunds,
      error: "Invalid date range (expected YYYY-MM-DD, from ≤ to).",
      currency_breakdown: [],
      orders: [],
    };
  }

  try {
    const result = await getUpsellOrders(request, { from, to, includeRefunds });
    return { ...result, includeRefunds, error: null as string | null };
  } catch (error) {
    return {
      from,
      to,
      includeRefunds,
      error: error instanceof Error ? error.message : "Unknown error",
      currency_breakdown: [],
      orders: [],
    };
  }
};

export default function UpsellAnalytics() {
  const data = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const [from, setFrom] = useState(data.from);
  const [to, setTo] = useState(data.to);
  const [includeRefunds, setIncludeRefunds] = useState(data.includeRefunds);

  const apply = () => {
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    if (includeRefunds) params.set("include_refunds", "true");
    setSearchParams(params);
  };

  const orderRows = data.orders.map((order) => [
    order.order_name,
    new Date(order.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    order.currency,
    // Per item: [kind] title ×qty: net (−discount). Kind = upsell or discount name.
    order.upsell_items
      .map((item) => {
        const tags = [
          item.is_upsell ? "upsell" : null,
          ...item.matched_discounts,
        ].filter(Boolean);
        const tag = tags.length ? `[${tags.join("/")}] ` : "";
        const disc =
          item.discount_amount > 0
            ? ` (−${item.discount_amount.toFixed(2)})`
            : "";
        return `${tag}${item.title} ×${item.quantity}: ${item.net_total.toFixed(2)}${disc}`;
      })
      .join("; "),
    order.matched_discounts.length ? order.matched_discounts.join(", ") : "—",
    `${order.upsell_revenue.toFixed(2)} ${order.currency}`,
  ]);

  return (
    <Page>
      <TitleBar title="Upsell Analytics" />
      <Layout>
        {/* Filters */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Filters
              </Text>
              <InlineStack gap="400" align="start" blockAlign="end" wrap>
                <TextField
                  label="From"
                  type="date"
                  value={from}
                  onChange={setFrom}
                  autoComplete="off"
                />
                <TextField
                  label="To"
                  type="date"
                  value={to}
                  onChange={setTo}
                  autoComplete="off"
                />
                <Checkbox
                  label="Include cancelled / refunded"
                  checked={includeRefunds}
                  onChange={setIncludeRefunds}
                />
                <Button variant="primary" onClick={apply} loading={isLoading}>
                  Apply
                </Button>
              </InlineStack>
              <Text as="p" tone="subdued" variant="bodySm">
                Includes line items that are either a cart upsell (
                <code>_source = cart_upsell</code>) or carry a target bundle
                discount (ARTDUO / GYMDUO / JUNGLEDUO / KISSENDUO — codes or
                automatic). Revenue is net of all discounts. Fetched via a
                Shopify bulk operation — large ranges may take a moment.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {data.error && (
          <Layout.Section>
            <Banner tone="critical" title="Could not load upsell analytics">
              <p>{data.error}</p>
            </Banner>
          </Layout.Section>
        )}

        {isLoading && (
          <Layout.Section>
            <Card>
              <InlineStack gap="200" align="center" blockAlign="center">
                <Spinner size="small" accessibilityLabel="Loading" />
                <Text as="span">Running bulk operation…</Text>
              </InlineStack>
            </Card>
          </Layout.Section>
        )}

        {/* Currency breakdown */}
        {!isLoading && data.currency_breakdown.length > 0 && (
          <Layout.Section>
            <InlineGrid
              columns={{ xs: 1, sm: 2, md: 3 }}
              gap="400"
            >
              {data.currency_breakdown.map((b) => (
                <Card key={b.currency}>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="h3" variant="headingSm">
                        {b.currency}
                      </Text>
                      <Badge tone="info">{`${b.orders_count} orders`}</Badge>
                    </InlineStack>
                    <Text as="p" variant="heading2xl">
                      {b.total_upsell_revenue.toFixed(2)}
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Total upsell revenue
                    </Text>
                  </BlockStack>
                </Card>
              ))}
            </InlineGrid>
          </Layout.Section>
        )}

        {/* Orders table */}
        <Layout.Section>
          <Card padding="0">
            {!isLoading && data.orders.length === 0 && !data.error ? (
              <EmptyState
                heading="No matching orders in this range"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  No orders contained a cart upsell or a target bundle discount
                  between {data.from} and {data.to}.
                </p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "numeric",
                ]}
                headings={[
                  "Order",
                  "Date",
                  "Currency",
                  "Items (net)",
                  "Bundle discount",
                  "Revenue (net)",
                ]}
                rows={orderRows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
