export interface ProductRelationship {
  parentProduct: string; // productId
  childProducts: string[]; // array of productIds
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

export interface Product {
  id: string;
  title: string;
  description: string;
  image?: string;
}
