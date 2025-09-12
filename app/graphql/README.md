# GraphQL Queries

Эта папка содержит GraphQL запросы для работы с Shopify Admin API.

## Структура

- `getProducts.ts` - GraphQL запрос для получения списка продуктов с типами
- `productsService.ts` - Сервис для выполнения запросов к API
- `index.ts` - Экспорт всех модулей

## Использование

### Получение всех продуктов

```typescript
import { getAllProducts } from "../graphql/productsService";

// В loader функции
const products = await getAllProducts(request);
```

### Структура данных продукта

```typescript
interface Product {
  id: string; // ID товара
  title: string; // Название товара
  image?: {
    // Картинка товара (опционально)
    url: string;
    altText?: string;
  };
}
```

## GraphQL запрос

Запрос получает первые 50 продуктов с их изображениями:

```graphql
query getProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
      }
    }
  }
}
```
