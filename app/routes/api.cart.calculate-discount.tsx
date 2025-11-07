import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getWidgetById } from "../services/widgetService";
import type { ProductRelationship, ChildProduct } from "../components/types";

// CORS заголовки для всех ответов
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Вспомогательная функция для вычисления финальной скидки
function getFinalDiscount(
  productSelectedCount: number,
  sortedDiscounts: Array<Record<string, string>>,
): number {
  let finalDiscount = 0;
  sortedDiscounts.forEach((discount) => {
    const [threshold, value] = Object.entries(discount)[0] || [];
    if (productSelectedCount >= Number(threshold)) {
      finalDiscount = Number(value) || 0;
    }
  });
  return finalDiscount;
}

// Проверка, что variantIds принадлежат виджету
function validateVariantIds(
  variantIds: string[],
  widgetProducts: ProductRelationship[] | undefined,
  parentProductId: string,
): { isValid: boolean; error?: string; childProducts?: ChildProduct[] } {
  if (!widgetProducts || widgetProducts.length === 0) {
    return { isValid: false, error: "Widget has no products configured" };
  }

  // Находим relationship для указанного parentProduct
  const productRelationship = widgetProducts.find((rel) =>
    rel.parentProduct.includes(parentProductId),
  );

  if (!productRelationship) {
    return {
      isValid: false,
      error: `Parent product ${parentProductId} not found in widget`,
    };
  }

  // Проверяем, что все variantIds принадлежат childProducts этого виджета
  const widgetVariantIds = productRelationship.childProducts.map(
    (cp) => cp.variantId,
  );

  const invalidVariantIds = variantIds.filter(
    (vid) => !widgetVariantIds.includes(vid),
  );

  if (invalidVariantIds.length > 0) {
    return {
      isValid: false,
      error: `Invalid variant IDs: ${invalidVariantIds.join(", ")}`,
    };
  }

  // Проверяем, что все variantIds действительно выбраны (есть в childProducts)
  const validChildProducts = productRelationship.childProducts.filter((cp) =>
    variantIds.includes(cp.variantId),
  );

  if (validChildProducts.length !== variantIds.length) {
    return {
      isValid: false,
      error: "Some variant IDs are missing from widget child products",
    };
  }

  return { isValid: true, childProducts: validChildProducts };
}

// Обработка OPTIONS запроса через loader
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return json(
    { error: "Method not allowed" },
    { status: 405, headers: corsHeaders },
  );
}

// POST endpoint для вычисления скидки
export async function action({ request }: ActionFunctionArgs) {
  // Обработка preflight OPTIONS запроса
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const body = await request.json();
    const { variantIds, widgetId, parentProductId } = body;

    // Валидация входных данных
    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return json(
        { error: "variantIds is required and must be a non-empty array" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!widgetId || typeof widgetId !== "string") {
      return json(
        { error: "widgetId is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!parentProductId || typeof parentProductId !== "string") {
      return json(
        { error: "parentProductId is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Получаем виджет из БД
    const widget = await getWidgetById(widgetId);

    if (!widget) {
      return json(
        { error: "Widget not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    // Проверяем, что variantIds принадлежат виджету
    const validation = validateVariantIds(
      variantIds,
      widget.products,
      parentProductId,
    );

    if (!validation.isValid) {
      return json(
        { error: validation.error },
        { status: 400, headers: corsHeaders },
      );
    }

    // Получаем настройки скидок
    const settings = (widget as any).settings;
    if (!settings || !settings.discounts) {
      return json(
        { error: "Widget has no discount settings configured" },
        { status: 400, headers: corsHeaders },
      );
    }

    const sortedDiscounts = settings.discounts;

    // Вычисляем количество выбранных товаров
    const productSelectedCount = variantIds.length;

    // Вычисляем финальную скидку
    const discount = getFinalDiscount(productSelectedCount, sortedDiscounts);

    // Формируем ответ с информацией о каждом товаре
    const items = variantIds.map((variantId) => ({
      variantId,
      discount,
    }));

    return json(
      {
        success: true,
        discount,
        items,
        productSelectedCount,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Error calculating discount:", error);
    return json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders },
    );
  }
}

// Обработка OPTIONS запроса для CORS (дополнительный способ для совместимости)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
