export const CREATE_WIDGET_MUTATION = `
  mutation createWidget($input: WidgetCreateInput!) {
    widgetCreate(input: $input) {
      widget {
        id
        name
        type
        shop
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export interface WidgetCreateInput {
  name: string;
  type: string;
  shop: string;
}

export interface Widget {
  id: string;
  name: string;
  type: string;
  shop: string;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetCreateResponse {
  widgetCreate: {
    widget?: Widget;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}
