export type WidgetType = "products-page" | "cart" | "checkout";

// PreviewTexts используется для products-page виджета
export interface PreviewTexts {
  title?: string;
  addedText?: string;
  addText?: string;
  totalPriceLabel?: string;
  discountText?: string;
  addToCartText?: string;
  maxDiscountText?: string;
  nextDiscountText?: string;
  widgetBackgroundColor?: string;
  buttonBackgroundColor?: string;
  addedButtonBackgroundColor?: string;
}

// CheckoutTexts используется для checkout виджета
export interface CheckoutTexts {
  heading?: string;
  buttonText?: string;
  buttonVariant?: "primary" | "secondary" | "plain";
}

export interface BaseWidgetSettingsProps {
  widgetId: string;
  widgetType: WidgetType;
  settings: any;
  appearanceTexts: Record<string, PreviewTexts | CheckoutTexts>;
  availableLocales: string[];
  onSave: (
    appearanceTexts: Record<string, PreviewTexts | CheckoutTexts>,
  ) => void;
  isSaving?: boolean;
}

export interface WidgetSettingsComponent {
  (props: BaseWidgetSettingsProps): JSX.Element;
}
