import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getWidgetById } from "../services/widgetService";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

function corsJson<Data>(data: Data, init?: ResponseInit): Response {
  return json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

// Публичный API endpoint для получения данных виджета
// Доступен из темы магазина без аутентификации
export async function loader({ params, request }: LoaderFunctionArgs) {
  const { widgetId } = params;
  const url = new URL(request.url);
  const currentProductId = url.searchParams.get("productId");

  if (!widgetId) {
    return corsJson({ error: "Widget ID is required" }, { status: 400 });
  }

  try {
    // Получаем виджет из БД
    const widget = await getWidgetById(widgetId);

    if (!widget) {
      return corsJson({ error: "Widget not found" }, { status: 404 });
    }

    const currentproductObject = widget.products?.find((product) =>
      product.parentProduct.includes(currentProductId),
    );

    // Возвращаем все данные виджета
    return corsJson({
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
    });
  } catch (error) {
    console.error("Error fetching widget:", error);
    return corsJson(
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
    headers: CORS_HEADERS,
  });
}
