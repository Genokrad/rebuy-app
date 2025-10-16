export const GET_MARKETS_QUERY = `
  query getMarkets($first: Int!) {
    markets(first: $first) {
      edges {
        node {
          id
          name
          enabled
          primary
          conditions {
            conditionTypes
            regionsCondition {
              regions(first: 10) {
                nodes {
                  __typename
                  ... on MarketRegionCountry {
                    id
                    name
                    code
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

// Fallback query without conditions for stores that don't support it
export const GET_MARKETS_QUERY_BASE = `
  query getMarkets($first: Int!) {
    markets(first: $first) {
      edges {
        node {
          id
          name
          enabled
          primary
        }
      }
    }
  }
`;

export interface MarketConditions {
  conditionTypes: string[];
  regionsCondition: {
    regions: {
      nodes: Array<{
        __typename: string;
        id: string;
        name: string;
        code: string;
      }>;
    };
  };
}

export interface Market {
  id: string;
  name: string;
  enabled: boolean;
  primary: boolean;
  conditions?: MarketConditions; // Optional for stores that don't support it
}

export interface MarketsResponse {
  markets: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        enabled: boolean;
        primary: boolean;
        conditions?: MarketConditions; // Optional for stores that don't support it
      };
    }>;
  };
}
