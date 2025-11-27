CREATE TABLE "WidgetClickEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "WidgetClickEvent_shop_idx" ON "WidgetClickEvent"("shop");
CREATE INDEX "WidgetClickEvent_widgetId_idx" ON "WidgetClickEvent"("widgetId");
CREATE INDEX "WidgetClickEvent_widgetType_idx" ON "WidgetClickEvent"("widgetType");

