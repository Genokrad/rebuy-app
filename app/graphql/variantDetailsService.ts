import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import {
  GET_VARIANT_DETAILS_QUERY,
  GET_CONTEXTUAL_PRICING_QUERY,
  type VariantDetails,
  type SimplifiedInventoryLevel,
} from "./getVariantDetails";

export async function getVariantDetails(
  request: Request,
  variantId: string,
): Promise<VariantDetails | null> {
  const { admin } = await authenticate.admin(request);

  // console.log(`Fetching variant details for ${variantId}...`);

  try {
    const response = await admin.graphql(GET_VARIANT_DETAILS_QUERY, {
      variables: {
        id: variantId,
      },
      apiVersion: ApiVersion.January25,
    });

    const responseJson: any = await response.json();
    // console.log(
    //   "Variant details response:",
    //   JSON.stringify(responseJson, null, 2),
    // );

    if (responseJson?.errors?.length) {
      const firstMessage =
        responseJson.errors[0]?.message || "Unknown GraphQL error";
      console.error(
        "GraphQL error fetching variant details:",
        responseJson.errors,
      );
      throw new Error(firstMessage);
    }

    const data = responseJson.data as any;
    const variant = data.productVariant;

    if (!variant) return null;

    // Собираем уникальные countryCode из всех локаций
    const countryCodes = new Set<string>();
    if (variant.inventoryItem?.inventoryLevels?.edges) {
      variant.inventoryItem.inventoryLevels.edges.forEach((edge: any) => {
        const countryCode = edge.node.location.address.countryCode;
        if (countryCode) {
          countryCodes.add(countryCode);
        }
      });
    }

    // Получаем контекстные цены для всех найденных стран
    const contextualPricing: { [key: string]: any } = {};

    for (const countryCode of countryCodes) {
      try {
        const pricingResponse = await admin.graphql(
          GET_CONTEXTUAL_PRICING_QUERY,
          {
            variables: {
              id: variantId,
              country: countryCode,
            },
            apiVersion: ApiVersion.January25,
          },
        );

        const pricingJson: any = await pricingResponse.json();
        if (pricingJson?.data?.productVariant?.contextualPricing) {
          contextualPricing[countryCode] =
            pricingJson.data.productVariant.contextualPricing;
        }
      } catch (error) {
        console.warn(
          `Failed to get contextual pricing for ${countryCode}:`,
          error,
        );
      }
    }

    // Создаем упрощенную структуру inventoryLevels
    const simplifiedInventoryLevels: SimplifiedInventoryLevel[] = [];

    if (variant.inventoryItem?.inventoryLevels?.edges) {
      variant.inventoryItem.inventoryLevels.edges.forEach((edge: any) => {
        const location = edge.node.location;
        const countryCode = location.address.countryCode;

        // Получаем общее количество для локации
        const totalQuantity = location.inventoryLevels.nodes
          .map((node: any) => node.quantities[0]?.quantity || 0)
          .reduce((sum: number, qty: number) => sum + qty, 0);

        // Определяем цену и валюту
        let price = variant.price;
        let currencyCode = data.shop?.currencyCode || "USD";
        let compareAtPrice: string | null = variant.compareAtPrice ?? null;

        if (contextualPricing[countryCode]) {
          price = contextualPricing[countryCode].price.amount;
          currencyCode = contextualPricing[countryCode].price.currencyCode;
          compareAtPrice =
            contextualPricing[countryCode].compareAtPrice?.amount ?? null;
        }

        simplifiedInventoryLevels.push({
          id: location.id,
          name: location.name,
          countryCode: countryCode,
          shipsInventory: location.shipsInventory,
          quantity: totalQuantity,
          price: price,
          compareAtPrice: compareAtPrice,
          currencyCode: currencyCode,
        });
      });
    }

    // Определяем изображение: сначала вариант, потом продукт
    const finalImage = variant.image || variant.product?.featuredImage;

    // Возвращаем обновленную структуру
    return {
      ...variant,
      image: finalImage,
      inventoryLevels: simplifiedInventoryLevels,
    };
  } catch (error) {
    console.error(`Error fetching variant details for ${variantId}:`, error);
    throw error;
  }
}
