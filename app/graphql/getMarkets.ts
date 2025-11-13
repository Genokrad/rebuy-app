export const GET_MARKETS_QUERY = `
  query getMarkets($first: Int!) {
    markets(first: $first) {
      edges {
        node {
          id
          name
          enabled
          primary
          regions(first: 10) {
            nodes {
              name
              ... on MarketRegionCountry {
                code
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

export interface MarketRegion {
  name: string;
  code?: string; // Only for MarketRegionCountry
}

export interface Market {
  id: string;
  name: string;
  enabled: boolean;
  primary: boolean;
  regions?: {
    nodes: MarketRegion[];
  };
}

export interface MarketsResponse {
  markets: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        enabled: boolean;
        primary: boolean;
        regions?: {
          nodes: MarketRegion[];
        };
      };
    }>;
  };
}
