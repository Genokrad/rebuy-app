import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import {
  GET_VARIANT_DETAILS_QUERY,
  type VariantDetails,
  type VariantDetailsResponse,
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

    const data = responseJson.data as VariantDetailsResponse;
    return data.productVariant || null;
  } catch (error) {
    console.error(`Error fetching variant details for ${variantId}:`, error);
    throw error;
  }
}
