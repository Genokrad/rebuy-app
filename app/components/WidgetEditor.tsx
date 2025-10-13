import {
  BlockStack,
  TextField,
  Text,
  Button,
  Layout,
  Card,
} from "@shopify/polaris";
import React, { useState } from "react";
import { ProductSelector } from "./ProductSelector";
import { transformShopifyProducts } from "../utils/productUtils";
import { ProductDebug } from "./ProductDebug";

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

  console.log("existingProducts", existingProducts);
  console.log("currentParentProduct", currentParentProduct);
  console.log("selectedChildProducts", selectedChildProducts);

  // Инициализация при загрузке компонента
  React.useEffect(() => {
    if (existingProducts.length > 0 && !currentParentProduct) {
      // Устанавливаем первый родительский продукт по умолчанию
      const firstParent = existingProducts[0].parentProduct;
      setCurrentParentProduct(firstParent);
      setSelectedChildProducts(existingProducts[0].childProducts);
    }
  }, [existingProducts, currentParentProduct]);

  // Transform Shopify products to our format
  const transformedProducts = transformShopifyProducts(products);

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
  };

  // Функция для добавления нового родительского продукта
  const handleAddNewParentProduct = (parentProductId: string) => {
    setCurrentParentProduct(parentProductId);
    setSelectedChildProducts([]);
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

            {/* Debug component - remove after testing */}
            <ProductDebug products={products} />

            {/* Show all existing relationships */}
            {existingProducts.length > 0 && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    All Product Relationships ({existingProducts.length})
                  </Text>
                  <Layout>
                    {existingProducts.map((rel, index) => {
                      const parentProduct = transformedProducts.find(
                        (p) => p.id === rel.parentProduct,
                      );
                      return (
                        <Layout.Section key={index} variant="oneThird">
                          <Card>
                            <BlockStack gap="200">
                              <Text as="h4" variant="headingSm">
                                {parentProduct?.title || rel.parentProduct}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Children: {rel.childProducts.length}
                              </Text>
                              <Button
                                variant="plain"
                                size="slim"
                                onClick={() =>
                                  handleParentProductChange(rel.parentProduct)
                                }
                              >
                                Edit this relationship
                              </Button>
                            </BlockStack>
                          </Card>
                        </Layout.Section>
                      );
                    })}
                  </Layout>
                </BlockStack>
              </Card>
            )}

            {/* Current Parent Product Selector */}
            {currentParentProduct && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Currently Editing:{" "}
                    {transformedProducts.find(
                      (p) => p.id === currentParentProduct,
                    )?.title || "No parent selected"}
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Child products: {selectedChildProducts.length} selected
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
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentParentProduct("")}
                  >
                    Add New Parent Product
                  </Button>
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
                      Parent product:{" "}
                      {transformedProducts.find(
                        (p) => p.id === currentParentProduct,
                      )?.title || "No parent selected"}
                    </Text>
                    {/* <Text as="h3" variant="headingMd">
                      {currentParentProduct
                        ? "Add New Parent Product"
                        : "Select Parent Product"}
                    </Text> */}
                    <ProductSelector
                      products={transformedProducts}
                      selectedProducts={currentParentProduct ? [] : []}
                      onSelectionChange={(selectedIds) => {
                        if (selectedIds.length > 0) {
                          if (currentParentProduct) {
                            // Добавляем новый родительский продукт
                            handleAddNewParentProduct(selectedIds[0]);
                          } else {
                            // Устанавливаем первый родительский продукт
                            handleParentProductChange(selectedIds[0]);
                          }
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
                        <ProductSelector
                          products={transformedProducts}
                          selectedProducts={selectedChildProducts}
                          onSelectionChange={setSelectedChildProducts}
                          isMultiSelect={true}
                          placeholder="Search for child products..."
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
