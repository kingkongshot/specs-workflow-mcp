# WSL Development Guide

This comprehensive guide covers WSL (Windows Subsystem for Linux) specific features and advanced setup for the Spec Workflow MCP server.

## Overview

WSL (Windows Subsystem for Linux) allows you to run a Linux environment directly on Windows. This MCP server includes comprehensive WSL support with automatic environment detection, Windows-Linux path conversion, and seamless cross-platform integration.

## Features

### 🔍 Advanced WSL Detection

The server automatically detects and provides detailed WSL information:

```javascript
// Example WSL environment detection output
{
  "isRemote": true,
  "isWSL": true,
  "environmentType": "wsl",
  "wslVersion": "2",
  "wslDistribution": "Ubuntu-22.04",
  "windowsPath": "/mnt/c",
  "remoteWorkspaceFolder": "/home/username/specs-workflow-mcp",
  "windowsUsername": "JohnDoe",
  "linuxUsername": "ubuntu"
}
```

### 🛤️ Path Conversion

Seamless path conversion between Windows and Linux formats:

```typescript
// Windows to WSL
windowsToWSLPath("C:/Users/username/Documents");
// -> '/mnt/c/Users/username/Documents'

// WSL to Windows
wslToWindowsPath("/mnt/c/Users/username/Documents");
// -> 'C:/Users/username/Documents'
```

### 📁 File System Integration

- Access Windows files from WSL
- Proper path resolution for cross-platform projects
- Windows drive mounting detection

## Quick Setup

### Prerequisites

1. **Windows 10/11** with WSL enabled
2. **WSL distribution** installed (Ubuntu, Debian, etc.)
3. **Node.js** installed in WSL environment
4. **VS Code** with Remote WSL extension

### Installation

```bash
# In WSL terminal
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp

# Run WSL-aware setup script
./scripts/setup-remote.sh
```

The setup script will automatically detect WSL and configure accordingly.

## Development Workflow

### VS Code Integration

1. **Open in WSL:**

   ```bash
   # From WSL terminal in project directory
   code .
   ```

2. **Or from Windows VS Code:**
   - `Ctrl+Shift+P` → "Remote-WSL: Open Folder in WSL"
   - Navigate to your project folder

### Available Commands

```bash
# Test WSL environment
npm run wsl:test

# Get WSL info
npm run wsl:info

# Run development server
npm run dev

# Build project
npm run build
```

### VS Code Tasks

Access via `Ctrl+Shift+P` → "Tasks: Run Task":

- **Test WSL Environment**: Comprehensive WSL testing
- **WSL Path Conversion Test**: Test path conversion functions
- **Build**: Standard build process
- **Watch**: Development with hot reload

## Advanced WSL Integration

### Claude Desktop Configuration Options

**Option 1: Direct WSL execution**

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "wsl",
      "args": ["node", "/home/username/specs-workflow-mcp/dist/index.js"]
    }
  }
}
```

**Option 2: PowerShell bridge**

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "powershell",
      "args": [
        "-Command",
        "wsl node /home/username/specs-workflow-mcp/dist/index.js"
      ]
    }
  }
}
```

**Option 3: Batch file wrapper**

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "C:/Users/username/wsl-mcp-bridge.bat"
    }
  }
}
```

### PowerShell Integration Examples

```powershell
# Start MCP server from PowerShell
wsl node /home/username/specs-workflow-mcp/dist/index.js

# Check WSL environment
wsl npm run wsl:info

# Run tests
wsl npm test

# Open WSL project in Windows VS Code
wsl code /home/username/specs-workflow-mcp
```

### Windows File System Integration

**Accessing Windows Files from WSL:**

```bash
# Windows Documents folder
cd /mnt/c/Users/username/Documents

# Windows Desktop
ls /mnt/c/Users/username/Desktop

# Program Files
ls "/mnt/c/Program Files"

# Cross-platform project
/mnt/c/Users/username/projects/my-app
```

**Environment Variables:**

```bash
# WSL-specific variables automatically detected
echo $WSL_DISTRO_NAME          # Ubuntu-22.04
echo $WSLENV                   # Shared environment variables
echo $PATH                     # Includes Windows paths

# Windows paths accessible
/mnt/c/Windows/System32
/mnt/c/Program Files/nodejs
```

### Performance Optimizations

**File System Performance:**

- Store frequently accessed files in WSL file system (`/home/`)
- Use Windows file system (`/mnt/c/`) for large media files
- Avoid cross-system symlinks for better performance

**Development Workflow:**

```bash
# Fast: WSL native
~/projects/specs-workflow-mcp/

# Slower: Windows mount (but accessible from Windows)
/mnt/c/Users/username/projects/specs-workflow-mcp/
```

## Path Resolution Examples

### Automatic Path Conversion

The server provides intelligent path conversion:

```typescript
// Windows to WSL conversion examples
windowsToWSLPath("C:/Users/JohnDoe/Documents/project");
// → "/mnt/c/Users/JohnDoe/Documents/project"

windowsToWSLPath("D:/Development/specs-workflow-mcp");
// → "/mnt/d/Development/specs-workflow-mcp"

// WSL to Windows conversion examples
wslToWindowsPath("/mnt/c/Users/JohnDoe/Documents/project");
// → "C:/Users/JohnDoe/Documents/project"

wslToWindowsPath("/home/ubuntu/my-project");
// → "\\\\wsl$\\Ubuntu-22.04\\home\\ubuntu\\my-project"
```

### Project Structure Examples

**Windows-accessible WSL project:**

```bash
/mnt/c/Users/username/projects/my-app/
├── specs/
├── src/
├── package.json
└── README.md
```

**WSL-native project:**

```bash
/home/username/projects/my-app/
├── specs/
├── src/
├── package.json
└── README.md
```

### Cross-Platform Development

**Sharing files between Windows and WSL:**

```bash
# Create Windows-accessible workspace
mkdir /mnt/c/shared-workspace
cd /mnt/c/shared-workspace

# Clone and work on project
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp

# Now accessible from both Windows and WSL
# Windows: C:\shared-workspace\specs-workflow-mcp
# WSL: /mnt/c/shared-workspace/specs-workflow-mcp
```

## WSL Environment Detection

The server provides comprehensive environment information:

```javascript
// Detailed WSL environment detection
{
  "isRemote": true,
  "isWSL": true,
  "environmentType": "wsl",
  "wslVersion": "2",
  "wslDistribution": "Ubuntu-22.04",
  "windowsPath": "/mnt/c",
  "remoteWorkspaceFolder": "/home/username/specs-workflow-mcp",
  "windowsUsername": "JohnDoe",
  "linuxUsername": "ubuntu",
  "availableMounts": ["/mnt/c", "/mnt/d"],
  "windowsSystemRoot": "/mnt/c/Windows"
}
```

## Troubleshooting

### Common WSL Issues

**1. Permission Issues**

```bash
# Fix WSL file permissions
sudo chown -R $USER:$USER ~/specs-workflow-mcp
chmod -R 755 ~/specs-workflow-mcp
```

**2. Node.js Not Found**

```bash
# Install Node.js in WSL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**3. Path Resolution Issues**

```bash
# Test path conversion
npm run wsl:test

# Debug path resolution
node -e "console.log(require('./dist/features/shared/remotePathUtils').detectRemoteEnvironment())"
```

**4. VS Code Integration Issues**

```bash
# Reinstall VS Code Server in WSL
code --install-extension ms-vscode-remote.remote-wsl

# Reset VS Code WSL connection
code --uninstall-extension ms-vscode-remote.remote-wsl
code --install-extension ms-vscode-remote.remote-wsl
```

### Performance Issues

**File watching problems:**

```bash
# Increase file watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Memory usage:**

```bash
# Check WSL memory usage
free -h

# Restart WSL if needed (from Windows PowerShell)
wsl --shutdown
wsl
```

## Path Resolution Examples

### Project Paths

```bash
# Windows path (works automatically)
./my-project
C:/Users/username/projects/my-app

# WSL path (native)
/home/username/my-project
/mnt/c/Users/username/projects/my-app
```

### Cross-Platform Compatibility

The server automatically handles:

- Windows drive letters (`C:` → `/mnt/c`)
- Path separators (`\` → `/`)
- Case sensitivity differences
- Permission mappings

## WSL-Specific Features

### Windows File Access

Access Windows files directly from WSL:

```bash
# Windows Documents folder
/mnt/c/Users/username/Documents

# Windows Desktop
/mnt/c/Users/username/Desktop

# Program Files
/mnt/c/Program Files
```

### Environment Variables

WSL-specific environment variables are automatically detected:

- `WSL_DISTRO_NAME`: Distribution name
- `WSLENV`: Shared environment variables
- Windows paths in `PATH`

### Network Configuration

- Localhost works between Windows and WSL
- Windows applications can connect to WSL servers
- Port forwarding is automatic in WSL2

## Troubleshooting

### Common Issues

#### Path Resolution Problems

```bash
# Test path conversion
npm run wsl:test

# Check environment
npm run wsl:info
```

#### Permission Issues

```bash
# Fix file permissions
chmod +x dist/index.js

# Check WSL mount options
cat /etc/wsl.conf
```

#### Performance Optimization

- Store project files in WSL file system for better performance
- Avoid cross-file-system operations when possible
- Use WSL2 for better performance

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development npm start
```

This provides detailed WSL environment information and path resolution logging.

## Best Practices

### File Organization

```
# Recommended: Store in WSL file system
/home/username/projects/specs-workflow-mcp/

# Avoid: Cross-file-system operations
/mnt/c/projects/specs-workflow-mcp/
```

### Development Workflow

1. **Clone to WSL**: `git clone` in WSL environment
2. **Code in VS Code**: Use Remote WSL extension
3. **Run in WSL**: Execute all commands in WSL terminal
4. **Build in WSL**: Compile and test in WSL environment

### Path Handling

- Use relative paths when possible
- Let the server handle path conversion automatically
- Test with both Windows and Linux path formats

## Integration Examples

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "wsl",
      "args": ["node", "/home/username/specs-workflow-mcp/dist/index.js"]
    }
  }
}
```

### PowerShell Integration

```powershell
# Run MCP server from PowerShell
wsl node /home/username/specs-workflow-mcp/dist/index.js
```

### Windows Terminal

Add to Windows Terminal settings:

```json
{
  "name": "MCP Server (WSL)",
  "commandline": "wsl -d Ubuntu-22.04 node /home/username/specs-workflow-mcp/dist/index.js"
}
```

## Advanced Configuration

### WSL Configuration

Create or edit `/etc/wsl.conf`:

```ini
[automount]
enabled = true
root = /mnt/
options = "metadata,umask=77,fmask=11"

[network]
generateHosts = true
generateResolvConf = true
```

### VS Code Settings

WSL-specific settings in `.vscode/settings.json`:

```json
{
  "remote.WSL.fileWatcher.polling": false,
  "remote.WSL.useShellEnvironment": true,
  "terminal.integrated.defaultProfile.linux": "bash"
}
```

## Support

### WSL Version Check

```bash
wsl --list --verbose
```

### Distribution Info

```bash
cat /etc/os-release
uname -a
```

### Node.js in WSL

```bash
node --version
npm --version
which node
```

For WSL-specific issues:

1. Check Microsoft's WSL documentation
2. Verify Node.js installation in WSL
3. Test path conversion functions
4. Enable debug logging

---

🐧 **Happy WSL development!** The server provides seamless integration between Windows and Linux environments for optimal development experience.
