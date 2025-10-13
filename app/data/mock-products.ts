export interface Product {
  id: string;
  title: string;
  description: string;
  image?: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    title: "WunderBox 1-3 years old - developmental boxing for toddlers",
    description:
      "5in1 Montessori Climbing Set: Triangle Ladder + Arch/ Rocker + Slide Board/Ramp + Netting rope + Cushion",
    image: "https://cdn.shopify.com/s/files/1/0000/0000/products/wunderbox.jpg",
  },
  {
    id: "2",
    title: "Montessori Triangle Ladder",
    description:
      "Wooden climbing triangle for toddlers, promotes motor skills and balance development",
    image: "https://cdn.shopify.com/s/files/1/0000/0000/products/triangle.jpg",
  },
  {
    id: "3",
    title: "Arch Rocker Climbing Set",
    description:
      "Multi-functional arch rocker that can be used as climbing arch or rocking toy",
    image: "https://cdn.shopify.com/s/files/1/0000/0000/products/arch.jpg",
  },
  {
    id: "4",
    title: "Slide Board Ramp",
    description:
      "Adjustable slide board that transforms any climbing set into a slide",
    image: "https://cdn.shopify.com/s/files/1/0000/0000/products/slide.jpg",
  },
  {
    id: "5",
    title: "Swedish Wall Climbing Set",
    description:
      "Wooden Swedish wall with multiple climbing grips and handholds",
    image: "https://cdn.shopify.com/s/files/1/0000/0000/products/wall.jpg",
  },
  {
    id: "6",
    title: "Netting Rope Climbing Net",
    description:
      "Durable climbing net for developing coordination and strength",
    image: "https://cdn.shopify.com/s/files/1/0000/0000/products/net.jpg",
  },
  {
    id: "7",
    title: "Safety Cushion Mat",
    description: "Soft landing mat for safe climbing and playing",
    image: "https://cdn.shopify.com/s/files/1/0000/0000/products/cushion.jpg",
  },
];
