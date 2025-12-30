import prisma from "../db.server";
import type { Widget } from "../graphql/createWidget";
import type { ProductRelationship, ChildProduct } from "../components/types";

/**
 * Нормализует ID продукта: убирает префикс gid://shopify/Product/ если есть
 * Всегда возвращает числовой ID для единообразия
 */
function normalizeProductId(id: string | null | undefined): string {
  if (!id) return "";
  // Если это GID формат, извлекаем числовой ID
  if (id.startsWith("gid://shopify/Product/")) {
    return id.replace("gid://shopify/Product/", "");
  }
  return id;
}

/**
 * Нормализует parentProduct: может быть строка или массив строк
 */
function normalizeParentProduct(
  parentProduct: string | string[],
): string | string[] {
  if (Array.isArray(parentProduct)) {
    return parentProduct.map((id) => normalizeProductId(id));
  }
  return normalizeProductId(parentProduct);
}

/**
 * Преобразует данные из БД в формат ProductRelationship[]
 * для обратной совместимости с существующим кодом
 */
async function buildProductRelationships(
  widgetId: string,
): Promise<ProductRelationship[]> {
  console.log(
    `[buildProductRelationships] Loading products for widget ${widgetId}`,
  );

  const widgetProducts = await (prisma as any).widgetProduct.findMany({
    where: { widgetId },
    orderBy: { order: "asc" },
    include: {
      childProducts: {
        orderBy: { order: "asc" },
        include: {
          childProduct: {
            include: {
              variantDetails: {
                include: {
                  inventoryLevels: {
                    orderBy: { locationId: "asc" },
                  },
                  marketPrices: {
                    orderBy: { marketId: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  console.log(
    `[buildProductRelationships] Found ${widgetProducts.length} widget products`,
  );

  if (widgetProducts.length === 0) {
    console.log(
      `[buildProductRelationships] No widget products found, returning empty array`,
    );
    return [];
  }

  return widgetProducts.map((wp: any) => {
    console.log(
      `[buildProductRelationships] Processing widget product ${wp.id} with ${wp.childProducts?.length || 0} child products`,
    );
    const childProducts: ChildProduct[] = wp.childProducts.map((wcp: any) => {
      const cp = wcp.childProduct;
      const variantDetails = cp.variantDetails
        ? {
            inventoryQuantity: cp.variantDetails.inventoryQuantity,
            availableForSale: cp.variantDetails.availableForSale,
            inventoryPolicy: cp.variantDetails.inventoryPolicy,
            id: cp.variantDetails.variantId,
            title: cp.variantDetails.title,
            image: cp.variantDetails.imageUrl
              ? { url: cp.variantDetails.imageUrl }
              : null,
            price: cp.variantDetails.price,
            compareAtPrice: cp.variantDetails.compareAtPrice || undefined,
            selectedOptions: cp.variantDetails.selectedOptions
              ? (() => {
                  try {
                    return JSON.parse(cp.variantDetails.selectedOptions);
                  } catch (e) {
                    console.warn(
                      `Failed to parse selectedOptions for variant ${cp.variantDetails.variantId}:`,
                      e,
                    );
                    return undefined;
                  }
                })()
              : undefined,
            product: {
              id: cp.variantDetails.productId,
              title: cp.variantDetails.productTitle,
              handle: cp.variantDetails.productHandle || "",
              featuredImage: cp.variantDetails.imageUrl
                ? { url: cp.variantDetails.imageUrl }
                : null,
            },
            inventoryItem: {} as any, // Не используется в новом формате
            inventoryLevels: cp.variantDetails.inventoryLevels.map(
              (il: any) => ({
                id: il.locationId,
                name: il.locationName,
                countryCode: il.countryCode,
                shipsInventory: il.shipsInventory,
                quantity: il.quantity,
                price: il.price,
                compareAtPrice: il.compareAtPrice,
                currencyCode: il.currencyCode,
              }),
            ),
            marketsPrice: cp.variantDetails.marketPrices.map((mp: any) => {
              // Парсим warehouses из JSON-строки, если она есть
              let warehouses: string[] | undefined;
              if (mp.warehouses) {
                try {
                  warehouses = JSON.parse(mp.warehouses);
                } catch (e) {
                  console.warn(
                    `Failed to parse warehouses for marketPrice ${mp.id}:`,
                    e,
                  );
                }
              }

              return {
                marketId: mp.marketId,
                marketName: mp.marketName,
                countryCode: mp.countryCode,
                price: mp.price,
                compareAtPrice: mp.compareAtPrice || undefined,
                currencyCode: mp.currencyCode,
                warehouses,
              };
            }),
          }
        : undefined;

      return {
        productId: cp.productId,
        variantId: cp.variantId,
        variantDetails,
      };
    });

    // Парсим parentProductId: может быть строка или JSON массив
    let parentProduct: string | string[];
    try {
      const parsed = JSON.parse(wp.parentProductId);
      if (Array.isArray(parsed)) {
        parentProduct = parsed;
        console.log(
          `[buildProductRelationships] Parsed parentProduct as array:`,
          parsed,
        );
      } else {
        parentProduct = wp.parentProductId; // Если не массив, возвращаем как строку
        console.log(
          `[buildProductRelationships] Parsed parentProduct as string:`,
          wp.parentProductId,
        );
      }
    } catch (e) {
      // Если не JSON, значит это просто строка (обратная совместимость)
      parentProduct = wp.parentProductId;
      console.log(
        `[buildProductRelationships] parentProduct is plain string:`,
        wp.parentProductId,
      );
    }

    // Нормализуем ID (убираем GID префикс если есть)
    const normalizedParentProduct = normalizeParentProduct(parentProduct);

    console.log(
      `[buildProductRelationships] Final parentProduct for widget product ${wp.id}:`,
      normalizedParentProduct,
      `(type: ${Array.isArray(normalizedParentProduct) ? "array" : "string"})`,
    );

    return {
      parentProduct: normalizedParentProduct,
      childProducts,
    };
  });
}

export async function createWidget(
  name: string,
  type: string,
  shop: string,
  products?: ProductRelationship[],
  settings?: any,
): Promise<Widget> {
  // Создаем виджет
  const widget = await prisma.widget.create({
    data: {
      name,
      type,
      shop,
      settings: settings ? JSON.stringify(settings) : null,
      // Сохраняем products в JSON для обратной совместимости
      products: products ? JSON.stringify(products) : null,
    } as any,
  });

  // Если есть products, создаем нормализованные записи
  if (products && products.length > 0) {
    for (let order = 0; order < products.length; order++) {
      const productRel = products[order];

      // Нормализуем parentProduct перед сохранением
      const normalizedParentProduct = normalizeParentProduct(
        productRel.parentProduct,
      );
      const parentProductIdToSave = Array.isArray(normalizedParentProduct)
        ? JSON.stringify(normalizedParentProduct)
        : normalizedParentProduct;

      // Создаем WidgetProduct
      const widgetProduct = await (prisma as any).widgetProduct.create({
        data: {
          widgetId: widget.id,
          parentProductId: parentProductIdToSave,
          order: order,
        },
      });

      // Обрабатываем каждый ChildProduct
      if (productRel.childProducts && productRel.childProducts.length > 0) {
        for (
          let childOrder = 0;
          childOrder < productRel.childProducts.length;
          childOrder++
        ) {
          const childProduct = productRel.childProducts[childOrder];

          // Находим или создаем ChildProduct
          let childProductRecord = await (
            prisma as any
          ).childProduct.findUnique({
            where: { variantId: childProduct.variantId },
          });

          if (!childProductRecord) {
            childProductRecord = await (prisma as any).childProduct.create({
              data: {
                variantId: childProduct.variantId,
                productId: childProduct.productId,
              },
            });
          }

          // Создаем связь WidgetChildProduct
          await (prisma as any).widgetChildProduct.create({
            data: {
              widgetProductId: widgetProduct.id,
              childProductId: childProductRecord.id,
              order: childOrder,
            },
          });

          // Если есть variantDetails, сохраняем их
          if (childProduct.variantDetails) {
            await saveVariantDetails(
              childProductRecord.id,
              childProduct.variantDetails,
              widget.shop,
            );
          }
        }
      }
    }
  }

  // Возвращаем виджет в старом формате для обратной совместимости
  const productRelationships = await buildProductRelationships(widget.id);

  return {
    id: widget.id,
    name: widget.name,
    type: widget.type,
    shop: widget.shop,
    products:
      productRelationships.length > 0 ? productRelationships : undefined,
    ...((widget as any).settings
      ? { settings: JSON.parse((widget as any).settings) }
      : {}),
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  };
}

/**
 * Сохраняет или обновляет VariantDetails
 * shop - опциональный параметр, если не передан, будет найден через widgetLinks
 */
async function saveVariantDetails(
  childProductId: string,
  variantDetails: any,
  shop?: string,
): Promise<void> {
  // Если shop не передан, пытаемся найти его через widgetLinks
  if (!shop) {
    const childProduct = await (prisma as any).childProduct.findUnique({
      where: { id: childProductId },
      include: {
        widgetLinks: {
          include: {
            widgetProduct: {
              include: {
                widget: {
                  select: { shop: true },
                },
              },
            },
          },
        },
      },
    });

    if (
      childProduct?.widgetLinks &&
      childProduct.widgetLinks.length > 0 &&
      childProduct.widgetLinks[0]?.widgetProduct?.widget?.shop
    ) {
      shop = childProduct.widgetLinks[0].widgetProduct.widget.shop;
    }
  }

  // Проверяем, существует ли уже запись
  const existing = await (prisma as any).variantDetails.findUnique({
    where: { childProductId },
  });

  const detailsData = {
    childProductId,
    inventoryQuantity: variantDetails.inventoryQuantity || 0,
    availableForSale: variantDetails.availableForSale || false,
    inventoryPolicy: variantDetails.inventoryPolicy || "DENY",
    variantId: variantDetails.id || variantDetails.variantId || "",
    title: variantDetails.title || "",
    price: variantDetails.price || "0",
    compareAtPrice: variantDetails.compareAtPrice || null,
    imageUrl: variantDetails.image?.url || null,
    productId: variantDetails.product?.id || "",
    productTitle: variantDetails.product?.title || "",
    productHandle: variantDetails.product?.handle || null,
    selectedOptions: variantDetails.selectedOptions
      ? JSON.stringify(variantDetails.selectedOptions)
      : null,
  };

  // Сохраняем существующие warehouses перед удалением marketPrices
  let existingWarehouses: Record<string, string | null> = {};
  if (existing) {
    const existingMarketPrices = await (prisma as any).marketPrice.findMany({
      where: { variantDetailsId: existing.id },
      select: { marketId: true, warehouses: true },
    });
    existingMarketPrices.forEach((mp: any) => {
      existingWarehouses[mp.marketId] = mp.warehouses;
    });
  }

  // Загружаем настройки складов из MarketWarehouse для всех маркетов
  const marketWarehouses: Record<string, string | null> = {};
  if (
    shop &&
    variantDetails.marketsPrice &&
    Array.isArray(variantDetails.marketsPrice)
  ) {
    const { getMarketWarehouses } = await import("../graphql/marketsService");
    for (const marketPrice of variantDetails.marketsPrice) {
      const warehouses = await getMarketWarehouses(shop, marketPrice.marketId);
      if (warehouses) {
        marketWarehouses[marketPrice.marketId] = JSON.stringify(warehouses);
      }
    }
  }

  if (existing) {
    // Обновляем существующую запись
    await (prisma as any).variantDetails.update({
      where: { id: existing.id },
      data: detailsData,
    });

    // Удаляем старые inventoryLevels и marketPrices
    await (prisma as any).inventoryLevel.deleteMany({
      where: { variantDetailsId: existing.id },
    });
    await (prisma as any).marketPrice.deleteMany({
      where: { variantDetailsId: existing.id },
    });
  } else {
    // Создаем новую запись
    await (prisma as any).variantDetails.create({
      data: detailsData,
    });
  }

  // Получаем обновленную запись для создания связанных данных
  const variantDetailsRecord = await (prisma as any).variantDetails.findUnique({
    where: { childProductId },
  });

  if (!variantDetailsRecord) return;

  // Сохраняем InventoryLevels
  if (
    variantDetails.inventoryLevels &&
    Array.isArray(variantDetails.inventoryLevels)
  ) {
    for (const invLevel of variantDetails.inventoryLevels) {
      await (prisma as any).inventoryLevel.create({
        data: {
          variantDetailsId: variantDetailsRecord.id,
          locationId: invLevel.id,
          locationName: invLevel.name || "",
          countryCode: invLevel.countryCode || "",
          quantity: invLevel.quantity || 0,
          shipsInventory: invLevel.shipsInventory || false,
          price: invLevel.price || "0",
          compareAtPrice: invLevel.compareAtPrice || null,
          currencyCode: invLevel.currencyCode || "USD",
          marketId: (invLevel as any).marketId || null,
          marketName: (invLevel as any).marketName || null,
          locale: (invLevel as any).locale || null,
        },
      });
    }
  }

  // Сохраняем MarketPrices, используя warehouses из MarketWarehouse или из существующих записей
  if (
    variantDetails.marketsPrice &&
    Array.isArray(variantDetails.marketsPrice)
  ) {
    for (const marketPrice of variantDetails.marketsPrice) {
      // Приоритет: MarketWarehouse > существующие warehouses > null
      const warehouses =
        marketWarehouses[marketPrice.marketId] ||
        existingWarehouses[marketPrice.marketId] ||
        null;

      await (prisma as any).marketPrice.create({
        data: {
          variantDetailsId: variantDetailsRecord.id,
          marketId: marketPrice.marketId,
          marketName: marketPrice.marketName || "",
          countryCode: marketPrice.countryCode || "",
          price: marketPrice.price || "0",
          compareAtPrice: marketPrice.compareAtPrice || null,
          currencyCode: marketPrice.currencyCode || "USD",
          warehouses,
        },
      });
    }
  }
}

export async function deleteWidget(id: string): Promise<void> {
  // Каскадное удаление через foreign keys удалит все связанные записи
  await prisma.widget.delete({
    where: { id },
  });
}

export async function updateWidget(
  id: string,
  name: string,
  type: string,
  products?: ProductRelationship[],
  settings?: any,
): Promise<Widget> {
  console.log(`[updateWidget] Updating widget ${id}`, {
    name,
    type,
    productsCount: products?.length || 0,
    hasSettings: !!settings,
  });

  // Обновляем основные поля виджета
  const widget = await prisma.widget.update({
    where: { id },
    data: {
      name,
      type,
      settings: settings ? JSON.stringify(settings) : null,
      // Обновляем JSON для обратной совместимости
      products: products ? JSON.stringify(products) : null,
    } as any,
  });

  // Удаляем старые связи
  const oldWidgetProducts = await (prisma as any).widgetProduct.findMany({
    where: { widgetId: id },
  });

  console.log(
    `[updateWidget] Found ${oldWidgetProducts.length} old widget products to delete`,
  );

  for (const wp of oldWidgetProducts) {
    await (prisma as any).widgetChildProduct.deleteMany({
      where: { widgetProductId: wp.id },
    });
  }

  await (prisma as any).widgetProduct.deleteMany({
    where: { widgetId: id },
  });

  // Создаем новые связи (если есть products)
  if (products && products.length > 0) {
    console.log(
      `[updateWidget] Creating ${products.length} product relationships`,
    );
    try {
      for (let order = 0; order < products.length; order++) {
        const productRel = products[order];
        console.log(
          `[updateWidget] Processing product relationship ${order}:`,
          {
            parentProduct: productRel.parentProduct,
            childProductsCount: productRel.childProducts?.length || 0,
          },
        );

        if (!productRel.parentProduct) {
          console.warn(
            `[updateWidget] Skipping product relationship ${order}: missing parentProduct`,
          );
          continue;
        }

        // Нормализуем parentProduct перед сохранением
        const normalizedParentProduct = normalizeParentProduct(
          productRel.parentProduct,
        );
        const parentProductIdToSave = Array.isArray(normalizedParentProduct)
          ? JSON.stringify(normalizedParentProduct)
          : normalizedParentProduct;

        const widgetProduct = await (prisma as any).widgetProduct.create({
          data: {
            widgetId: id,
            parentProductId: parentProductIdToSave,
            order: order,
          },
        });
        console.log(`[updateWidget] Created WidgetProduct ${widgetProduct.id}`);

        if (productRel.childProducts && productRel.childProducts.length > 0) {
          console.log(
            `[updateWidget] Adding ${productRel.childProducts.length} child products`,
          );
          for (
            let childOrder = 0;
            childOrder < productRel.childProducts.length;
            childOrder++
          ) {
            const childProduct = productRel.childProducts[childOrder];
            console.log(
              `[updateWidget] Processing child product ${childOrder}:`,
              {
                variantId: childProduct.variantId,
                productId: childProduct.productId,
              },
            );

            let childProductRecord = await (
              prisma as any
            ).childProduct.findUnique({
              where: { variantId: childProduct.variantId },
            });

            if (!childProductRecord) {
              console.log(
                `[updateWidget] Creating new ChildProduct for variant ${childProduct.variantId}`,
              );
              childProductRecord = await (prisma as any).childProduct.create({
                data: {
                  variantId: childProduct.variantId,
                  productId: childProduct.productId,
                },
              });
            } else {
              console.log(
                `[updateWidget] Found existing ChildProduct ${childProductRecord.id}`,
              );
            }

            try {
              await (prisma as any).widgetChildProduct.create({
                data: {
                  widgetProductId: widgetProduct.id,
                  childProductId: childProductRecord.id,
                  order: childOrder,
                },
              });
              console.log(`[updateWidget] Created WidgetChildProduct link`);
            } catch (linkError: any) {
              console.error(
                `[updateWidget] Error creating WidgetChildProduct link:`,
                linkError,
              );
              // Продолжаем обработку других товаров
            }

            if (childProduct.variantDetails) {
              console.log(
                `[updateWidget] Saving variantDetails for child product`,
              );
              await saveVariantDetails(
                childProductRecord.id,
                childProduct.variantDetails,
                widget.shop,
              );
            }
          }
        }
      }
    } catch (error: any) {
      console.error(
        `[updateWidget] Error creating product relationships:`,
        error,
      );
      throw error;
    }
  } else {
    console.log(`[updateWidget] No products to add`);
  }

  // Возвращаем виджет в старом формате
  const productRelationships = await buildProductRelationships(id);

  return {
    id: widget.id,
    name: widget.name,
    type: widget.type,
    shop: widget.shop,
    products:
      productRelationships.length > 0 ? productRelationships : undefined,
    ...((widget as any).settings
      ? { settings: JSON.parse((widget as any).settings) }
      : {}),
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  };
}

export async function cloneWidget(id: string): Promise<Widget> {
  // Загружаем исходный виджет в "старом" формате
  const original = await getWidgetById(id);
  if (!original) {
    throw new Error(`Widget with id ${id} not found`);
  }

  // Создаем новый виджет с теми же полями, но новым ID
  const clonedName = original.name;

  const newWidget = await createWidget(
    clonedName,
    original.type,
    original.shop,
    original.products,
    (original as any).settings,
  );

  return newWidget;
}

export async function getWidgetsByShop(shop: string): Promise<Widget[]> {
  const widgets = await prisma.widget.findMany({
    where: {
      shop,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Преобразуем каждый виджет в старый формат
  const result: Widget[] = [];
  for (const widget of widgets) {
    const productRelationships = await buildProductRelationships(widget.id);

    result.push({
      id: widget.id,
      name: widget.name,
      type: widget.type,
      shop: widget.shop,
      products:
        productRelationships.length > 0 ? productRelationships : undefined,
      ...((widget as any).settings
        ? { settings: JSON.parse((widget as any).settings) }
        : {}),
      createdAt: widget.createdAt.toISOString(),
      updatedAt: widget.updatedAt.toISOString(),
    });
  }

  return result;
}

export async function getWidgetById(id: string): Promise<Widget | null> {
  const widget = await prisma.widget.findUnique({
    where: {
      id,
    },
  });

  if (!widget) {
    return null;
  }

  const productRelationships = await buildProductRelationships(id);

  return {
    id: widget.id,
    name: widget.name,
    type: widget.type,
    shop: widget.shop,
    products:
      productRelationships.length > 0 ? productRelationships : undefined,
    settings: (widget as any).settings
      ? JSON.parse((widget as any).settings)
      : undefined,
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  };
}

/**
 * Обновляет variantDetails для ChildProduct
 */
export async function updateChildProductVariantDetails(
  variantId: string,
  variantDetails: any,
): Promise<void> {
  // Находим ChildProduct по variantId
  const childProduct = await (prisma as any).childProduct.findUnique({
    where: { variantId },
  });

  if (!childProduct) {
    // Если ChildProduct не найден, создаем его (может быть использован в виджете позже)
    // Но для обновления variantDetails нужен childProductId, поэтому просто возвращаем
    console.warn(
      `ChildProduct with variantId ${variantId} not found, skipping variantDetails update`,
    );
    return;
  }

  // Сохраняем variantDetails
  await saveVariantDetails(childProduct.id, variantDetails);
}

/**
 * Обновляет productHandle для всех вариантов в базе данных
 * Получает handle продуктов из Shopify через ChildProduct.productId и сохраняет их в VariantDetails
 */
export async function updateAllProductHandles(admin: {
  graphql: (query: string, options?: any) => Promise<any>;
}): Promise<{ updated: number; errors: number }> {
  console.log("[updateAllProductHandles] Starting update process...");

  // Получаем все ChildProduct с их productId и связанными VariantDetails
  const allChildProducts = await (prisma as any).childProduct.findMany({
    where: {
      variantDetails: {
        isNot: null, // Только те, у которых есть VariantDetails
      },
    },
    select: {
      id: true,
      productId: true,
      variantDetails: {
        select: {
          id: true,
          productHandle: true,
        },
      },
    },
  });

  console.log(
    `[updateAllProductHandles] Found ${allChildProducts.length} child products with variant details`,
  );

  // Получаем все уникальные productId из ChildProduct
  const productIds = Array.from(
    new Set(
      allChildProducts
        .map((cp: any) => cp.productId)
        .filter((id: string) => id && id !== ""),
    ),
  );

  console.log(
    `[updateAllProductHandles] Found ${productIds.length} unique products`,
  );

  if (productIds.length === 0) {
    console.log("[updateAllProductHandles] No products to update");
    return { updated: 0, errors: 0 };
  }

  const GET_PRODUCT_HANDLES_QUERY = `
    query getProductHandles($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          handle
        }
      }
    }
  `;

  let updated = 0;
  let errors = 0;

  // Обрабатываем по 50 продуктов за раз (лимит Shopify)
  const batchSize = 50;
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);

    try {
      console.log(
        `[updateAllProductHandles] Processing batch ${i + 1}-${Math.min(i + batchSize, productIds.length)} of ${productIds.length}`,
      );

      const response = await admin.graphql(GET_PRODUCT_HANDLES_QUERY, {
        variables: { ids: batch },
      });

      const responseJson =
        typeof response.json === "function"
          ? await response.json()
          : (response as any).body || response;

      if (responseJson?.errors?.length) {
        console.error(
          `[updateAllProductHandles] GraphQL errors:`,
          responseJson.errors,
        );
        errors += batch.length;
        continue;
      }

      const products = responseJson.data?.nodes || [];
      const productHandleMap = new Map<string, string>();

      products.forEach((product: any) => {
        if (product?.id && typeof product.id === "string" && product?.handle) {
          productHandleMap.set(product.id, product.handle);
          console.log(
            `[updateAllProductHandles] Mapped product ${product.id} -> handle: ${product.handle}`,
          );
        }
      });

      // Обновляем все VariantDetails для этих продуктов
      // Находим все ChildProduct с этими productId и обновляем их VariantDetails
      for (const productId of batch) {
        if (typeof productId !== "string") {
          errors++;
          continue;
        }

        const handle = productHandleMap.get(productId);
        if (!handle) {
          console.warn(
            `[updateAllProductHandles] Handle not found for product ${productId}`,
          );
          errors++;
          continue;
        }

        // Находим все ChildProduct с этим productId
        const childProductsForThisProduct = allChildProducts.filter(
          (cp: any) => cp.productId === productId,
        );

        // Обновляем VariantDetails для каждого ChildProduct
        for (const childProduct of childProductsForThisProduct) {
          if (childProduct.variantDetails) {
            try {
              await (prisma as any).variantDetails.update({
                where: { id: childProduct.variantDetails.id },
                data: { productHandle: handle },
              });
              updated++;
              console.log(
                `[updateAllProductHandles] Updated VariantDetails ${childProduct.variantDetails.id} with handle ${handle}`,
              );
            } catch (updateError) {
              console.error(
                `[updateAllProductHandles] Error updating VariantDetails ${childProduct.variantDetails.id}:`,
                updateError,
              );
              errors++;
            }
          }
        }
      }
    } catch (error) {
      console.error(
        `[updateAllProductHandles] Error processing batch ${i}-${i + batch.length}:`,
        error,
      );
      errors += batch.length;
    }
  }

  console.log(
    `[updateAllProductHandles] Complete. Updated: ${updated}, Errors: ${errors}`,
  );

  return { updated, errors };
}
