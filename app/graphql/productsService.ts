import { authenticate } from "../shopify.server";
import { ApiVersion } from "@shopify/shopify-api";
import {
  GET_PRODUCTS_QUERY,
  type Product,
  type ProductsResponse,
} from "./getProducts";

export async function getAllProducts(request: Request): Promise<Product[]> {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(GET_PRODUCTS_QUERY, {
    variables: {
      first: 150, // Получаем первые 150 продуктов
      query: "status:active", // Фильтруем только активные продукты
    },
    apiVersion: ApiVersion.January25,
  });

  const responseJson = await response.json();

  // console.log("=== PRODUCTS SERVICE DEBUG ===");
  // console.log("Raw GraphQL response:", JSON.stringify(responseJson, null, 2));

  const data = responseJson.data as ProductsResponse;

  // Преобразуем данные в нужный формат
  const products: Product[] = data.products.edges.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    status: edge.node.status,
    handle: edge.node.handle,
    image: edge.node.images.edges[0]?.node?.url || undefined,
    variants: edge.node.variants.edges.map((variant) => ({
      id: variant.node.id,
      title: variant.node.title,
      price: variant.node.price,
      compareAtPrice: variant.node.compareAtPrice,
      availableForSale: variant.node.availableForSale,
      image: variant.node.image || undefined,
    })),
  })) as Product[];

  // console.log(`Found ${products.length} active products`);
  // console.log(
  //   "First product with variants:",
  //   JSON.stringify(products[0], null, 2),
  // );
  return products;
}
