-- CreateTable
CREATE TABLE "WidgetProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "widgetId" TEXT NOT NULL,
    "parentProductId" TEXT NOT NULL,
    "order" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WidgetProduct_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "Widget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WidgetChildProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "widgetProductId" TEXT NOT NULL,
    "childProductId" TEXT NOT NULL,
    "order" INTEGER,
    CONSTRAINT "WidgetChildProduct_widgetProductId_fkey" FOREIGN KEY ("widgetProductId") REFERENCES "WidgetProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WidgetChildProduct_childProductId_fkey" FOREIGN KEY ("childProductId") REFERENCES "ChildProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChildProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VariantDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childProductId" TEXT NOT NULL,
    "inventoryQuantity" INTEGER NOT NULL,
    "availableForSale" BOOLEAN NOT NULL,
    "inventoryPolicy" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "compareAtPrice" TEXT,
    "imageUrl" TEXT,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VariantDetails_childProductId_fkey" FOREIGN KEY ("childProductId") REFERENCES "ChildProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantDetailsId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "shipsInventory" BOOLEAN NOT NULL,
    "price" TEXT NOT NULL,
    "compareAtPrice" TEXT,
    "currencyCode" TEXT NOT NULL,
    "marketId" TEXT,
    "marketName" TEXT,
    "locale" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryLevel_variantDetailsId_fkey" FOREIGN KEY ("variantDetailsId") REFERENCES "VariantDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantDetailsId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketPrice_variantDetailsId_fkey" FOREIGN KEY ("variantDetailsId") REFERENCES "VariantDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WidgetProduct_widgetId_idx" ON "WidgetProduct"("widgetId");

-- CreateIndex
CREATE INDEX "WidgetProduct_parentProductId_idx" ON "WidgetProduct"("parentProductId");

-- CreateIndex
CREATE INDEX "WidgetChildProduct_childProductId_idx" ON "WidgetChildProduct"("childProductId");

-- CreateIndex
CREATE INDEX "WidgetChildProduct_widgetProductId_idx" ON "WidgetChildProduct"("widgetProductId");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetChildProduct_widgetProductId_childProductId_key" ON "WidgetChildProduct"("widgetProductId", "childProductId");

-- CreateIndex
CREATE INDEX "ChildProduct_productId_idx" ON "ChildProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProduct_variantId_key" ON "ChildProduct"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantDetails_childProductId_key" ON "VariantDetails"("childProductId");

-- CreateIndex
CREATE INDEX "VariantDetails_variantId_idx" ON "VariantDetails"("variantId");

-- CreateIndex
CREATE INDEX "VariantDetails_childProductId_idx" ON "VariantDetails"("childProductId");

-- CreateIndex
CREATE INDEX "InventoryLevel_countryCode_idx" ON "InventoryLevel"("countryCode");

-- CreateIndex
CREATE INDEX "InventoryLevel_marketId_idx" ON "InventoryLevel"("marketId");

-- CreateIndex
CREATE INDEX "InventoryLevel_variantDetailsId_idx" ON "InventoryLevel"("variantDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLevel_variantDetailsId_locationId_key" ON "InventoryLevel"("variantDetailsId", "locationId");

-- CreateIndex
CREATE INDEX "MarketPrice_marketId_idx" ON "MarketPrice"("marketId");

-- CreateIndex
CREATE INDEX "MarketPrice_countryCode_idx" ON "MarketPrice"("countryCode");

-- CreateIndex
CREATE INDEX "MarketPrice_variantDetailsId_idx" ON "MarketPrice"("variantDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_variantDetailsId_marketId_key" ON "MarketPrice"("variantDetailsId", "marketId");

-- CreateIndex
CREATE INDEX "Widget_shop_idx" ON "Widget"("shop");
