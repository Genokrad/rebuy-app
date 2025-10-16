import { authenticate } from "../shopify.server";
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
  });

  const responseJson = await response.json();

  const data = responseJson.data as ProductsResponse;

  // Преобразуем данные в нужный формат
  const products: Product[] = data.products.edges.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    status: edge.node.status,
    handle: edge.node.handle,
    image: edge.node.images.edges[0]?.node || undefined,
  }));

  console.log(`Found ${products.length} active products`);
  return products;
}
