export const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          status
          handle
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export interface ProductImage {
  url: string;
  altText?: string;
}

export interface Product {
  id: string;
  title: string;
  status: string;
  handle: string;
  image?: ProductImage;
}

export interface ProductsResponse {
  products: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        status: string;
        handle: string;
        images: {
          edges: Array<{
            node: ProductImage;
          }>;
        };
      };
    }>;
  };
}
