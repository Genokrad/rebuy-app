import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import {
  GET_MARKETS_QUERY_BASE,
  type Market,
  type MarketsResponse,
} from "./getMarkets";

export async function getAllMarkets(request: Request): Promise<Market[]> {
  const { admin } = await authenticate.admin(request);

  // console.log("Fetching all markets...");

  // Сначала попробуем базовый запрос без conditions
  let responseJson: any;
  try {
    // console.log("Trying base query without conditions...");
    const response = await admin.graphql(GET_MARKETS_QUERY_BASE, {
      variables: { first: 50 },
      apiVersion: ApiVersion.January25,
    });
    responseJson = await response.json();
    // console.log("Base query response:", JSON.stringify(responseJson, null, 2));
  } catch (error) {
    console.error("Error in base GraphQL request:", error);
    throw error;
  }

  // If GraphQL errors, surface clearly
  if (responseJson?.errors?.length) {
    const firstMessage =
      responseJson.errors[0]?.message || "Unknown GraphQL error";
    console.error("GraphQL error fetching markets:", responseJson.errors);
    throw new Error(firstMessage);
  }

  const data = (responseJson.data ?? {
    markets: { edges: [] },
  }) as MarketsResponse;

  // Фильтруем только активные рынки
  const markets: Market[] = data.markets.edges
    .map((edge) => edge.node)
    .filter((market) => market.enabled);

  // console.log(
  //   `Found ${markets.length} active markets:`,
  //   markets.map((m) => `${m.name} (${m.id}) - Primary: ${m.primary}`),
  // );

  return markets;
}
