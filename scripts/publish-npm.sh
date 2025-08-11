#!/bin/bash

# Publish package to npm
# This script builds the project, generates the package, and publishes to npm

set -e

echo "🚀 Publishing to npm..."

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Error: Not logged in to npm"
    echo "Please run: npm login"
    exit 1
fi

# Build the project (this will also generate the package directory)
echo "🏗️ Building project..."
npm run build

# Verify package directory exists
if [ ! -d "package" ]; then
    echo "❌ Error: Package directory not found"
    echo "Build process may have failed"
    exit 1
fi

# Check if package already exists on npm
PACKAGE_NAME=$(node -p "require('./package/package.json').name")
PACKAGE_VERSION=$(node -p "require('./package/package.json').version")

echo "📦 Package: $PACKAGE_NAME@$PACKAGE_VERSION"

# Check if this version already exists
if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version > /dev/null 2>&1; then
    echo "⚠️ Warning: Version $PACKAGE_VERSION already exists on npm"
    echo "Please update the version in package.json and try again"
    exit 1
fi

# Publish to npm
echo "📤 Publishing to npm..."
cd package

# Dry run first to check for issues
echo "🔍 Running dry-run..."
npm publish --dry-run

# Ask for confirmation
echo ""
read -p "🤔 Proceed with publishing $PACKAGE_NAME@$PACKAGE_VERSION? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Actual publish
    npm publish
    
    echo ""
    echo "✅ Successfully published $PACKAGE_NAME@$PACKAGE_VERSION!"
    echo "🔗 View on npm: https://www.npmjs.com/package/$PACKAGE_NAME"
    echo ""
    echo "📥 Install with:"
    echo "  npm install -g $PACKAGE_NAME"
else
    echo "❌ Publishing cancelled"
    exit 1
fi
