import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { ApiVersion, shopifyApi } from "@shopify/shopify-api";
import { updateChildProductVariantDetails } from "../services/widgetService";
import { getVariantDetailsWithAdmin } from "../graphql/variantDetailsService";
import prisma from "../db.server";

// Инициализируем shopifyApi для создания клиентов
const api = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(",") || [],
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, "") || "",
  isEmbeddedApp: true,
});

/**
 * Webhook для обновления уровня инвентаря
 * Срабатывает при изменении количества товара на складе
 *
 * Payload структура:
 * {
 *   inventory_item_id: string,
 *   location_id: string,
 *   available: number,
 *   updated_at: string
 * }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  console.log(
    "[Webhook] Request headers:",
    Object.fromEntries(request.headers),
  );
  console.log("[Webhook] Request method:", request.method);
  console.log("[Webhook] Request URL:", request.url);
  try {
    const { payload, shop, topic, session } =
      await authenticate.webhook(request);

    console.log(`[Webhook] Received ${topic} for shop ${shop}`);

    // Проверяем структуру payload
    const inventoryItemId = (payload as any).inventory_item_id;
    const locationId = (payload as any).location_id;
    const available = (payload as any).available;

    if (!inventoryItemId) {
      console.warn("[Webhook] Missing inventory_item_id in payload");
      return new Response("Missing inventory_item_id", { status: 400 });
    }

    if (!session) {
      console.warn("[Webhook] No session found for shop", shop);
      return new Response("No session found", { status: 401 });
    }

    console.log(`[Webhook] Processing inventory update:`, {
      inventoryItemId,
      locationId,
      available,
    });

    // Создаем GraphQL клиент из сессии
    const graphqlClient = new api.clients.Graphql({ session });

    // Находим вариант, который использует этот inventory_item
    // inventory_item_id может быть числом или уже в формате GID
    const inventoryItemGid = inventoryItemId.toString().startsWith("gid://")
      ? inventoryItemId.toString()
      : `gid://shopify/InventoryItem/${inventoryItemId}`;

    const variantsQuery = `
      query getVariantsByInventoryItem($inventoryItemId: ID!) {
        inventoryItem(id: $inventoryItemId) {
          id
          variant {
            id
          }
        }
      }
    `;

    try {
      const variantsResponse = await graphqlClient.request(variantsQuery, {
        variables: {
          inventoryItemId: inventoryItemGid,
        },
      });

      const variantsData: any =
        (variantsResponse as any).body || variantsResponse;

      if (variantsData?.errors?.length) {
        console.error("[Webhook] GraphQL errors:", variantsData.errors);
        return new Response("GraphQL error", { status: 500 });
      }

      const variant = variantsData?.data?.inventoryItem?.variant;

      if (!variant || !variant.id) {
        console.warn(
          `[Webhook] No variant found for inventory_item_id ${inventoryItemId}`,
        );
        return new Response("Variant not found", { status: 200 }); // Возвращаем 200, чтобы Shopify не повторял запрос
      }

      const variantId = variant.id;
      console.log(
        `[Webhook] Found variant ${variantId} for inventory_item ${inventoryItemId}`,
      );

      // Проверяем, есть ли этот variant в нашей БД
      const childProduct = await (prisma as any).childProduct.findUnique({
        where: { variantId },
      });

      if (!childProduct) {
        console.log(
          `[Webhook] Variant ${variantId} not found in our database, skipping update`,
        );
        return new Response("Variant not in database", { status: 200 });
      }

      console.log(
        `[Webhook] Updating variant details for ${variantId} (ChildProduct: ${childProduct.id})`,
      );

      // Загружаем актуальные данные о варианте из Shopify
      // Создаем объект с методом graphql для совместимости
      const adminClient = {
        graphql: async (query: string, options?: any) => {
          return graphqlClient.request(query, {
            variables: options?.variables,
          });
        },
      };
      const variantDetails = await getVariantDetailsWithAdmin(
        adminClient,
        shop,
        variantId,
      );

      if (!variantDetails) {
        console.warn(
          `[Webhook] Failed to fetch variant details for ${variantId}`,
        );
        return new Response("Failed to fetch variant details", {
          status: 500,
        });
      }

      // Обновляем variantDetails в БД
      await updateChildProductVariantDetails(variantId, variantDetails);

      console.log(
        `[Webhook] Successfully updated variant details for ${variantId}. New quantity: ${variantDetails.inventoryQuantity}`,
      );

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[Webhook] Error processing inventory update:", error);
      return new Response(
        error instanceof Error ? error.message : "Internal server error",
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[Webhook] Error authenticating webhook:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
