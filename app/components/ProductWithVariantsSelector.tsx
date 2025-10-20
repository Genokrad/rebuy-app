import {
  TextField,
  BlockStack,
  Text,
  Checkbox,
  InlineStack,
  Thumbnail,
  Card,
  Badge,
  Button,
} from "@shopify/polaris";
import { useState } from "react";
import type { ChildProduct, VariantDetails } from "./types";

interface Product {
  id: string;
  title: string;
  description: string;
  image?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: string;
    compareAtPrice?: string;
    availableForSale: boolean;
    image?: {
      url: string;
      altText?: string;
    };
  }>;
}

interface ProductWithVariantsSelectorProps {
  products: Product[];
  selectedProducts: ChildProduct[];
  onSelectionChange: (childProducts: ChildProduct[]) => void;
  isMultiSelect?: boolean;
  placeholder?: string;
}

export function ProductWithVariantsSelector({
  products,
  selectedProducts,
  onSelectionChange,
  isMultiSelect = false,
  placeholder = "Search products...",
}: ProductWithVariantsSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [loadingVariants, setLoadingVariants] = useState<Set<string>>(
    new Set(),
  );

  // Функция для получения первого варианта продукта
  const getFirstVariant = (product: Product): string | null => {
    if (!product.variants || product.variants.length === 0) {
      return null; // Продукт без вариантов
    }
    return product.variants[0].id;
  };

  // Функция для проверки, выбран ли продукт
  const isProductSelected = (productId: string): boolean => {
    return selectedProducts.some((cp) => cp.productId === productId);
  };

  // Функция для проверки, выбран ли конкретный вариант
  const isVariantSelected = (productId: string, variantId: string): boolean => {
    return selectedProducts.some(
      (cp) => cp.productId === productId && cp.variantId === variantId,
    );
  };

  // Функция для получения выбранных вариантов продукта
  const getSelectedVariants = (productId: string): string[] => {
    return selectedProducts
      .filter((cp) => cp.productId === productId)
      .map((cp) => cp.variantId);
  };

  // Функция для обработки выбора продукта
  const handleProductSelect = async (product: Product) => {
    const firstVariant = getFirstVariant(product);

    if (!firstVariant) {
      // Продукт без вариантов - не можем его выбрать
      return;
    }

    const isSelected = isProductSelected(product.id);

    if (isSelected) {
      // Удаляем продукт из выбора
      const newSelection = selectedProducts.filter(
        (cp) => cp.productId !== product.id,
      );
      onSelectionChange(newSelection);
    } else {
      // Загружаем детали первого варианта
      console.log(
        `Loading variant details for first variant ${firstVariant}...`,
      );

      // Показываем индикатор загрузки
      setLoadingVariants((prev) => new Set(prev).add(firstVariant));

      const variantDetails = await loadVariantDetails(firstVariant);

      // Убираем индикатор загрузки
      setLoadingVariants((prev) => {
        const newSet = new Set(prev);
        newSet.delete(firstVariant);
        return newSet;
      });

      // Добавляем продукт с первым вариантом и деталями
      const newChildProduct: ChildProduct = {
        productId: product.id,
        variantId: firstVariant,
        variantDetails: variantDetails || undefined,
      };

      if (isMultiSelect) {
        onSelectionChange([...selectedProducts, newChildProduct]);
      } else {
        onSelectionChange([newChildProduct]);
      }
    }
  };

  // Функция для загрузки деталей варианта
  const loadVariantDetails = async (
    variantId: string,
  ): Promise<VariantDetails | null> => {
    try {
      const response = await fetch(
        `/api/variant-details?variantId=${encodeURIComponent(variantId)}`,
      );
      const data = await response.json();

      if (data.success && data.details) {
        // console.log(`Loaded variant details for ${variantId}:`, data.details);
        return data.details;
      } else {
        // Проверяем, является ли ошибка связанной с разрешениями
        if (data.error && data.error.includes("Access denied")) {
          console.warn(
            `❌ Permission error for ${variantId}: ${data.error}\n` +
              `🔧 Please update app permissions in Shopify Admin:\n` +
              `   1. Go to Apps → App and sales channel settings\n` +
              `   2. Find "rebuy-app" → Manage private app\n` +
              `   3. Add scopes: read_inventory, read_locations\n` +
              `   4. Save and restart the app`,
          );
        } else {
          console.warn(
            `Failed to load variant details for ${variantId}:`,
            data.error,
          );
        }
        // Не выбрасываем ошибку, просто возвращаем null
        // Это позволяет продолжить работу без деталей
        return null;
      }
    } catch (error) {
      console.warn(`Error loading variant details for ${variantId}:`, error);
      // Не выбрасываем ошибку, просто возвращаем null
      return null;
    }
  };

  // Функция для обработки выбора варианта
  const handleVariantSelect = async (productId: string, variantId: string) => {
    const isVariantCurrentlySelected = isVariantSelected(productId, variantId);
    const selectedVariants = getSelectedVariants(productId);

    if (isVariantCurrentlySelected) {
      // Если это единственный выбранный вариант - не даем его отменить
      if (selectedVariants.length === 1) {
        return; // Нельзя отменить последний вариант
      }

      // Удаляем вариант
      const newSelection = selectedProducts.filter(
        (cp) => !(cp.productId === productId && cp.variantId === variantId),
      );
      onSelectionChange(newSelection);
    } else {
      // Загружаем детали варианта
      // console.log(`Loading variant details for ${variantId}...`);

      // Показываем индикатор загрузки
      setLoadingVariants((prev) => new Set(prev).add(variantId));

      const variantDetails = await loadVariantDetails(variantId);

      // Убираем индикатор загрузки
      setLoadingVariants((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variantId);
        return newSet;
      });

      // Добавляем вариант с деталями
      const newChildProduct: ChildProduct = {
        productId,
        variantId,
        variantDetails: variantDetails || undefined,
      };
      onSelectionChange([...selectedProducts, newChildProduct]);
    }
  };

  // Функция для переключения развернутости продукта
  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  // Фильтрация продуктов по поисковому запросу
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <BlockStack gap="300">
      <TextField
        label=""
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={placeholder}
        prefix="🔍"
        autoComplete="off"
      />

      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #e1e3e5",
          borderRadius: "4px",
          padding: "8px",
        }}
      >
        <BlockStack gap="200">
          {filteredProducts.map((product) => {
            const isSelected = isProductSelected(product.id);
            const selectedVariants = getSelectedVariants(product.id);
            const hasVariants = product.variants && product.variants.length > 0;
            const isExpanded = expandedProducts.has(product.id);

            return (
              <Card
                key={product.id}
                background={isSelected ? "bg-surface-selected" : undefined}
              >
                <BlockStack gap="200">
                  {/* Основная информация о продукте */}
                  <InlineStack
                    gap="300"
                    align="space-between"
                    blockAlign="center"
                  >
                    <InlineStack gap="200" align="start">
                      {isMultiSelect && (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleProductSelect(product)}
                          label=""
                        />
                      )}

                      {product.image && (
                        <Thumbnail
                          source={product.image}
                          alt={product.title}
                          size="small"
                        />
                      )}

                      <BlockStack gap="100">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {product.title}
                        </Text>
                        {hasVariants && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {product.variants!.length} вариантов
                          </Text>
                        )}
                      </BlockStack>
                    </InlineStack>

                    {!isMultiSelect && (
                      <Button
                        variant={isSelected ? "primary" : "secondary"}
                        size="slim"
                        onClick={() => handleProductSelect(product)}
                        disabled={!hasVariants}
                      >
                        {isSelected ? "Выбран" : "Выбрать"}
                      </Button>
                    )}
                  </InlineStack>

                  {/* Варианты продукта */}
                  {isSelected && hasVariants && (
                    <Card background="bg-surface-secondary">
                      <BlockStack gap="200">
                        <InlineStack
                          gap="200"
                          align="space-between"
                          blockAlign="center"
                        >
                          <Text as="p" variant="bodySm" fontWeight="medium">
                            Выберите варианты:
                          </Text>
                          <Button
                            variant="tertiary"
                            size="slim"
                            onClick={() => toggleProductExpansion(product.id)}
                          >
                            {isExpanded ? "Скрыть" : "Показать все"}
                          </Button>
                        </InlineStack>

                        {isExpanded && (
                          <BlockStack gap="150">
                            {product.variants!.map((variant) => {
                              const isVariantSelected =
                                selectedVariants.includes(variant.id);
                              const isOnlyVariant =
                                selectedVariants.length === 1;
                              const selectedChildProduct =
                                selectedProducts.find(
                                  (cp) =>
                                    cp.productId === product.id &&
                                    cp.variantId === variant.id,
                                );

                              return (
                                <Card
                                  key={variant.id}
                                  background={
                                    isVariantSelected
                                      ? "bg-surface-selected"
                                      : undefined
                                  }
                                >
                                  <BlockStack gap="200">
                                    <InlineStack
                                      gap="200"
                                      align="space-between"
                                      blockAlign="center"
                                    >
                                      <InlineStack gap="200" align="start">
                                        {variant.image && (
                                          <Thumbnail
                                            source={variant.image.url}
                                            alt={variant.title}
                                            size="extraSmall"
                                          />
                                        )}

                                        <BlockStack gap="100">
                                          <Text
                                            as="p"
                                            variant="bodySm"
                                            fontWeight="medium"
                                          >
                                            {variant.title}
                                          </Text>

                                          <InlineStack gap="200" align="start">
                                            <Text
                                              as="p"
                                              variant="bodySm"
                                              tone="subdued"
                                            >
                                              {variant.price}
                                            </Text>

                                            {variant.compareAtPrice && (
                                              <Text
                                                as="p"
                                                variant="bodySm"
                                                tone="critical"
                                              >
                                                Было: {variant.compareAtPrice}
                                              </Text>
                                            )}
                                          </InlineStack>
                                        </BlockStack>
                                      </InlineStack>

                                      <InlineStack gap="200" align="center">
                                        <Badge
                                          tone={
                                            variant.availableForSale
                                              ? "success"
                                              : "critical"
                                          }
                                          size="small"
                                        >
                                          {variant.availableForSale
                                            ? "В наличии"
                                            : "Нет в наличии"}
                                        </Badge>

                                        <Checkbox
                                          checked={isVariantSelected}
                                          onChange={() =>
                                            handleVariantSelect(
                                              product.id,
                                              variant.id,
                                            )
                                          }
                                          disabled={
                                            (isVariantSelected &&
                                              isOnlyVariant) ||
                                            loadingVariants.has(variant.id)
                                          }
                                          label=""
                                        />

                                        {loadingVariants.has(variant.id) && (
                                          <Text
                                            as="p"
                                            variant="bodySm"
                                            tone="subdued"
                                          >
                                            Загрузка...
                                          </Text>
                                        )}
                                      </InlineStack>
                                    </InlineStack>

                                    {/* Отображение деталей варианта */}
                                    {isVariantSelected &&
                                      selectedChildProduct?.variantDetails && (
                                        <Card background="bg-surface-tertiary">
                                          <BlockStack gap="150">
                                            <Text
                                              as="p"
                                              variant="bodySm"
                                              fontWeight="medium"
                                            >
                                              Детали инвентаря:
                                            </Text>

                                            <InlineStack
                                              gap="300"
                                              align="start"
                                            >
                                              <Text
                                                as="p"
                                                variant="bodySm"
                                                tone="subdued"
                                              >
                                                Общее количество:{" "}
                                                {
                                                  selectedChildProduct
                                                    .variantDetails
                                                    .inventoryQuantity
                                                }
                                              </Text>
                                              <Text
                                                as="p"
                                                variant="bodySm"
                                                tone="subdued"
                                              >
                                                Политика:{" "}
                                                {
                                                  selectedChildProduct
                                                    .variantDetails
                                                    .inventoryPolicy
                                                }
                                              </Text>
                                            </InlineStack>

                                            {selectedChildProduct.variantDetails
                                              .inventoryItem.inventoryLevels
                                              .edges.length > 0 && (
                                              <BlockStack gap="100">
                                                <Text
                                                  as="p"
                                                  variant="bodySm"
                                                  fontWeight="medium"
                                                >
                                                  Локации:
                                                </Text>
                                                {selectedChildProduct.variantDetails.inventoryItem.inventoryLevels.edges.map(
                                                  (edge, index) => (
                                                    <Text
                                                      key={index}
                                                      as="p"
                                                      variant="bodySm"
                                                      tone="subdued"
                                                    >
                                                      {edge.node.location.name}{" "}
                                                      (
                                                      {
                                                        edge.node.location
                                                          .address.countryCode
                                                      }
                                                      ):{" "}
                                                      {edge.node.location.inventoryLevels.nodes
                                                        .map(
                                                          (node) =>
                                                            node.quantities[0]
                                                              ?.quantity || 0,
                                                        )
                                                        .reduce(
                                                          (sum, qty) =>
                                                            sum + qty,
                                                          0,
                                                        )}{" "}
                                                      шт.
                                                    </Text>
                                                  ),
                                                )}
                                              </BlockStack>
                                            )}
                                          </BlockStack>
                                        </Card>
                                      )}
                                  </BlockStack>
                                </Card>
                              );
                            })}
                          </BlockStack>
                        )}
                      </BlockStack>
                    </Card>
                  )}
                </BlockStack>
              </Card>
            );
          })}

          {filteredProducts.length === 0 && (
            <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
              No products found
            </Text>
          )}
        </BlockStack>
      </div>
    </BlockStack>
  );
}
