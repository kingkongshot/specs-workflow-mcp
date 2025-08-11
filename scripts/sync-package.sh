#!/bin/bash

# Sync package directory with main project files
# This script ensures the package directory contains the latest files for npm publishing

set -e

echo "🔄 Syncing package directory..."

# Copy OpenAPI specification
echo "📋 Copying OpenAPI specification..."
cp api/spec-workflow.openapi.yaml package/api/spec-workflow.openapi.yaml

# Copy built files
echo "🏗️ Copying built files..."
if [ -d "dist" ]; then
    rm -rf package/dist
    cp -r dist package/dist
else
    echo "⚠️ Warning: dist directory not found. Run 'npm run build' first."
fi

# Sync version from main package.json
echo "🔢 Syncing version number..."
MAIN_VERSION=$(node -p "require('./package.json').version")
node -e "
const pkg = require('./package/package.json');
pkg.version = '$MAIN_VERSION';
require('fs').writeFileSync('./package/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "✅ Package directory synced successfully!"
echo "📦 Version: $MAIN_VERSION"
echo ""
echo "To publish to npm:"
echo "  cd package"
echo "  npm publish"
