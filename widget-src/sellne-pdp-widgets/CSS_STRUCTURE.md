# Структура CSS для виджетов

## Подход: CSS Modules

Используем **CSS Modules** для изоляции стилей каждого компонента и виджета.

## Структура файлов

```
src/
├── styles/
│   └── global.css          # Глобальные стили (минимально)
├── components/
│   ├── ProductCard.tsx
│   └── ProductCard.module.css  # Стили только для ProductCard
├── widgets/                # Если будет несколько виджетов
│   ├── ProductWidget/
│   │   ├── ProductWidget.tsx
│   │   └── ProductWidget.module.css
│   └── CartWidget/
│       ├── CartWidget.tsx
│       └── CartWidget.module.css
├── App.tsx
└── App.module.css          # Стили для основного контейнера
```

## Преимущества

1. **Автоматическая изоляция** - классы автоматически получают уникальные имена
2. **Разделение по компонентам** - каждый компонент имеет свои стили
3. **TypeScript поддержка** - автодополнение классов
4. **Минимальный размер** - нет runtime зависимостей
5. **Не конфликтует** с CSS сайта, где встраивается виджет

## Использование

```tsx
// ProductCard.tsx
import styles from "./ProductCard.module.css";

export function ProductCard() {
  return <div className={styles.product}>...</div>;
}
```

## Если нужно несколько виджетов

Создайте отдельные папки для каждого виджета:

```
src/
├── widgets/
│   ├── product-widget/
│   │   ├── ProductWidget.tsx
│   │   ├── ProductWidget.module.css
│   │   └── components/
│   │       └── ProductCard.module.css
│   └── cart-widget/
│       ├── CartWidget.tsx
│       └── CartWidget.module.css
```

Каждый виджет будет иметь свои изолированные стили!

