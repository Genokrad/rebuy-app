export const GET_VARIANT_DETAILS_QUERY = `
  query getVariantDetails($id: ID!) {
    productVariant(id: $id) {
      inventoryQuantity
      availableForSale
      inventoryPolicy
      id
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
  inventoryItem: VariantInventoryItem;
}

export interface VariantDetailsResponse {
  productVariant: VariantDetails;
}
