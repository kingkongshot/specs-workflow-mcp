#!/bin/bash

# Generate package directory with all necessary files for npm publishing
# This script creates a complete package directory from scratch

set -e

echo "📦 Generating package directory..."

# Create package directory structure
echo "📁 Creating directory structure..."
rm -rf package
mkdir -p package/api
mkdir -p package/dist

# Generate package.json
echo "📄 Generating package.json..."
MAIN_VERSION=$(node -p "require('./package.json').version")
cat > package/package.json << EOF
{
  "name": "spec-workflow-mcp",
  "version": "$MAIN_VERSION",
  "description": "MCP server for managing spec workflow (requirements, design, implementation)",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "spec-workflow-mcp": "dist/index.js"
  },
  "files": [
    "dist/**/*",
    "api/**/*"
  ],
  "keywords": [
    "mcp",
    "workflow",
    "spec",
    "requirements",
    "design",
    "implementation",
    "openapi"
  ],
  "author": "kingkongshot",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/kingkongshot/specs-workflow-mcp.git"
  },
  "bugs": {
    "url": "https://github.com/kingkongshot/specs-workflow-mcp/issues"
  },
  "homepage": "https://github.com/kingkongshot/specs-workflow-mcp#readme",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.6",
    "@types/js-yaml": "^4.0.9",
    "js-yaml": "^4.1.0",
    "zod": "^3.25.76"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Generate README.md
echo "📖 Generating README.md..."
cat > package/README.md << 'EOF'
# Spec Workflow MCP

A Model Context Protocol (MCP) server for managing specification workflows including requirements, design, and implementation phases.

## Features

- **Requirements Management**: Create and validate requirement documents
- **Design Documentation**: Generate and review design specifications
- **Task Management**: Break down implementation into manageable tasks
- **Progress Tracking**: Monitor workflow progress across all phases
- **OpenAPI Integration**: Full OpenAPI 3.1.0 specification support

## Installation

```bash
npm install -g spec-workflow-mcp
```

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "specs-workflow": {
      "command": "spec-workflow-mcp"
    }
  }
}
```

### Available Operations

- `init` - Initialize a new feature specification
- `check` - Check current workflow status
- `confirm` - Confirm stage completion
- `skip` - Skip current stage
- `complete_task` - Mark tasks as completed

## Documentation

For detailed usage instructions and examples, visit the [GitHub repository](https://github.com/kingkongshot/specs-workflow-mcp).

## License

MIT
EOF

# Copy OpenAPI specification
echo "📋 Copying OpenAPI specification..."
cp api/spec-workflow.openapi.yaml package/api/spec-workflow.openapi.yaml

# Copy built files
echo "🏗️ Copying built files..."
if [ -d "dist" ]; then
    cp -r dist/* package/dist/
else
    echo "❌ Error: dist directory not found. Run 'npm run build' first."
    exit 1
fi

echo "✅ Package directory generated successfully!"
echo "📦 Version: $MAIN_VERSION"
echo "📁 Location: ./package/"
echo ""
echo "Contents:"
echo "  📄 package.json"
echo "  📖 README.md"
echo "  📋 api/spec-workflow.openapi.yaml"
echo "  🏗️ dist/ (compiled JavaScript)"
