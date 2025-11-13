import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getVariantDetails } from "../graphql/variantDetailsService";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const variantId = url.searchParams.get("variantId");

    if (!variantId) {
      return json(
        {
          success: false,
          error: "Variant ID is required",
          details: null,
        },
        { status: 400 },
      );
    }

    // console.log(`API: Fetching variant details for ${variantId}...`);

    const variantDetails = await getVariantDetails(request, variantId);

    return json({
      success: true,
      variantId,
      details: variantDetails,
    });
  } catch (error) {
    console.error("API: Error fetching variant details:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: null,
      },
      { status: 500 },
    );
  }
}
