# VS Code Remote SSH Development Guide

This comprehensive guide helps you set up and use the Spec Workflow MCP server with VS Code Remote SSH for seamless remote development.

## Overview

The Spec Workflow MCP server includes full support for remote development environments with automatic detection and configuration. This document covers the complete setup and usage for VS Code Remote SSH environments.

## Environment Detection

The server automatically detects remote environments and provides detailed logging:

```
🌐 Running in remote environment: user@hostname
🔗 Remote SSH development mode enabled
📍 Remote workspace: /home/user/project
```

## Prerequisites

1. **Local Machine:**

   - VS Code installed
   - Remote SSH extension installed (`ms-vscode-remote.remote-ssh`)

2. **Remote Machine:**
   - SSH server running
   - Node.js (version 18+ recommended)
   - Git (optional, but recommended)

## Quick Setup

### 1. Connect to Remote Host

1. Open VS Code locally
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Select "Remote-SSH: Connect to Host..."
4. Enter your SSH connection string: `user@hostname`
5. VS Code will open a new window connected to the remote host

### 2. Clone and Setup Project

```bash
# Clone the repository (if not already present)
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp

# Run the remote setup script
./scripts/setup-remote.sh
```

### 3. Open in VS Code Remote

1. In the remote VS Code window: File → Open Folder
2. Select the `specs-workflow-mcp` directory
3. VS Code will automatically detect the workspace configuration

## Development Workflow

### Building and Running

The project includes several pre-configured tasks accessible via `Ctrl+Shift+P` → "Tasks: Run Task":

- **build**: Compile TypeScript to JavaScript
- **dev**: Run development server with hot reload
- **watch**: Continuously compile TypeScript on file changes
- **Setup Remote Development Environment**: Install dependencies
- **Start MCP Server (Remote)**: Start the server for testing

### Debugging

Three debug configurations are available (press `F5` or use Debug panel):

1. **Debug MCP Server**: Debug the compiled JavaScript version
2. **Debug MCP Server (TypeScript)**: Debug TypeScript directly with tsx
3. **Test MCP Inspector**: Run with MCP protocol inspector

### Terminal Access

The integrated terminal will automatically connect to your remote host with the configured shell (zsh by default).

## Remote-Specific Features

### Automatic Environment Detection

The server provides detailed environment information automatically:

```javascript
// Example output for Remote SSH
{
  "isRemote": true,
  "remoteUser": "alfadb",
  "remoteHost": "dev-server",
  "environmentType": "ssh",
  "remoteWorkspaceFolder": "/home/alfadb/specs-workflow-mcp",
  "localWorkspaceFolder": undefined
}
```

### Path Resolution

The server automatically detects remote environments and handles path resolution:

```typescript
// Automatically resolves paths for remote environments
const resolvedPath = resolveRemotePath("/home/user/project");

// Handles relative paths correctly
const relativePath = resolveRemotePath("./my-specs");
```

### Remote Configuration File

After setup, a `.remote/config.json` file is created with environment details:

```json
{
  "remoteEnvironment": true,
  "setupDate": "2025-08-21T10:30:00Z",
  "nodeVersion": "v18.17.0",
  "platform": "Linux",
  "arch": "x86_64",
  "user": "alfadb",
  "hostname": "remote-dev",
  "workingDirectory": "/home/alfadb/specs-workflow-mcp",
  "sshConnection": "alfadb@remote-dev"
}
```

## VS Code Configuration

### Workspace Settings

The `.vscode/settings.json` includes remote-specific optimizations:

```json
{
  "remote.SSH.defaultForwardedPorts": [],
  "remote.autoForwardPorts": false,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "remote.SSH.useLocalServer": false,
  "remote.SSH.enableDynamicForwarding": true
}
```

### Tasks Configuration

Remote-optimized tasks in `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Setup Remote Development Environment",
      "type": "shell",
      "command": "./scripts/setup-remote.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Start MCP Server (Remote)",
      "type": "shell",
      "command": "npm run dev",
      "group": "build",
      "isBackground": true,
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

### Extensions

Recommended extensions for remote development (automatically suggested):

- `ms-vscode-remote.remote-ssh` - Remote SSH support
- `ms-vscode.vscode-typescript-next` - Enhanced TypeScript support
- `bradlc.vscode-tailwindcss` - Tailwind CSS support
- `ms-vscode.vscode-json` - JSON schema validation

### Environment Logging

### Remote Configuration

After setup, a `.remote/config.json` file contains environment details:

```json
{
  "remoteEnvironment": true,
  "setupDate": "2025-08-21T10:30:00Z",
  "nodeVersion": "v18.17.0",
  "platform": "Linux",
  "arch": "x86_64",
  "user": "alfadb",
  "hostname": "remote-dev",
  "workingDirectory": "/home/alfadb/specs-workflow-mcp"
}
```

## Workspace Configuration

### Settings (.vscode/settings.json)

Optimized for remote development:

- Remote SSH platform detection
- Terminal configuration for Linux
- File watching exclusions for performance
- TypeScript and ESLint integration

### Tasks (.vscode/tasks.json)

Pre-configured build and run tasks:

- Standard npm script runners
- Remote-specific setup tasks
- Background watch tasks with problem matchers

### Launch Configurations (.vscode/launch.json)

Debug configurations that work in remote environments:

- Source map support
- Environment variable setup
- Pre-launch tasks

## Troubleshooting

### Connection Issues

1. **SSH Key Authentication**: Ensure your SSH keys are properly configured
2. **Firewall**: Check that SSH port (usually 22) is accessible
3. **Remote Extensions**: VS Code will automatically install necessary extensions on the remote host

### Performance Optimization

1. **File Watching**: Large file trees are excluded from watching
2. **Extension Management**: Only essential extensions are recommended for the remote environment
3. **Terminal Performance**: Configured for optimal shell performance

### Path Resolution Problems

If you encounter path resolution issues:

1. Check the remote configuration: `cat .remote/config.json`
2. Verify environment variables: `env | grep VSCODE`
3. Enable debug mode: `NODE_ENV=development npm start`

### MCP Server Testing

Test the MCP server in remote environment:

```bash
# Quick test
node dist/index.js --version

# With MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Best Practices

### File Synchronization

- Use VS Code's built-in sync for optimal performance
- Avoid manual file copying between local and remote
- Commit changes regularly to prevent data loss

### Development Workflow

1. **Edit**: Make changes using VS Code remote editor
2. **Build**: Use `Ctrl+Shift+P` → "Tasks: Run Task" → "build"
3. **Test**: Use debug configurations or run tasks
4. **Commit**: Use integrated Git features

### Security

- Use SSH key authentication instead of passwords
- Configure SSH connection multiplexing for better performance
- Keep the remote environment updated

## Integration with AI Tools

The MCP server is designed to work seamlessly with AI development tools:

1. **Claude Desktop**: Configure the server path to the remote executable
2. **VS Code Copilot**: Works normally in remote environment
3. **Command Palette**: All MCP operations available via VS Code interface

## Advanced Configuration

### Custom SSH Configuration

Add to your local `~/.ssh/config`:

```
Host your-remote-dev
    HostName your-server.example.com
    User your-username
    Port 22
    IdentityFile ~/.ssh/your-private-key
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### VS Code Settings Sync

Enable VS Code settings sync to maintain consistent configuration across local and remote environments.

### Multiple Remote Environments

The configuration supports multiple remote environments with different settings for each host.

---

## Support

For issues specific to remote development:

1. Check VS Code Remote SSH documentation
2. Review the remote configuration file
3. Enable debug logging for detailed troubleshooting
4. Open an issue with remote environment details

Happy remote development! 🚀
