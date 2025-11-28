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
          variants(first: 100) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                availableForSale
                image {
                  url
                  altText
                }
                selectedOptions {
                  name
                  value
                }
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

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  availableForSale: boolean;
  image?: ProductImage;
  selectedOptions: SelectedOption[];
}

export interface Product {
  id: string;
  title: string;
  status: string;
  handle: string;
  image?: ProductImage;
  variants: ProductVariant[];
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
        variants: {
          edges: Array<{
            node: ProductVariant & {
              selectedOptions: SelectedOption[];
            };
          }>;
        };
      };
    }>;
  };
}
