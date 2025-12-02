-- Add warehouses column to MarketPrice table
ALTER TABLE "MarketPrice" ADD COLUMN "warehouses" TEXT;

-- Create MarketWarehouse table
CREATE TABLE "MarketWarehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "marketName" TEXT,
    "warehouses" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "MarketWarehouse_shop_marketId_key" ON "MarketWarehouse"("shop", "marketId");
CREATE INDEX "MarketWarehouse_shop_idx" ON "MarketWarehouse"("shop");
CREATE INDEX "MarketWarehouse_marketId_idx" ON "MarketWarehouse"("marketId");

