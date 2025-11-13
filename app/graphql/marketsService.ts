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

  // Сначала попробуем полный запрос с regions
  let responseJson: any;
  let useBaseQuery = false;

  try {
    const response = await admin.graphql(GET_MARKETS_QUERY, {
      variables: { first: 250 },
      apiVersion: ApiVersion.January25,
    });
    responseJson = await response.json();

    // Если есть ошибки, связанные с regions, используем базовый запрос
    if (responseJson?.errors?.length) {
      const errorMessage = responseJson.errors[0]?.message || "";
      if (
        errorMessage.includes("regions") ||
        errorMessage.includes("MarketRegionCountry")
      ) {
        console.warn(
          "Full query failed, falling back to base query:",
          errorMessage,
        );
        useBaseQuery = true;
      } else {
        throw new Error(errorMessage);
      }
    }
  } catch (error) {
    console.warn("Error in full GraphQL request, trying base query:", error);
    useBaseQuery = true;
  }

  // Если нужен базовый запрос, выполняем его
  if (useBaseQuery) {
    try {
      const response = await admin.graphql(GET_MARKETS_QUERY_BASE, {
        variables: { first: 250 },
        apiVersion: ApiVersion.January25,
      });
      responseJson = await response.json();
    } catch (error) {
      console.error("Error in base GraphQL request:", error);
      throw error;
    }
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

/**
 * Извлекает код страны из маркета
 * Проверяет regions.nodes[0].code (для MarketRegionCountry)
 */
export function getMarketCountryCode(market: Market): string | null {
  // Проверяем regions (если есть)
  if (market.regions?.nodes && market.regions.nodes.length > 0) {
    const firstRegion = market.regions.nodes[0];
    // code доступен только для MarketRegionCountry
    if (firstRegion?.code) {
      return firstRegion.code;
    }
  }

  // Если нет regions или code, возвращаем null
  return null;
}
