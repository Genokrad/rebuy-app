import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  getWidgetById,
  updateChildProductVariantDetails,
} from "../services/widgetService";
import { getVariantDetails } from "../graphql/variantDetailsService";
import type { ChildProduct } from "../components/types";

// Публичный API endpoint для получения данных виджета
// Доступен из темы магазина без аутентификации
export async function loader({ params, request }: LoaderFunctionArgs) {
  // Обработка OPTIONS запроса для CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const { widgetId } = params;
  const url = new URL(request.url);
  const currentProductId = url.searchParams.get("productId");

  if (!widgetId) {
    return json(
      { error: "Widget ID is required" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  }

  try {
    // Получаем виджет из БД
    const widget = await getWidgetById(widgetId);

    if (!widget) {
      return json(
        { error: "Widget not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      );
    }

    // Функция для нормализации ID продукта (убираем префикс gid://shopify/Product/ если есть)
    const normalizeProductId = (id: string | null | undefined): string => {
      if (!id) return "";
      // Если это GID формат, извлекаем числовой ID
      if (id.startsWith("gid://shopify/Product/")) {
        return id.replace("gid://shopify/Product/", "");
      }
      return id;
    };

    // Функция для проверки, содержит ли parentProduct указанный ID
    const parentProductContains = (
      parentProduct: string | string[],
      productId: string,
    ): boolean => {
      const normalizedProductId = normalizeProductId(productId);

      if (Array.isArray(parentProduct)) {
        return parentProduct.some((id) => {
          const normalizedId = normalizeProductId(id);
          return normalizedId === normalizedProductId;
        });
      }
      const normalizedParentId = normalizeProductId(parentProduct);
      return normalizedParentId === normalizedProductId;
    };

    const normalizedCurrentProductId = normalizeProductId(currentProductId);

    console.log("[api.widget] Searching for product:", {
      currentProductId,
      normalizedCurrentProductId,
      widgetProductsCount: widget.products?.length || 0,
      parentProducts: widget.products?.map((p: any) => ({
        parentProduct: p.parentProduct,
        childProductsCount: p.childProducts?.length || 0,
      })),
    });

    const currentproductObject = widget.products?.find((product) =>
      parentProductContains(product.parentProduct, normalizedCurrentProductId),
    );

    console.log("[api.widget] Found product object:", {
      found: !!currentproductObject,
      parentProduct: currentproductObject?.parentProduct,
      childProductsCount: currentproductObject?.childProducts?.length || 0,
    });

    // Загружаем variantDetails с marketsPrice для всех childProducts
    if (
      currentproductObject?.childProducts &&
      currentproductObject.childProducts.length > 0
    ) {
      const childProductsWithDetails: ChildProduct[] = await Promise.all(
        currentproductObject.childProducts.map(
          async (childProduct: ChildProduct) => {
            // Если variantDetails уже есть, но нет marketsPrice, перезагружаем
            // Или если variantDetails нет вообще, загружаем
            if (
              !childProduct.variantDetails ||
              !childProduct.variantDetails.marketsPrice
            ) {
              try {
                const variantDetails = await getVariantDetails(
                  request,
                  childProduct.variantId,
                );
                if (variantDetails) {
                  // Сохраняем variantDetails в БД для будущих запросов
                  try {
                    await updateChildProductVariantDetails(
                      childProduct.variantId,
                      variantDetails,
                    );
                  } catch (saveError) {
                    console.error(
                      `Error saving variant details for ${childProduct.variantId}:`,
                      saveError,
                    );
                    // Продолжаем даже если не удалось сохранить
                  }
                }
                return {
                  ...childProduct,
                  variantDetails:
                    variantDetails || childProduct.variantDetails || undefined,
                };
              } catch (error) {
                console.error(
                  `Error loading variant details for ${childProduct.variantId}:`,
                  error,
                );
                // В случае ошибки возвращаем childProduct как есть
                return childProduct;
              }
            }
            // Если variantDetails уже есть с marketsPrice, оставляем как есть
            return childProduct;
          },
        ),
      );

      // Обновляем currentproductObject с загруженными variantDetails
      currentproductObject.childProducts = childProductsWithDetails;
    }

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
          "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
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
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      },
    );
  }
}
