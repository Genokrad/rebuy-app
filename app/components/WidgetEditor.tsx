import {
  BlockStack,
  TextField,
  Text,
  Button,
  Layout,
  Card,
} from "@shopify/polaris";
import React, { useState, useEffect, useMemo } from "react";
import { ProductSelector } from "./ProductSelector";
import { transformShopifyProducts } from "../utils/productUtils";

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
  const [selectedChildProducts, setSelectedChildProducts] = useState<string[]>(
    [],
  );
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);
  const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);
  const [allMarkets, setAllMarkets] = useState<any[]>([]);

  // Transform Shopify products to our format (memoized to prevent unnecessary re-renders)
  const transformedProducts = useMemo(() => {
    return transformShopifyProducts(products);
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
            code: market.conditions.regionsCondition.regions.nodes[0].code,
            regionName:
              market.conditions.regionsCondition.regions.nodes[0].name,
          }));
          setAllMarkets(arrayMarkets);
          // console.log("=== AVAILABLE MARKETS ===");
          // console.log("Total markets found:", markets.length);
          // markets.forEach((market: any, index: number) => {
          //   console.log(`${index + 1}. ${market.name}`, {
          //     id: market.id,
          //     enabled: market.enabled,
          //     primary: market.primary,
          //     code: market.conditions.regionsCondition.regions.nodes[0].code,
          //     name: market.conditions.regionsCondition.regions.nodes[0].name,
          //   });
          // });
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
      setSelectedChildProducts(existingProducts[0].childProducts);
    }
  }, [existingProducts, currentParentProduct]);

  // Функция для переключения между родительскими продуктами
  const handleParentProductChange = (parentProductId: string) => {
    setCurrentParentProduct(parentProductId);

    // Находим дочерние продукты для выбранного родительского
    const existingRelation = existingProducts.find(
      (rel) => rel.parentProduct === parentProductId,
    );

    if (existingRelation) {
      setSelectedChildProducts(existingRelation.childProducts);
    } else {
      setSelectedChildProducts([]);
    }

    // Сбрасываем фильтр при переключении родительского продукта
    setShowOnlySelected(false);
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
            {existingProducts.length > 0 && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    All Product Relationships ({existingProducts.length})
                  </Text>
                  <div
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                      border: "1px solid #e1e3e5",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <BlockStack gap="200">
                      {existingProducts.map((rel, index) => {
                        const parentProduct = transformedProducts.find(
                          (p) => p.id === rel.parentProduct,
                        );
                        return (
                          <div
                            key={index}
                            onClick={() =>
                              handleParentProductChange(rel.parentProduct)
                            }
                            style={{
                              padding: "12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              backgroundColor:
                                currentParentProduct === rel.parentProduct
                                  ? "#f0f8ff"
                                  : "transparent",
                              border:
                                currentParentProduct === rel.parentProduct
                                  ? "2px solid #007ace"
                                  : "1px solid #e1e3e5",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (currentParentProduct !== rel.parentProduct) {
                                e.currentTarget.style.backgroundColor =
                                  "#f9f9f9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentParentProduct !== rel.parentProduct) {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }
                            }}
                          >
                            <BlockStack gap="100">
                              <Text
                                as="p"
                                variant="bodyMd"
                                fontWeight="semibold"
                              >
                                {parentProduct?.title || rel.parentProduct}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Children: {rel.childProducts.length} products
                              </Text>
                            </BlockStack>
                          </div>
                        );
                      })}
                    </BlockStack>
                  </div>
                </BlockStack>
              </Card>
            )}

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
            <Layout>
              <Layout.Section variant="oneHalf">
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Parent product
                    </Text>
                    <ProductSelector
                      products={transformedProducts}
                      selectedProducts={
                        currentParentProduct ? [currentParentProduct] : []
                      }
                      onSelectionChange={(selectedIds) => {
                        if (selectedIds.length > 0) {
                          // Переключаемся на выбранный родительский продукт
                          handleParentProductChange(selectedIds[0]);
                        }
                      }}
                      isMultiSelect={false}
                      placeholder="Search for parent product..."
                    />
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section variant="oneHalf">
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Child products
                    </Text>
                    {currentParentProduct ? (
                      <BlockStack gap="200">
                        {selectedChildProducts.length !== 0 && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            Selected child products:{" "}
                            {selectedChildProducts.length}
                            {selectedChildProducts.length > 0 && (
                              <span>
                                {" "}
                                (
                                {selectedChildProducts
                                  .map((id) => {
                                    const product = transformedProducts.find(
                                      (p) => p.id === id,
                                    );
                                    return product?.title || id;
                                  })
                                  .join(", ")}
                                )
                              </span>
                            )}
                          </Text>
                        )}

                        {/* Filter checkbox */}
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={showOnlySelected}
                            onChange={(e) =>
                              setShowOnlySelected(e.target.checked)
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <Text as="span" variant="bodyMd">
                            Show only selected products (
                            {selectedChildProducts.length})
                          </Text>
                        </label>

                        <ProductSelector
                          products={
                            showOnlySelected
                              ? transformedProducts.filter((p) =>
                                  selectedChildProducts.includes(p.id),
                                )
                              : transformedProducts
                          }
                          selectedProducts={selectedChildProducts}
                          onSelectionChange={setSelectedChildProducts}
                          isMultiSelect={true}
                          placeholder={
                            showOnlySelected
                              ? "All selected products..."
                              : "Search for child products..."
                          }
                        />
                      </BlockStack>
                    ) : (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          background: "#f6f6f7",
                          borderRadius: "4px",
                        }}
                      >
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Please select a parent product first
                        </Text>
                      </div>
                    )}
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>

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
