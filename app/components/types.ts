export interface ProductRelationship {
  parentProduct: string | string[]; // productId or array of productIds (for multiple parent products with same children)
  childProducts: ChildProduct[]; // array of child products with variants
}

export interface SimplifiedInventoryLevel {
  id: string;
  name: string;
  countryCode: string;
  shipsInventory: boolean;
  quantity: number;
  price: string;
  compareAtPrice: string | null;
  currencyCode: string;
}

export interface VariantInventoryLevel {
  quantity: number;
}

export interface VariantLocation {
  id: string;
  name: string;
  address: {
    country: string;
    countryCode: string;
  };
  shipsInventory: boolean;
}

export interface VariantInventoryItem {
  inventoryLevels: {
    edges: Array<{
      node: {
        quantities: Array<{
          quantity: number;
        }>;
        location: VariantLocation;
      };
    }>;
  };
}

export interface MarketPrice {
  marketId: string; // ID маркета
  marketName: string; // название маркета
  countryCode: string; // код страны (например, "SK", "US", "AU")
  price: string; // цена
  compareAtPrice?: string | null; // старая цена (compare at price)
  currencyCode: string; // код валюты (например, "EUR", "USD", "AUD")
}

export interface VariantDetails {
  inventoryQuantity: number;
  availableForSale: boolean;
  inventoryPolicy: string;
  id: string;
  title: string;
  image: {
    url: string;
  } | null;
  price: string;
  compareAtPrice?: string;
  product: {
    id: string;
    title: string;
    handle?: string;
    featuredImage: {
      url: string;
    } | null;
  };
  inventoryItem: VariantInventoryItem;
  inventoryLevels: SimplifiedInventoryLevel[];
  marketsPrice?: MarketPrice[]; // массив цен для всех маркетов
}

export interface ChildProduct {
  productId: string;
  variantId: string; // always required - default to first variant
  variantDetails?: VariantDetails; // optional variant details
}

export interface Widget {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  shop: string;
  products?: ProductRelationship[];
}

export interface WidgetCard {
  id: string;
  title: string;
  type: string;
  description: string;
  icon: JSX.Element;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  image?: {
    altText: string;
    url: string;
  };
  description?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  availableForSale: boolean;
  image?: {
    url: string;
    altText?: string;
  };
}

export interface Product {
  id: string;
  title: string;
  description: string;
  image?: string;
  handle: string;
  status: string;
  variants: ProductVariant[];
}
