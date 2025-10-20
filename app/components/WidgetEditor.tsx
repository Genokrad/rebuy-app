import { BlockStack, Text, Button, Layout } from "@shopify/polaris";
import React, { useState, useEffect, useMemo } from "react";
import { ProductRelationshipSelector } from "./ProductRelationshipSelector";
import { ExistingProductRelationships } from "./ExistingProductRelationships";
import { WidgetForm } from "./WidgetForm";
import type { ChildProduct } from "./types";
import HowItWorks from "./HowItWorks";
import { WidgetSettings } from "./WidgetSettings";

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
    settings?: any,
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
  const [settings, setSettings] = useState({
    discount1: "",
    discount2: "",
    discount3: "",
    discount4: "",
    discount5: "",
  });

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
        // console.log("=== LOADING MARKETS IN WIDGET EDITOR ===");

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
          // console.log(arrayMarkets);
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

    // Отправляем все связи вместе с настройками
    onSave(name, value, null, allRelations, widgetId, settings);
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
              currentParentProduct={currentParentProduct}
              selectedChildProducts={selectedChildProducts}
              existingProducts={existingProducts}
              onParentProductChange={handleParentProductChange}
              onChildProductsChange={handleChildProductsChange}
            />

            <WidgetSettings
              settings={settings}
              onSettingsChange={setSettings}
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
