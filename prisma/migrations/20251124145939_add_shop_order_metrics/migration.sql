CREATE TABLE "ShopOrderMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT,
    "currency" TEXT,
    "totalPrice" TEXT,
    "subtotalPrice" TEXT,
    "totalDiscounts" TEXT,
    "totalTax" TEXT,
    "pluginInvolved" BOOLEAN NOT NULL DEFAULT false,
    "pluginRevenue" TEXT,
    "pluginDiscountTotal" TEXT,
    "orderCreatedAt" DATETIME,
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ShopOrderLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderMetricId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "title" TEXT,
    "variantTitle" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" TEXT,
    "linePrice" TEXT,
    "discountedPrice" TEXT,
    "discountAllocations" TEXT,
    "properties" TEXT,
    "widgetId" TEXT,
    "widgetType" TEXT,
    "sellenceDiscount" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopOrderLineItem_orderMetricId_fkey"
        FOREIGN KEY ("orderMetricId") REFERENCES "ShopOrderMetric" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ShopOrderMetric_shop_orderId_key" ON "ShopOrderMetric"("shop", "orderId");
CREATE INDEX "ShopOrderMetric_shop_idx" ON "ShopOrderMetric"("shop");
CREATE INDEX "ShopOrderMetric_shop_pluginInvolved_idx" ON "ShopOrderMetric"("shop", "pluginInvolved");
CREATE INDEX "ShopOrderMetric_orderCreatedAt_idx" ON "ShopOrderMetric"("orderCreatedAt");

CREATE INDEX "ShopOrderLineItem_orderMetricId_idx" ON "ShopOrderLineItem"("orderMetricId");
CREATE INDEX "ShopOrderLineItem_sellenceDiscount_idx" ON "ShopOrderLineItem"("sellenceDiscount");

