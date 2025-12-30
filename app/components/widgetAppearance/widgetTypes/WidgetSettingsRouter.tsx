import type { BaseWidgetSettingsProps } from "./types";
import { ProductsPageWidgetSettings } from "./products-page";
import { CartWidgetSettings } from "./CartWidgetSettings";
import { CheckoutWidgetSettings } from "./checkout";

export function WidgetSettingsRouter(props: BaseWidgetSettingsProps) {
  const { widgetType } = props;

  switch (widgetType) {
    case "products-page":
      return <ProductsPageWidgetSettings {...props} />;
    case "cart":
      return <CartWidgetSettings {...props} />;
    case "checkout":
      return <CheckoutWidgetSettings {...props} />;
    default:
      return (
        <div>
          Unknown widget type: {widgetType}. Please use one of: products-page,
          cart, checkout
        </div>
      );
  }
}
