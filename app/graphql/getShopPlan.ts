export const GET_SHOP_PLAN_QUERY = `
  query getShopPlan {
    shop {
      plan {
        displayName
        partnerDevelopment
      }
      myshopifyDomain
    }
  }
`;

export interface ShopPlanResponse {
  shop: {
    plan: {
      displayName: string;
      partnerDevelopment: boolean;
    };
    myshopifyDomain: string;
  };
}
