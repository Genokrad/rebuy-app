# Sellne PDP Widgets - React Project

React проект для виджетов на странице продукта (PDP - Product Detail Page).

## Структура

```
widget-src/sellne-pdp-widgets/
├── src/
│   ├── App.tsx           # Главный компонент
│   ├── main.tsx          # Entry point (рендерит в #for-react-render)
│   └── ...
├── vite.config.ts        # Собирает в extensions/sellence-widget/assets/
└── package.json
```

## Установка

```bash
cd widget-src/sellne-pdp-widgets
npm install
```

## Разработка

```bash
# Режим разработки с watch (автоматическая пересборка при изменениях)
npm run dev

# Одноразовая сборка
npm run build
```

## Как это работает

1. **Разработка**: Пишешь React компоненты в `src/`
2. **Сборка**: `npm run build` собирает все в `extensions/sellence-widget/assets/pdp-widgets-bundle.js`
3. **Рендеринг**: Bundle автоматически рендерится в `<div id="for-react-render"></div>` в liquid файле

## Где рендерится

React приложение рендерится в контейнер с `id="for-react-render"` в файле:

- `extensions/sellence-widget/blocks/sellence-widget.liquid` (строка 366)

## Важно

- Исходники находятся в `widget-src/` (вне extensions, так как Shopify не разрешает `src/` в theme extensions)
- Собранный bundle попадает в `extensions/sellence-widget/assets/pdp-widgets-bundle.js`
- Bundle автоматически инициализируется при загрузке страницы
- При сохранении файлов в `src/` запусти `npm run dev` для автоматической пересборки
