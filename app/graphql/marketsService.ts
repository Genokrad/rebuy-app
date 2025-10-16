import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import {
  GET_MARKETS_QUERY,
  GET_MARKETS_QUERY_BASE,
  type Market,
  type MarketsResponse,
} from "./getMarkets";

export async function getAllMarkets(request: Request): Promise<Market[]> {
  const { admin } = await authenticate.admin(request);

  console.log("Fetching all markets...");

  // Попробуем сначала полный запрос с conditions
  console.log("Trying full query with conditions...");
  console.log("Query:", GET_MARKETS_QUERY);

  let responseJson: any;
  try {
    const response = await admin.graphql(GET_MARKETS_QUERY, {
      variables: { first: 50 },
      apiVersion: ApiVersion.October25,
    });
    responseJson = await response.json();
    console.log("Full query response:", JSON.stringify(responseJson, null, 2));

    // Если есть ошибки с conditions, попробуем базовый запрос
    if (
      responseJson?.errors?.some(
        (e: any) =>
          typeof e?.message === "string" &&
          e.message.includes("Field 'conditions' doesn't exist"),
      )
    ) {
      console.log("Conditions not supported, falling back to base query...");
      const fallbackResponse = await admin.graphql(GET_MARKETS_QUERY_BASE, {
        variables: { first: 50 },
        apiVersion: ApiVersion.October25,
      });
      responseJson = await fallbackResponse.json();
      console.log(
        "Base query response:",
        JSON.stringify(responseJson, null, 2),
      );
    }
  } catch (error) {
    console.error("Error in GraphQL request:", error);
    throw error;
  }

  // If still GraphQL errors, surface clearly
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

  console.log(
    `Found ${markets.length} active markets:`,
    markets.map((m) => `${m.name} (${m.id}) - Primary: ${m.primary}`),
  );

  return markets;
}
