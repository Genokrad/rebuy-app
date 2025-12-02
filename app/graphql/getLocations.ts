export const GET_LOCATIONS_QUERY = `
  query getLocations($first: Int!) {
    locations(first: $first) {
      edges {
        node {
            id
            name
            address {
                formatted
                country
                countryCode
            }
        }
      }
    }
  }
`;

export interface LocationAddress {
  formatted: string[];
  country: string;
  countryCode: string;
}

export interface Location {
  id: string;
  name: string;
  address: LocationAddress;
}

export interface LocationsResponse {
  locations: {
    edges: Array<{
      node: Location;
    }>;
  };
}
