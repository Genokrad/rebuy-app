export interface MockProduct {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  image: string;
}

export const mockProducts: MockProduct[] = [
  {
    id: "p1",
    title: "Cross-sell product #1",
    price: "$38.95",
    compareAtPrice: "$41.00",
    image:
      "/images/widget-appearance/add-a-birthday-card-to-your-gift-5665969.webp",
  },
  {
    id: "p2",
    title: "Cross-sell product #2",
    price: "$40.85",
    compareAtPrice: "$43.00",
    image:
      "/images/widget-appearance/wunderbox-1-3-years-old-developmental-boxing-for-the-little-ones-778431.webp",
  },
  {
    id: "p3",
    title: "Cross-sell product #3",
    price: "$40.85",
    compareAtPrice: "$43.00",
    image:
      "/images/widget-appearance/wunderbox-4-7-years-old-developmental-box-for-kids-611288.webp",
  },
];
