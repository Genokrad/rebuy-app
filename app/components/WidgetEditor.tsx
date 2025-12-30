import {
  BlockStack,
  Text,
  Button,
  Layout,
  TextField,
  Spinner,
} from "@shopify/polaris";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@remix-run/react";
import { ProductRelationshipSelector } from "./ProductRelationshipSelector";
import { ExistingProductRelationships } from "./ExistingProductRelationships";
import { WidgetForm } from "./WidgetForm";
import type { ChildProduct } from "./types";
import HowItWorks from "./HowItWorks";
import { WidgetSettings } from "./WidgetSettings";
import WidgetPlacements, { type PlacementKey } from "./WidgetPlacements";

interface WidgetEditorProps {
  widgetName: string;
  widgetId: string;
  widgetType: string;
  products: any[];
  existingProducts?: any[];
  settings?: any;
  isSaving?: boolean;
  onBack: () => void;
  onSave: (
    name: string,
    value: string,
    parentProduct: any,
    childProducts: any[],
    widgetId: string,
    settings?: any,
  ) => void;
}

export function WidgetEditor({
  widgetName,
  widgetId,
  widgetType,
  products,
  existingProducts = [],
  settings: initialSettings,
  isSaving = false,
  onBack,
  onSave,
}: WidgetEditorProps) {
  const [name, setName] = useState(widgetName);
  const [value, setValue] = useState("");
  const [placements, setPlacements] = useState<PlacementKey[]>(
    (initialSettings?.placements as PlacementKey[] | undefined) || [],
  );
  const [settings, setSettings] = useState(
    initialSettings || {
      discounts: [],
      placements: [],
    },
  );
  const [slideCount, setSlideCount] = useState<number | undefined>(
    (initialSettings as any)?.slideCount || undefined,
  );
  useEffect(() => {
    setName(widgetName);
  }, [widgetName]);

  useEffect(() => {
    setPlacements(
      (initialSettings?.placements as PlacementKey[] | undefined) || [],
    );
    setSettings(
      initialSettings || {
        discounts: [],
        placements: [],
      },
    );
    setSlideCount((initialSettings as any)?.slideCount || undefined);
  }, [initialSettings]);

  // Состояние для работы с множественными родительскими продуктами
  const [currentParentProducts, setCurrentParentProducts] = useState<
    string | string[]
  >("");
  const [selectedChildProducts, setSelectedChildProducts] = useState<
    ChildProduct[]
  >([]);
  const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);

  const navigate = useNavigate();

  // Products are already transformed in the loader, no need to transform again
  const transformedProducts = useMemo(() => {
    return products;
  }, [products]);

  // Загружаем только рынки при открытии WidgetEditor
  useEffect(() => {
    if (hasLoadedData) {
      return;
    }

    const loadMarkets = async () => {
      try {
        // console.log("=== LOADING MARKETS IN WIDGET EDITOR ===");

        // Загружаем только рынки
        const marketsResponse = await fetch("/api/markets");
        const marketsData = await marketsResponse.json();

        if (marketsData.success) {
          const markets = marketsData.markets;
          markets.map((market: any) => ({
            id: market.id,
            name: market.name,
            enabled: market.enabled,
            primary: market.primary,
            // Используем fallback значения, так как conditions может не быть доступен
            code:
              market.conditions?.regionsCondition?.regions?.nodes?.[0]?.code ||
              market.name.substring(0, 2).toUpperCase(),
            regionName:
              market.conditions?.regionsCondition?.regions?.nodes?.[0]?.name ||
              market.name,
          }));
          // console.log(mappedMarkets);
          // console.log("=== END OF MARKETS ===");
        } else {
          console.error("Failed to load markets:", marketsData.error);
        }

        setHasLoadedData(true);
      } catch (error) {
        console.error("Error loading markets:", error);
      }
    };

    loadMarkets();
  }, [hasLoadedData]);

  // Инициализация при загрузке компонента
  useEffect(() => {
    if (existingProducts.length > 0 && !currentParentProducts) {
      // Устанавливаем первый родительский продукт(ы) по умолчанию
      const firstParent = existingProducts[0].parentProduct;
      setCurrentParentProducts(firstParent);

      // Преобразуем старые данные в новый формат
      const convertToChildProducts = (childProducts: any[]): ChildProduct[] => {
        return childProducts.map((item: any) => {
          if (typeof item === "object" && item.productId) {
            return item;
          }
          const product = transformedProducts.find((p) => p.id === item);
          if (product && product.variants && product.variants.length > 0) {
            return {
              productId: item,
              variantId: product.variants[0].id,
            };
          }
          return {
            productId: item,
            variantId: item,
          };
        });
      };

      setSelectedChildProducts(
        convertToChildProducts(existingProducts[0].childProducts),
      );
    }
  }, [existingProducts, currentParentProducts, transformedProducts]);

  // Функция для изменения родительских продуктов (поддерживает массив)
  const handleParentProductsChange = (parentProductIds: string | string[]) => {
    setCurrentParentProducts(parentProductIds);
  };

  // Функция для изменения дочерних продуктов
  const handleChildProductsChange = (childProducts: ChildProduct[]) => {
    setSelectedChildProducts(childProducts);
  };

  // Обработчик удаления всей связи
  const handleRemoveRelationship = (relationshipIndex: number) => {
    const updatedRelations = existingProducts.filter(
      (_, idx) => idx !== relationshipIndex,
    );
    onSave(name, value, null, updatedRelations, widgetId, {
      ...(settings || {}),
      placements,
      slideCount: slideCount || undefined,
    });
  };

  // Обработчик удаления родительского продукта из связи
  const handleRemoveParentProduct = (
    relationshipIndex: number,
    parentProductIdToRemove: string,
  ) => {
    // Находим связь по индексу
    const relationship = existingProducts[relationshipIndex];
    if (!relationship) return;

    const currentParentProduct = relationship.parentProduct;

    // Если это массив, удаляем элемент
    if (Array.isArray(currentParentProduct)) {
      const updatedParentProducts = currentParentProduct.filter(
        (id) => id !== parentProductIdToRemove,
      );

      // Если остался только один продукт, преобразуем в строку для обратной совместимости
      // Если массив пуст, удаляем всю связь
      if (updatedParentProducts.length === 0) {
        // Удаляем всю связь
        const updatedRelations = existingProducts.filter(
          (_, idx) => idx !== relationshipIndex,
        );
        // Сохраняем изменения
        onSave(name, value, null, updatedRelations, widgetId, {
          ...(settings || {}),
          placements,
          slideCount: slideCount || undefined,
        });
      } else if (updatedParentProducts.length === 1) {
        // Преобразуем в строку
        const updatedRelations = [...existingProducts];
        updatedRelations[relationshipIndex] = {
          ...relationship,
          parentProduct: updatedParentProducts[0],
        };
        onSave(name, value, null, updatedRelations, widgetId, {
          ...(settings || {}),
          placements,
          slideCount: slideCount || undefined,
        });
      } else {
        // Оставляем как массив
        const updatedRelations = [...existingProducts];
        updatedRelations[relationshipIndex] = {
          ...relationship,
          parentProduct: updatedParentProducts,
        };
        onSave(name, value, null, updatedRelations, widgetId, {
          ...(settings || {}),
          placements,
          slideCount: slideCount || undefined,
        });
      }
    } else {
      // Если это строка, удаляем всю связь (так как это единственный родительский продукт)
      const updatedRelations = existingProducts.filter(
        (_, idx) => idx !== relationshipIndex,
      );
      onSave(name, value, null, updatedRelations, widgetId, {
        ...(settings || {}),
        placements,
        slideCount: slideCount || undefined,
      });
    }
  };

  const handleSave = () => {
    // Собираем все связи: существующие + текущая
    const allRelations = [...existingProducts];

    // Функция для проверки, совпадают ли родительские продукты
    const parentProductsMatch = (
      parent1: string | string[],
      parent2: string | string[],
    ): boolean => {
      const arr1 = Array.isArray(parent1) ? parent1 : [parent1];
      const arr2 = Array.isArray(parent2) ? parent2 : [parent2];
      if (arr1.length !== arr2.length) return false;
      return arr1.every((id) => arr2.includes(id));
    };

    // Обновляем или добавляем текущую связь
    const existingIndex = allRelations.findIndex((rel) =>
      parentProductsMatch(rel.parentProduct, currentParentProducts),
    );

    if (existingIndex >= 0) {
      // Обновляем существующую связь
      allRelations[existingIndex].childProducts = selectedChildProducts;
      allRelations[existingIndex].parentProduct = currentParentProducts;
    } else if (currentParentProducts && selectedChildProducts.length > 0) {
      // Добавляем новую связь
      allRelations.push({
        parentProduct: currentParentProducts,
        childProducts: selectedChildProducts,
      });
    }

    // Отправляем все связи вместе с настройками (включая placements и slideCount)
    const finalSettings = {
      ...(settings || {}),
      placements,
      slideCount: slideCount || undefined,
    };
    onSave(name, value, null, allRelations, widgetId, finalSettings);
  };

  return (
    <div style={{ position: "relative" }}>
      {isSaving && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.7)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <Spinner size="large" />
          <Text as="p" variant="bodyMd">
            Saving widget…
          </Text>
        </div>
      )}
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Text as="h1" variant="headingLg">
                Edit Widget {widgetName}: id {widgetId}
              </Text>

              <WidgetPlacements
                selected={placements}
                onChange={setPlacements}
              />

              {/* Slide Count field */}
              <TextField
                label="Количество активных слайдов"
                type="number"
                value={slideCount?.toString() || ""}
                onChange={(value) => {
                  const numValue = parseInt(value, 10);
                  setSlideCount(isNaN(numValue) ? undefined : numValue);
                }}
                helpText="Укажите количество слайдов, которые будут отображаться одновременно"
                autoComplete="off"
              />

              <Button
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("placements", JSON.stringify(placements));
                  navigate(
                    `/app/widget-appearance/${widgetId}?${params.toString()}`,
                  );
                }}
                variant="primary"
              >
                Change the appearance of the widget
              </Button>

              {/* Show all existing relationships */}
              <ExistingProductRelationships
                existingProducts={existingProducts}
                transformedProducts={transformedProducts}
                currentParentProduct={
                  Array.isArray(currentParentProducts)
                    ? currentParentProducts[0] || ""
                    : currentParentProducts || ""
                }
                onParentProductChange={(id) => {
                  // Для обратной совместимости с ExistingProductRelationships
                  setCurrentParentProducts(id);
                }}
                onRelationshipSelect={(parentProducts, childProducts) => {
                  // Нормализуем ID родительских продуктов (убираем GID префикс если есть)
                  const normalizeProductId = (id: string): string => {
                    if (id.startsWith("gid://shopify/Product/")) {
                      return id.replace("gid://shopify/Product/", "");
                    }
                    return id;
                  };

                  // Нормализуем parentProducts перед установкой
                  let normalizedParentProducts: string | string[];
                  if (Array.isArray(parentProducts)) {
                    normalizedParentProducts =
                      parentProducts.map(normalizeProductId);
                  } else {
                    normalizedParentProducts =
                      normalizeProductId(parentProducts);
                  }

                  // Устанавливаем все родительские продукты
                  setCurrentParentProducts(normalizedParentProducts);
                  // Устанавливаем все дочерние продукты
                  // Преобразуем в формат ChildProduct[]
                  const convertedChildProducts = childProducts.map(
                    (item: any) => {
                      // Если это уже новый формат (объект с productId и variantId)
                      if (typeof item === "object" && item.productId) {
                        // Сохраняем variantDetails если они есть, нормализуем только productId
                        const normalizedProductId = normalizeProductId(
                          item.productId,
                        );
                        return {
                          productId: normalizedProductId,
                          variantId: item.variantId, // Сохраняем оригинальный variantId
                          variantDetails: item.variantDetails, // Сохраняем variantDetails если есть
                        };
                      }
                      // Если это старый формат (просто строка с ID продукта)
                      const normalizedItemId = normalizeProductId(item);
                      const product = transformedProducts.find((p) => {
                        const normalizedPId = normalizeProductId(p.id);
                        return normalizedPId === normalizedItemId;
                      });
                      if (
                        product &&
                        product.variants &&
                        product.variants.length > 0
                      ) {
                        return {
                          productId: normalizedItemId,
                          variantId: product.variants[0].id,
                          // variantDetails не сохраняем, так как это старый формат
                        };
                      }
                      return {
                        productId: normalizedItemId,
                        variantId: normalizedItemId, // fallback
                      };
                    },
                  );
                  setSelectedChildProducts(convertedChildProducts);
                }}
                onRemoveParentProduct={handleRemoveParentProduct}
                onRemoveRelationship={handleRemoveRelationship}
              />

              {/* Name and Value fields */}
              <WidgetForm
                name={name}
                value={value}
                onNameChange={setName}
                onValueChange={setValue}
              />

              {/* How it works link */}
              <HowItWorks />

              {/* Product Selection */}
              <ProductRelationshipSelector
                transformedProducts={transformedProducts}
                currentParentProducts={currentParentProducts}
                selectedChildProducts={selectedChildProducts}
                existingProducts={existingProducts}
                onParentProductsChange={handleParentProductsChange}
                onChildProductsChange={handleChildProductsChange}
              />

              <WidgetSettings
                settings={settings}
                onSettingsChange={(newSettings) => {
                  setSettings((prev: any) => ({ ...prev, ...newSettings }));
                }}
              />

              {/* Action buttons */}
              <Layout>
                <Layout.Section>
                  <BlockStack gap="200">
                    <Button
                      onClick={handleSave}
                      variant="primary"
                      loading={isSaving}
                      disabled={isSaving}
                    >
                      Save Widget
                    </Button>
                    <Button onClick={onBack}>Back to Widgets</Button>
                  </BlockStack>
                </Layout.Section>
              </Layout>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </div>
  );
}
