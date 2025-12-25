/**
 * Централизованный файл с типами и интерфейсами для виджета
 * Все типы организованы в логичной последовательности
 */

// ============================================================================
// Базовые типы данных (Variant, Product)
// ============================================================================

/**
 * Детали варианта товара
 */
export interface VariantDetails {
  id?: string;
  availableForSale?: boolean;
  title?: string;
  price?: string;
  compareAtPrice?: string | null;
  currencyCode?: string;
  inventoryPolicy?: string;
  inventoryQuantity?: number;
  image?: {
    url: string;
  };
  product?: {
    id: string;
    title: string;
    handle?: string;
    featuredImage?: {
      url: string;
    };
  };
  inventoryLevels?: Array<{
    id: string;
    name?: string;
    countryCode: string;
    currencyCode: string;
    price: string;
    compareAtPrice?: string | null;
    quantity: number;
    shipsInventory?: boolean;
  }>;
  marketsPrice?: Array<{
    marketId: string;
    marketName: string;
    countryCode: string;
    price: string;
    compareAtPrice?: string | null;
    currencyCode?: string;
    warehouses?: string[];
  }>;
  selectedOptions?: Array<{
    name: string;
    value: string;
  }>;
  inventoryItem?: unknown;
}

/**
 * Вариант товара из API
 */
export interface Variant {
  productId: string;
  variantId: string;
  variantDetails?: VariantDetails;
}

/**
 * Вариант товара в структуре Product
 */
export interface ProductVariant {
  variantId: string;
  variantDetails: VariantDetails | undefined;
  selectedOptions?:
    | Array<{
        name: string;
        value: string;
      }>
    | undefined;
}

/**
 * Продукт с вариантами
 */
export interface Product {
  productId: string;
  productTitle: string;
  variants: Array<ProductVariant>;
}

// ============================================================================
// Типы конфигурации виджета
// ============================================================================

/**
 * Конфигурация виджета из window.SELLENCE_WIDGET_CONFIGS
 */
export interface WidgetConfig {
  widgetId: string;
  appUrl: string;
  currentProductId: string;
  currentMarketplace: string;
  shopId?: string | null;
  sellenceWidgetId?: string;
  shop?: string;
  widgetType?: string;
  locale?: string;
}

/**
 * Конфигурация виджета из Liquid (сырой формат)
 */
export interface RawWidgetConfig {
  widgetId: string;
  appUrl: string;
  productId: string;
  marketplace: string;
  containerId: string;
  shopId?: string | null;
  sellenceWidgetId?: string;
  shop?: string;
  widgetType?: string;
  locale?: string;
}

/**
 * Глобальный объект конфигураций виджетов
 */
export interface SellenceWidgetConfigs {
  [blockId: string]: RawWidgetConfig;
}

// Расширяем Window для поддержки SELLENCE_WIDGET_CONFIGS
declare global {
  interface Window {
    SELLENCE_WIDGET_CONFIGS?: SellenceWidgetConfigs;
  }
}

// ============================================================================
// Типы для опций вариантов
// ============================================================================

/**
 * Интерфейс для опции варианта (например, Color или Cushion)
 * Используется в селекторах вариантов
 */
export interface VariantOption {
  value: string;
  variant: ProductVariant;
  imageUrl: string;
}

// ============================================================================
// Типы компонентов
// ============================================================================

/**
 * Props для компонента ProductCard
 */
export interface ProductCardProps {
  product: Product;
  currentMarketplace?: string;
  shopId?: string | null;
  discount?: number;
  productIndex: number;
  onToggle?: (isAdded: boolean) => void;
  onSelectNewVariant?: (
    variant: ProductVariant | null,
    productIndex: number,
  ) => void;
  onChangingTheOption?: (
    variant: ProductVariant | null,
    productIndex: number,
    newIsAdded: boolean,
  ) => void;
  addText?: string;
  addedText?: string;
  buttonBackgroundColor?: string;
  addedButtonBackgroundColor?: string;
}

/**
 * Props для компонента ProductPrice
 */
export interface ProductPriceProps {
  price: string;
  compareAtPrice?: string | null;
  currencyCode?: string;
  discount?: number;
}

/**
 * Props для компонента VariantSelector
 */
export interface VariantSelectorProps {
  optionName: string;
  optionValues: Array<VariantOption>;
  selectedValue: string | null;
  onSelect: (value: string) => void;
  productId: string;
}

/**
 * Props для компонента App
 */
export interface AppProps {
  blockId: string;
}

// ============================================================================
// Типы для хуков
// ============================================================================

/**
 * Настройки виджета
 */
export interface WidgetSettings {
  discounts?: Array<Record<string, number>>;
  placements?: string[];
  slideCount?: number;
  title?: string;
  applyDiscountToEntireOrder?: boolean;
  appearanceTexts?: Record<
    string,
    {
      title?: string;
      addedText?: string;
      addText?: string;
      totalPriceLabel?: string;
      discountText?: string;
      addToCartText?: string;
      maxDiscountText?: string;
      nextDiscountText?: string;
      widgetBackgroundColor?: string;
      buttonBackgroundColor?: string;
      addedButtonBackgroundColor?: string;
    }
  >;
}

/**
 * Результат работы хука useWidgetData
 */
export interface UseWidgetDataResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  settings: WidgetSettings | null;
  currentMarketplace: string;
  shopId: string | null;
  widgetId: string;
  appUrl: string;
  currentProductId: string;
  sellenceWidgetId?: string;
  shop?: string;
  widgetType?: string;
  locale?: string;
}
