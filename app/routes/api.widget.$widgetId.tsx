import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getWidgetById } from "../services/widgetService";

// Публичный API endpoint для получения данных виджета
// Доступен из темы магазина без аутентификации
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { widgetId } = params;
  const url = new URL(request.url);
  const currentProductId = url.searchParams.get("productId");

  if (!widgetId) {
    return json({ error: "Widget ID is required" }, { status: 400 });
  }

  try {
    // Получаем виджет из БД
    const widget = await getWidgetById(widgetId);

    if (!widget) {
      return json({ error: "Widget not found" }, { status: 404 });
    }

    const currentproductObject = widget.products?.find((product) =>
      product.parentProduct.includes(currentProductId),
    );
    // console.log("Current product object:", currentproductObject);

    // Возвращаем все данные виджета
    return json(
      {
        success: true,
        widget: {
          id: widget.id,
          name: widget.name,
          type: widget.type,
          shop: widget.shop,
          settings: (widget as any).settings,
          product: currentproductObject || { parentProduct: null },
          createdAt: widget.createdAt,
        },
        currentProductId,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching widget:", error);
    return json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Обработка OPTIONS запроса для CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
