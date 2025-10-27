export const GET_VARIANT_DETAILS_QUERY = `
  query getVariantDetails($id: ID!) {
    shop {
      currencyCode
    }
    productVariant(id: $id) {
      inventoryQuantity
      availableForSale
      inventoryPolicy
      id
      image {
        url
      }
      price
      compareAtPrice
      inventoryItem {
        inventoryLevels(first: 10) {
          edges {
            node {
              location {
                id
                name
                address {
                  country
                  countryCode
                }
                shipsInventory
                inventoryLevels(first: 10) {
                  nodes {
                    quantities(names: "available") {
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_CONTEXTUAL_PRICING_QUERY = `
  query getContextualPricing($id: ID!, $country: CountryCode!) {
    productVariant(id: $id) {
      contextualPricing(context: { country: $country }) {
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
      }
    }
  }
`;

export interface VariantInventoryLevel {
  quantity: number;
}

export interface SimplifiedInventoryLevel {
  id: string;
  name: string;
  countryCode: string;
  shipsInventory: boolean;
  quantity: number;
  price: string;
  currencyCode: string;
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
  price: string;
  compareAtPrice?: string;
  inventoryItem: VariantInventoryItem;
  inventoryLevels: SimplifiedInventoryLevel[];
}

export interface VariantDetailsResponse {
  productVariant: VariantDetails;
}
