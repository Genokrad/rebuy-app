import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import {
  GET_MARKETS_QUERY,
  GET_MARKETS_QUERY_BASE,
  type Market,
  type MarketsResponse,
} from "./getMarkets";
import {
  GET_LOCATIONS_QUERY,
  type Location,
  type LocationsResponse,
} from "./getLocations";
import prisma from "../db.server";

/**
 * Внутренняя функция для получения всех маркетов
 */
async function getAllMarketsInternal(admin: {
  graphql: (query: string, options?: any) => Promise<any>;
}): Promise<Market[]> {
  // Сначала попробуем полный запрос с regions
  let responseJson: any;
  let useBaseQuery = false;

  try {
    const response = await admin.graphql(GET_MARKETS_QUERY, {
      variables: { first: 250 },
      apiVersion: "2026-01" as ApiVersion,
    });

    // Обрабатываем ответ: может быть Response или уже распарсенный объект
    responseJson =
      typeof response.json === "function"
        ? await response.json()
        : (response as any).body || response;

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
        apiVersion: "2026-01" as ApiVersion,
      });

      // Обрабатываем ответ: может быть Response или уже распарсенный объект
      responseJson =
        typeof response.json === "function"
          ? await response.json()
          : (response as any).body || response;
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
 * Получает все маркеты используя Request (для обычных запросов)
 */
export async function getAllMarkets(request: Request): Promise<Market[]> {
  const { admin } = await authenticate.admin(request);
  return getAllMarketsInternal(admin);
}

/**
 * Получает все маркеты используя admin клиент напрямую (для webhook'ов)
 */
export async function getAllMarketsWithAdmin(admin: {
  graphql: (query: string, options?: any) => Promise<any>;
}): Promise<Market[]> {
  return getAllMarketsInternal(admin);
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

/**
 * Получает все склады (locations) магазина
 */
export async function getAllLocations(request: Request): Promise<Location[]> {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(GET_LOCATIONS_QUERY, {
      variables: { first: 10 },
      apiVersion: "2026-01" as ApiVersion,
    });

    const responseJson =
      typeof response.json === "function"
        ? await response.json()
        : (response as any).body || response;

    if (responseJson?.errors?.length) {
      const firstMessage =
        responseJson.errors[0]?.message || "Unknown GraphQL error";
      console.error("GraphQL error fetching locations:", responseJson.errors);
      throw new Error(firstMessage);
    }

    const data = (responseJson.data ?? {
      locations: { edges: [] },
    }) as LocationsResponse;

    // Получаем все склады (без фильтрации, так как поле active убрано из запроса)
    const locations: Location[] = data.locations.edges.map((edge) => edge.node);

    return locations;
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
}

/**
 * Обновляет для всех MarketPrice указанного маркета список доступных складов (warehouses)
 * warehouseLocationIds - массив ID складов, например ["gid://shopify/Location/...", "..."]
 * shop - домен магазина
 * marketName - название маркета (опционально, для удобства)
 */
export async function updateMarketWarehousesForAllVariants(
  marketId: string,
  warehouseLocationIds: string[],
  shop: string,
  marketName?: string,
) {
  const warehousesJson = JSON.stringify(warehouseLocationIds);

  // Обновляем все существующие MarketPrice
  await prisma.marketPrice.updateMany({
    where: {
      marketId,
    },
    data: {
      // поле warehouses добавлено в Prisma-схему, но типы клиента могут быть ещё не обновлены локально
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ warehouses: warehousesJson } as any),
    },
  });

  // Сохраняем настройки маркета в отдельную таблицу для использования при создании новых товаров
  await (prisma as any).marketWarehouse.upsert({
    where: {
      shop_marketId: {
        shop,
        marketId,
      },
    },
    update: {
      warehouses: warehousesJson,
      marketName: marketName || null,
      updatedAt: new Date(),
    },
    create: {
      shop,
      marketId,
      marketName: marketName || null,
      warehouses: warehousesJson,
    },
  });
}

/**
 * Получает настройки складов для маркета из таблицы MarketWarehouse
 */
export async function getMarketWarehouses(
  shop: string,
  marketId: string,
): Promise<string[] | null> {
  const marketWarehouse = await (prisma as any).marketWarehouse.findUnique({
    where: {
      shop_marketId: {
        shop,
        marketId,
      },
    },
  });

  if (!marketWarehouse || !marketWarehouse.warehouses) {
    return null;
  }

  try {
    return JSON.parse(marketWarehouse.warehouses);
  } catch (e) {
    console.error(
      `Failed to parse warehouses for market ${marketId} in shop ${shop}:`,
      e,
    );
    return null;
  }
}

/**
 * Получает все настройки складов для всех маркетов магазина
 * Возвращает Record<marketId, locationIds[]>
 */
export async function getAllMarketWarehouses(
  shop: string,
): Promise<Record<string, string[]>> {
  const marketWarehouses = await (prisma as any).marketWarehouse.findMany({
    where: { shop },
    select: { marketId: true, warehouses: true },
  });

  const result: Record<string, string[]> = {};

  for (const mw of marketWarehouses) {
    if (mw.warehouses) {
      try {
        result[mw.marketId] = JSON.parse(mw.warehouses);
      } catch (e) {
        console.error(
          `Failed to parse warehouses for market ${mw.marketId} in shop ${shop}:`,
          e,
        );
      }
    }
  }

  return result;
}
