export interface Widget {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  shop: string;
}

export interface WidgetCard {
  id: string;
  title: string;
  type: string;
  description: string;
  icon: JSX.Element;
}

