#!/bin/bash

echo "🚀 Starting deployment process..."
echo ""

# Check if shopify CLI is available
if ! command -v shopify &> /dev/null; then
    echo "❌ Shopify CLI not found. Please install it first."
    exit 1
fi

echo "✅ Shopify CLI found"
echo ""

# Deploy the app
echo "📦 Deploying app and extensions..."
shopify app deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check the app in Shopify admin"
echo "2. Verify the Cart Transform Function is active"
echo "3. Test adding products with discounts to cart"
echo "4. Check that discounts are applied automatically"

