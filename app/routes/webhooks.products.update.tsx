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
 * Webhook для обновления товаров
 * Срабатывает при изменении товара, включая изменение цен в вариантах и маркетах
 *
 * Payload структура:
 * {
 *   id: number,
 *   title: string,
 *   variants: Array<{
 *     id: number,
 *     price: string,
 *     compare_at_price: string | null,
 *     ...
 *   }>,
 *   ...
 * }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { payload, shop, topic, session } =
      await authenticate.webhook(request);

    console.log(`[Webhook] Received ${topic} for shop ${shop}`);

    // Проверяем структуру payload
    const productId = (payload as any).id;
    const variants = (payload as any).variants || [];

    if (!productId) {
      console.warn("[Webhook] Missing product id in payload");
      return new Response("Missing product id", { status: 400 });
    }

    if (!session) {
      console.warn("[Webhook] No session found for shop", shop);
      return new Response("No session found", { status: 401 });
    }

    if (!variants || variants.length === 0) {
      console.log(
        `[Webhook] Product ${productId} has no variants, skipping update`,
      );
      return new Response("No variants", { status: 200 });
    }

    console.log(`[Webhook] Processing product update:`, {
      productId,
      variantsCount: variants.length,
    });

    // Создаем GraphQL клиент из сессии
    const graphqlClient = new api.clients.Graphql({ session });

    // Создаем объект с методом graphql для совместимости
    const adminClient = {
      graphql: async (query: string, options?: any) => {
        return graphqlClient.request(query, {
          variables: options?.variables,
        });
      },
    };

    try {
      // Обрабатываем каждый вариант
      const variantIds = variants.map((v: any) => {
        // Преобразуем variant ID в GID формат, если нужно
        const variantId = v.id;
        return variantId.toString().startsWith("gid://")
          ? variantId.toString()
          : `gid://shopify/ProductVariant/${variantId}`;
      });

      console.log(
        `[Webhook] Processing ${variantIds.length} variants for product ${productId}`,
      );

      let updatedCount = 0;
      let skippedCount = 0;

      // Обновляем каждый вариант
      for (const variantId of variantIds) {
        try {
          // Проверяем, есть ли этот variant в нашей БД
          const childProduct = await (prisma as any).childProduct.findUnique({
            where: { variantId },
          });

          if (!childProduct) {
            console.log(
              `[Webhook] Variant ${variantId} not found in our database, skipping update`,
            );
            skippedCount++;
            continue;
          }

          console.log(
            `[Webhook] Updating variant details for ${variantId} (ChildProduct: ${childProduct.id})`,
          );

          // Загружаем актуальные данные о варианте из Shopify
          // Это обновит все данные, включая prices для всех маркетов
          const variantDetails = await getVariantDetailsWithAdmin(
            adminClient,
            shop,
            variantId,
          );

          if (!variantDetails) {
            console.warn(
              `[Webhook] Failed to fetch variant details for ${variantId}`,
            );
            skippedCount++;
            continue;
          }

          // Обновляем variantDetails в БД (включая MarketPrice)
          await updateChildProductVariantDetails(variantId, variantDetails);

          console.log(
            `[Webhook] Successfully updated variant details for ${variantId}. Price: ${variantDetails.price}, MarketsPrice count: ${variantDetails.marketsPrice?.length || 0}`,
          );

          updatedCount++;
        } catch (error) {
          console.error(
            `[Webhook] Error processing variant ${variantId}:`,
            error,
          );
          skippedCount++;
        }
      }

      console.log(
        `[Webhook] Product update completed. Updated: ${updatedCount}, Skipped: ${skippedCount}`,
      );

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[Webhook] Error processing product update:", error);
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
