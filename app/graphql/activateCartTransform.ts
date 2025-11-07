export const GET_CART_TRANSFORM_FUNCTIONS_QUERY = `
  query getCartTransformFunctions {
    shopifyFunctions(apiType: "cart_transform", first: 10) {
      nodes {
        id
        title
        apiType
      }
    }
  }
`;

export const ACTIVATE_CART_TRANSFORM_MUTATION = `
  mutation cartTransformCreate($functionId: String!) {
    cartTransformCreate(functionId: $functionId) {
      cartTransform {
        id
        functionId
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export interface ActivateCartTransformResponse {
  cartTransformCreate: {
    cartTransform?: {
      id: string;
      functionId: string;
    };
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}
