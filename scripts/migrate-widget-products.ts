/**
 * Скрипт миграции данных из JSON поля products в нормализованную структуру
 *
 * Запуск: npx tsx scripts/migrate-widget-products.ts
 */

import { PrismaClient } from "@prisma/client";
import type {
  ProductRelationship,
  ChildProduct,
} from "../app/components/types";

const prisma = new PrismaClient();

async function migrateWidgetProducts() {
  console.log("🚀 Начинаем миграцию данных...");

  try {
    // Получаем все виджеты с JSON данными
    const widgets = await prisma.widget.findMany({
      where: {
        products: {
          not: null,
        },
      },
    });

    console.log(`📦 Найдено виджетов для миграции: ${widgets.length}`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const widget of widgets) {
      try {
        // Проверяем, не мигрирован ли уже виджет
        const existingWidgetProducts = await prisma.widgetProduct.findFirst({
          where: { widgetId: widget.id },
        });

        if (existingWidgetProducts) {
          console.log(`⏭️  Виджет ${widget.id} уже мигрирован, пропускаем`);
          skippedCount++;
          continue;
        }

        // Парсим JSON
        const productsJson = (widget as any).products;
        if (!productsJson) {
          console.log(`⚠️  Виджет ${widget.id} не имеет products, пропускаем`);
          skippedCount++;
          continue;
        }

        let productRelationships: ProductRelationship[];
        try {
          productRelationships = JSON.parse(productsJson);
        } catch (error) {
          console.error(
            `❌ Ошибка парсинга JSON для виджета ${widget.id}:`,
            error,
          );
          skippedCount++;
          continue;
        }

        if (!Array.isArray(productRelationships)) {
          console.log(
            `⚠️  Виджет ${widget.id} имеет некорректный формат products`,
          );
          skippedCount++;
          continue;
        }

        console.log(
          `📝 Мигрируем виджет ${widget.id} (${widget.name}) с ${productRelationships.length} родительскими товарами`,
        );

        // Обрабатываем каждый ProductRelationship
        for (let order = 0; order < productRelationships.length; order++) {
          const productRel = productRelationships[order];

          // Создаем WidgetProduct
          const widgetProduct = await prisma.widgetProduct.create({
            data: {
              widgetId: widget.id,
              parentProductId: productRel.parentProduct,
              order: order,
            },
          });

          // Обрабатываем каждый ChildProduct
          if (
            productRel.childProducts &&
            Array.isArray(productRel.childProducts)
          ) {
            for (
              let childOrder = 0;
              childOrder < productRel.childProducts.length;
              childOrder++
            ) {
              const childProduct = productRel.childProducts[childOrder];

              // Находим или создаем ChildProduct
              let childProductRecord = await prisma.childProduct.findUnique({
                where: { variantId: childProduct.variantId },
              });

              if (!childProductRecord) {
                childProductRecord = await prisma.childProduct.create({
                  data: {
                    variantId: childProduct.variantId,
                    productId: childProduct.productId,
                  },
                });
              }

              // Создаем связь WidgetChildProduct
              await prisma.widgetChildProduct.create({
                data: {
                  widgetProductId: widgetProduct.id,
                  childProductId: childProductRecord.id,
                  order: childOrder,
                },
              });

              // Если есть variantDetails, мигрируем их
              if (childProduct.variantDetails) {
                const variantDetails = childProduct.variantDetails;

                // Проверяем, не созданы ли уже variantDetails
                const existingDetails = await prisma.variantDetails.findUnique({
                  where: { childProductId: childProductRecord.id },
                });

                if (!existingDetails) {
                  // Создаем VariantDetails
                  const variantDetailsRecord =
                    await prisma.variantDetails.create({
                      data: {
                        childProductId: childProductRecord.id,
                        inventoryQuantity:
                          variantDetails.inventoryQuantity || 0,
                        availableForSale:
                          variantDetails.availableForSale || false,
                        inventoryPolicy:
                          variantDetails.inventoryPolicy || "DENY",
                        variantId: variantDetails.id || childProduct.variantId,
                        title: variantDetails.title || "",
                        price: variantDetails.price || "0",
                        compareAtPrice: variantDetails.compareAtPrice || null,
                        imageUrl: variantDetails.image?.url || null,
                        productId:
                          variantDetails.product?.id || childProduct.productId,
                        productTitle: variantDetails.product?.title || "",
                      },
                    });

                  // Мигрируем InventoryLevels
                  if (
                    variantDetails.inventoryLevels &&
                    Array.isArray(variantDetails.inventoryLevels)
                  ) {
                    for (const invLevel of variantDetails.inventoryLevels) {
                      await prisma.inventoryLevel.create({
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

                  // Мигрируем MarketPrices
                  if (
                    variantDetails.marketsPrice &&
                    Array.isArray(variantDetails.marketsPrice)
                  ) {
                    for (const marketPrice of variantDetails.marketsPrice) {
                      await prisma.marketPrice.create({
                        data: {
                          variantDetailsId: variantDetailsRecord.id,
                          marketId: marketPrice.marketId,
                          marketName: marketPrice.marketName || "",
                          countryCode: marketPrice.countryCode || "",
                          price: marketPrice.price || "0",
                          currencyCode: marketPrice.currencyCode || "USD",
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        }

        migratedCount++;
        console.log(`✅ Виджет ${widget.id} успешно мигрирован`);
      } catch (error) {
        console.error(`❌ Ошибка при миграции виджета ${widget.id}:`, error);
        skippedCount++;
      }
    }

    console.log("\n📊 Результаты миграции:");
    console.log(`   ✅ Успешно мигрировано: ${migratedCount}`);
    console.log(`   ⏭️  Пропущено: ${skippedCount}`);
    console.log(`   📦 Всего обработано: ${widgets.length}`);
  } catch (error) {
    console.error("❌ Критическая ошибка при миграции:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateWidgetProducts()
  .then(() => {
    console.log("\n🎉 Миграция завершена!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Миграция завершилась с ошибкой:", error);
    process.exit(1);
  });
