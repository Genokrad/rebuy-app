export const GET_ORDERS_QUERY = `
  query getOrders($first: Int!, $query: String, $after: String) {
    orders(first: $first, query: $query, after: $after) {
      edges {
        node {
          id
          name
          createdAt
          currencyCode
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 250) {
            edges {
              node {
                id
                title
                variantTitle
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                originalTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                variant {
                  id
                  product {
                    id
                  }
                }
                customAttributes {
                  key
                  value
                }
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export interface OrderLineItem {
  id: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  originalUnitPrice?: string;
  discountedUnitPrice?: string;
  originalTotal?: string;
  discountedTotal?: string;
  currencyCode?: string;
  variantId?: string;
  productId?: string;
  customAttributes?: Array<{ key: string; value: string }>;
}

export interface Order {
  id: string;
  name: string;
  createdAt: string;
  currencyCode: string;
  totalPrice: string;
  subtotalPrice: string;
  totalDiscounts: string;
  totalTax: string;
  lineItems: OrderLineItem[];
}

export interface OrdersResponse {
  orders: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        createdAt: string;
        currencyCode: string;
        totalPriceSet: {
          shopMoney: {
            amount: string;
            currencyCode: string;
          };
        };
        subtotalPriceSet: {
          shopMoney: {
            amount: string;
            currencyCode: string;
          };
        };
        totalDiscountsSet: {
          shopMoney: {
            amount: string;
            currencyCode: string;
          };
        };
        totalTaxSet: {
          shopMoney: {
            amount: string;
            currencyCode: string;
          };
        };
        lineItems: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              variantTitle?: string;
              quantity: number;
              originalUnitPriceSet: {
                shopMoney: {
                  amount: string;
                  currencyCode: string;
                };
              };
              discountedUnitPriceSet: {
                shopMoney: {
                  amount: string;
                  currencyCode: string;
                };
              };
              discountedTotalSet: {
                shopMoney: {
                  amount: string;
                  currencyCode: string;
                };
              };
              originalTotalSet: {
                shopMoney: {
                  amount: string;
                  currencyCode: string;
                };
              };
              variant?: {
                id: string;
                product?: {
                  id: string;
                };
              };
              customAttributes: Array<{
                key: string;
                value: string;
              }>;
            };
          }>;
        };
      };
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}
