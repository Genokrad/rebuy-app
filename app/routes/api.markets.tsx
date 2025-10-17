import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getAllMarkets } from "../graphql/marketsService";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const markets = await getAllMarkets(request);

    return json({
      success: true,
      markets,
      count: markets.length,
    });
  } catch (error) {
    console.error("API: Error fetching markets:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        markets: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}
