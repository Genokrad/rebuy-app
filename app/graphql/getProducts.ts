export const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
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
  image?: ProductImage;
}

export interface ProductsResponse {
  products: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        images: {
          edges: Array<{
            node: ProductImage;
          }>;
        };
      };
    }>;
  };
}
