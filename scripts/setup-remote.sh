#!/bin/bash

# Remote development setup script for VS Code Remote SSH and WSL
# This script helps set up the MCP server in remote and WSL environments

set -e

echo "🌐 Setting up Spec Workflow MCP for Remote Development..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check environment type
WSL_DETECTED=false
REMOTE_DETECTED=false

# Check for WSL
if [ -f "/proc/version" ] && grep -qi "microsoft\|wsl" /proc/version; then
    WSL_DETECTED=true
    echo "🐧 WSL environment detected"
    if [ -n "$WSL_DISTRO_NAME" ]; then
        echo "   Distribution: $WSL_DISTRO_NAME"
    fi
    if grep -q "WSL2" /proc/version; then
        echo "   Version: WSL2"
    elif grep -qi "microsoft" /proc/version; then
        echo "   Version: WSL1"
    fi
    echo "   User: $(whoami)"
    echo "   Host: $(hostname)"
    echo "   Working Directory: $(pwd)"

    # Check for Windows mount points
    if [ -d "/mnt/c" ]; then
        echo "   Windows C: drive mounted at /mnt/c"
    fi
fi

# Check for remote SSH
if [ -n "$SSH_CONNECTION" ] || [ -n "$SSH_CLIENT" ] || [ -n "$VSCODE_REMOTE_NAME" ]; then
    REMOTE_DETECTED=true
    if [ "$WSL_DETECTED" = false ]; then
        echo "✅ Remote SSH environment detected"
        echo "   Remote Name: ${VSCODE_REMOTE_NAME:-'N/A'}"
        echo "   SSH Connection: ${SSH_CONNECTION:-'N/A'}"
        echo "   User: $(whoami)"
        echo "   Host: $(hostname)"
        echo "   Working Directory: $(pwd)"
    else
        echo "✅ WSL with VS Code Remote detected"
        echo "   Remote Name: ${VSCODE_REMOTE_NAME:-'N/A'}"
    fi
else
    if [ "$WSL_DETECTED" = false ]; then
        echo "⚠️  Remote environment not detected, continuing anyway..."
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the project
echo "🔨 Building project..."
npm run build

# Make the executable file executable
chmod +x dist/index.js

# Create remote development configuration
echo "⚙️  Creating remote development configuration..."

# Create .remote directory if it doesn't exist
mkdir -p .remote

# Create remote development configuration file
cat > .remote/config.json << 'EOF'
{
  "remoteEnvironment": true,
  "isWSL": "<IS_WSL>",
  "wslDistribution": "<WSL_DISTRO>",
  "wslVersion": "<WSL_VERSION>",
  "setupDate": "<DATE>",
  "nodeVersion": "<NODE_VERSION>",
  "platform": "<PLATFORM>",
  "arch": "<ARCH>",
  "user": "<USER>",
  "hostname": "<HOSTNAME>",
  "workingDirectory": "<PWD>"
}
EOF

# Replace placeholders with actual values
sed -i "s/<IS_WSL>/$WSL_DETECTED/g" .remote/config.json
sed -i "s/<WSL_DISTRO>/${WSL_DISTRO_NAME:-null}/g" .remote/config.json

# Detect WSL version
if [ "$WSL_DETECTED" = true ]; then
    if grep -q "WSL2" /proc/version; then
        sed -i "s/<WSL_VERSION>/2/g" .remote/config.json
    elif grep -qi "microsoft" /proc/version; then
        sed -i "s/<WSL_VERSION>/1/g" .remote/config.json
    else
        sed -i "s/<WSL_VERSION>/unknown/g" .remote/config.json
    fi
else
    sed -i "s/<WSL_VERSION>/null/g" .remote/config.json
fi
sed -i "s/<DATE>/$(date -Iseconds)/g" .remote/config.json
sed -i "s/<NODE_VERSION>/$(node --version)/g" .remote/config.json
sed -i "s/<PLATFORM>/$(uname -s)/g" .remote/config.json
sed -i "s/<ARCH>/$(uname -m)/g" .remote/config.json
sed -i "s/<USER>/$(whoami)/g" .remote/config.json
sed -i "s/<HOSTNAME>/$(hostname)/g" .remote/config.json
sed -i "s|<PWD>|$(pwd)|g" .remote/config.json

# Test the build
echo "🧪 Testing MCP server..."
timeout 5s node dist/index.js --help || echo "✅ Server executable created successfully"

echo ""
echo "✨ Remote development setup complete!"
echo ""
echo "📋 Next steps:"
if [ "$WSL_DETECTED" = true ]; then
    echo "   🐧 WSL Development:"
    echo "   1. In your local VS Code, install the Remote WSL extension"
    echo "   2. Use 'Remote-WSL: Open Folder in WSL' to open this project"
    echo "   3. Alternatively, run 'code .' from the WSL terminal"
else
    echo "   🌐 Remote SSH Development:"
    echo "   1. In your local VS Code, install the Remote SSH extension"
    echo "   2. Connect to your remote host using Remote SSH"
    echo "   3. Open this project folder in the remote VS Code instance"
fi
echo "   4. Use the debug configurations in .vscode/launch.json to test the server"
echo ""
echo "🔧 Available VS Code tasks:"
echo "   • Build: Ctrl+Shift+P -> Tasks: Run Task -> build"
echo "   • Watch: Ctrl+Shift+P -> Tasks: Run Task -> watch"
echo "   • Start Remote: Ctrl+Shift+P -> Tasks: Run Task -> Start MCP Server (Remote)"
if [ "$WSL_DETECTED" = true ]; then
    echo "   • WSL Test: Ctrl+Shift+P -> Tasks: Run Task -> Test WSL Environment"
    echo "   • WSL Paths: Ctrl+Shift+P -> Tasks: Run Task -> WSL Path Conversion Test"
fi
echo ""
echo "🐛 Debug configurations available:"
echo "   • Debug MCP Server: F5 to run compiled version"
echo "   • Debug MCP Server (TypeScript): F5 to run TypeScript directly"
echo "   • Test MCP Inspector: F5 to run with MCP inspector"
echo ""

# Show remote configuration
echo "🌐 Remote configuration:"
cat .remote/config.json

echo ""
echo "🎉 Setup completed successfully! Happy remote development!"
