import {
  BlockStack,
  TextField,
  Text,
  Button,
  Layout,
  Card,
} from "@shopify/polaris";
import React, { useState, useEffect, useMemo } from "react";
import { ProductRelationshipSelector } from "./ProductRelationshipSelector";
import { ExistingProductRelationships } from "./ExistingProductRelationships";
import type { ChildProduct } from "./types";

interface WidgetEditorProps {
  widgetName: string;
  widgetId: string;
  widgetType: string;
  products: any[];
  existingProducts?: any[];
  onBack: () => void;
  onSave: (
    name: string,
    value: string,
    parentProduct: any,
    childProducts: any[],
    widgetId: string,
  ) => void;
}

export function WidgetEditor({
  widgetName,
  widgetId,
  widgetType,
  products,
  existingProducts = [],
  onBack,
  onSave,
}: WidgetEditorProps) {
  const [name, setName] = useState(widgetName);
  const [value, setValue] = useState("");

  // Состояние для работы с множественными родительскими продуктами
  const [currentParentProduct, setCurrentParentProduct] = useState<string>("");
  const [selectedChildProducts, setSelectedChildProducts] = useState<
    ChildProduct[]
  >([]);
  const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);

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
        console.log("=== LOADING MARKETS IN WIDGET EDITOR ===");

        // Загружаем только рынки
        const marketsResponse = await fetch("/api/markets");
        const marketsData = await marketsResponse.json();

        if (marketsData.success) {
          const markets = marketsData.markets;
          const arrayMarkets = markets.map((market: any) => ({
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
          console.log(arrayMarkets);
          console.log("=== END OF MARKETS ===");
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
    if (existingProducts.length > 0 && !currentParentProduct) {
      // Устанавливаем первый родительский продукт по умолчанию
      const firstParent = existingProducts[0].parentProduct;
      setCurrentParentProduct(firstParent);

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
  }, [existingProducts, currentParentProduct, transformedProducts]);

  // Функция для переключения между родительскими продуктами
  const handleParentProductChange = (parentProductId: string) => {
    setCurrentParentProduct(parentProductId);
  };

  // Функция для изменения дочерних продуктов
  const handleChildProductsChange = (childProducts: ChildProduct[]) => {
    setSelectedChildProducts(childProducts);
  };

  const handleSave = () => {
    // Собираем все связи: существующие + текущую
    const allRelations = [...existingProducts];

    // Обновляем или добавляем текущую связь
    const existingIndex = allRelations.findIndex(
      (rel) => rel.parentProduct === currentParentProduct,
    );

    if (existingIndex >= 0) {
      // Обновляем существующую связь
      allRelations[existingIndex].childProducts = selectedChildProducts;
    } else if (currentParentProduct && selectedChildProducts.length > 0) {
      // Добавляем новую связь
      allRelations.push({
        parentProduct: currentParentProduct,
        childProducts: selectedChildProducts,
      });
    }

    // Отправляем все связи
    onSave(name, value, null, allRelations, widgetId);
  };

  return (
    <BlockStack gap="500">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Edit Widget {widgetName}: id {widgetId}
            </Text>

            {/* Show all existing relationships */}
            <ExistingProductRelationships
              existingProducts={existingProducts}
              transformedProducts={transformedProducts}
              currentParentProduct={currentParentProduct}
              onParentProductChange={handleParentProductChange}
            />

            {/* Name and Value fields */}
            <Card>
              <BlockStack gap="300">
                <TextField
                  label="Name"
                  value={name}
                  onChange={setName}
                  placeholder="Enter widget name"
                  autoComplete="off"
                />
                <TextField
                  label="Value"
                  value={value}
                  onChange={setValue}
                  placeholder="Enter widget value"
                  autoComplete="off"
                />
              </BlockStack>
            </Card>

            {/* How it works link */}
            <Text as="p" variant="bodyMd">
              <Button variant="plain" size="slim">
                How it works?
              </Button>
            </Text>

            {/* Product Selection */}
            <ProductRelationshipSelector
              transformedProducts={transformedProducts}
              currentParentProduct={currentParentProduct}
              selectedChildProducts={selectedChildProducts}
              existingProducts={existingProducts}
              onParentProductChange={handleParentProductChange}
              onChildProductsChange={handleChildProductsChange}
            />

            {/* Action buttons */}
            <Layout>
              <Layout.Section>
                <BlockStack gap="200">
                  <Button onClick={handleSave} variant="primary">
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
  );
}
