# Пример структуры для нескольких виджетов

Если вам нужно создать несколько разных виджетов, используйте такую структуру:

```
src/
├── widgets/
│   ├── product-widget/          # Виджет продуктов
│   │   ├── ProductWidget.tsx
│   │   ├── ProductWidget.module.css
│   │   └── components/
│   │       ├── ProductCard.tsx
│   │       └── ProductCard.module.css
│   │
│   ├── cart-widget/             # Виджет корзины
│   │   ├── CartWidget.tsx
│   │   ├── CartWidget.module.css
│   │   └── components/
│   │       ├── CartItem.tsx
│   │       └── CartItem.module.css
│   │
│   └── recommendation-widget/   # Виджет рекомендаций
│       ├── RecommendationWidget.tsx
│       └── RecommendationWidget.module.css
│
└── App.tsx                       # Главный компонент, который выбирает виджет
```

## Преимущества такой структуры:

1. **Изоляция** - каждый виджет имеет свои стили
2. **Масштабируемость** - легко добавлять новые виджеты
3. **Переиспользование** - общие компоненты можно вынести в `src/components/`
4. **Небольшой размер бандла** - если виджет не используется, его стили не попадут в бандл

## Пример использования:

```tsx
// App.tsx
import { ProductWidget } from "./widgets/product-widget/ProductWidget";
import { CartWidget } from "./widgets/cart-widget/CartWidget";

function App({ blockId, widgetType }: AppProps) {
  switch (widgetType) {
    case "product":
      return <ProductWidget blockId={blockId} />;
    case "cart":
      return <CartWidget blockId={blockId} />;
    default:
      return <ProductWidget blockId={blockId} />;
  }
}
```
