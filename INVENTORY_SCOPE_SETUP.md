# Настройка доступа к инвентарю

## Проблема

При попытке загрузить детали вариантов продуктов возникают ошибки:

```
Access denied for inventoryLevels field. Required access: `read_inventory` access scope.
Access denied for name field. Required access: `read_locations` access scope or `read_markets_home` access scope.
```

## Решение

### 1. Обновлен файл конфигурации

В файле `shopify.app.toml` добавлены scopes `read_inventory` и `read_locations`:

```toml
[access_scopes]
scopes = "write_products,read_markets,write_markets,read_inventory,read_locations,read_cart_transforms,write_cart_transforms"
```

### 2. Необходимые действия

1. **Перезапустите приложение:**

   ```bash
   npm run dev
   ```

2. **Переустановите приложение в Shopify Admin:**
   - Перейдите в Shopify Admin
   - Удалите текущее приложение
   - Установите заново - Shopify запросит новые разрешения

3. **Альтернативно - обновите разрешения:**
   - В Shopify Admin перейдите в Apps
   - Найдите ваше приложение
   - Нажмите "Update permissions" или "Manage permissions"
   - Подтвердите новые разрешения

### 3. Проверка работы

После обновления разрешений:

- Выберите продукт с вариантами
- Должны загрузиться детали инвентаря
- В консоли не должно быть ошибок доступа

### 4. Fallback поведение

Если детали инвентаря не загружаются:

- Приложение продолжает работать
- Варианты выбираются без деталей
- В интерфейсе отображается только базовая информация

## Технические детали

### Добавленные scopes:

- `read_inventory` - доступ к информации об инвентаре
- `read_locations` - доступ к информации о локациях

### Новые API endpoints:

- `/api/variant-details` - получение деталей варианта

### Новые GraphQL запросы:

- `getVariantDetails` - запрос деталей варианта с инвентарем
