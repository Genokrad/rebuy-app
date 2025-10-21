export interface ProductRelationship {
  parentProduct: string; // productId
  childProducts: ChildProduct[]; // array of child products with variants
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
  inventoryLevels: {
    nodes: Array<{
      quantities: VariantInventoryLevel[];
    }>;
  };
}

export interface VariantInventoryItem {
  inventoryLevels: {
    edges: Array<{
      node: {
        location: VariantLocation;
      };
    }>;
  };
}

export interface VariantDetails {
  inventoryQuantity: number;
  availableForSale: boolean;
  inventoryPolicy: string;
  id: string;
  image: {
    url: string;
  } | null;
  inventoryItem: VariantInventoryItem;
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
