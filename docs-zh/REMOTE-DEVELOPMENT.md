# VS Code Remote SSH 开发指南

这份全面的指南帮助你设置和使用 Spec Workflow MCP 服务器进行 VS Code Remote SSH 无缝远程开发。

## 概述

Spec Workflow MCP 服务器包含对远程开发环境的全面支持，具备自动检测和配置功能。本文档涵盖了 VS Code Remote SSH 环境的完整设置和使用。

## 环境检测

服务器自动检测远程环境并提供详细日志记录：

```
🌐 运行在远程环境中: user@hostname
🔗 远程 SSH 开发模式已启用
📍 远程工作空间: /home/user/project
```

## 先决条件

1. **本地机器：**

   - 安装 VS Code
   - 安装远程 SSH 扩展（`ms-vscode-remote.remote-ssh`）

2. **远程机器：**
   - SSH 服务器运行中
   - Node.js（推荐 18+ 版本）
   - Git（可选，但推荐）

## 快速设置

### 1. 连接到远程主机

1. 在本地打开 VS Code
2. 按 `Ctrl+Shift+P`（macOS 上为 `Cmd+Shift+P`）
3. 选择 "Remote-SSH: Connect to Host..."
4. 输入你的 SSH 连接字符串：`user@hostname`
5. VS Code 将打开一个连接到远程主机的新窗口

### 2. 克隆和设置项目

```bash
# 克隆仓库（如果尚未存在）
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp

# 运行远程设置脚本
./scripts/setup-remote.sh
```

### 3. 在 VS Code Remote 中打开

1. 在远程 VS Code 窗口中：文件 → 打开文件夹
2. 选择 `specs-workflow-mcp` 目录
3. VS Code 将自动检测工作空间配置

## 开发工作流程

### 构建和运行

项目包含多个预配置任务，可通过 `Ctrl+Shift+P` → "Tasks: Run Task" 访问：

- **build**：将 TypeScript 编译为 JavaScript
- **dev**：运行带热重载的开发服务器
- **watch**：文件变更时持续编译 TypeScript
- **Setup Remote Development Environment**：安装依赖项
- **Start MCP Server (Remote)**：启动服务器进行测试

### 调试

有三种调试配置可用（按 `F5` 或使用调试面板）：

1. **Debug MCP Server**：调试编译后的 JavaScript 版本
2. **Debug MCP Server (TypeScript)**：使用 tsx 直接调试 TypeScript
3. **Test MCP Inspector**：使用 MCP 协议检查器运行

### 终端访问

集成终端将自动连接到你的远程主机，使用配置的 shell（默认为 zsh）。

## 远程特定功能

### 自动环境检测

服务器自动提供详细的环境信息：

```javascript
// Remote SSH 的示例输出
{
  "isRemote": true,
  "remoteUser": "alfadb",
  "remoteHost": "dev-server",
  "environmentType": "ssh",
  "remoteWorkspaceFolder": "/home/alfadb/specs-workflow-mcp",
  "localWorkspaceFolder": undefined
}
```

### 路径解析

服务器自动检测远程环境并处理路径解析：

```typescript
// 自动为远程环境解析路径
const resolvedPath = resolveRemotePath("/home/user/project");

// 正确处理相对路径
const relativePath = resolveRemotePath("./my-specs");
```

### 远程配置文件

设置后，会创建一个包含环境详情的 `.remote/config.json` 文件：

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

## VS Code 配置

### 工作空间设置

`.vscode/settings.json` 包含远程特定优化：

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

### 任务配置

`.vscode/tasks.json` 中的远程优化任务：

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

### 扩展

远程开发推荐的扩展（自动建议）：

- `ms-vscode-remote.remote-ssh` - 远程 SSH 支持
- `ms-vscode.vscode-typescript-next` - 增强的 TypeScript 支持
- `bradlc.vscode-tailwindcss` - Tailwind CSS 支持
- `ms-vscode.vscode-json` - JSON 模式验证

## 故障排除

### 常见问题

**1. SSH 连接问题**

```bash
# 测试 SSH 连接
ssh user@hostname

# 检查 SSH 配置
cat ~/.ssh/config
```

**2. Node.js 路径问题**

```bash
# 在远程机器上检查 Node.js 路径
which node
which npm

# 如果需要，更新 PATH
export PATH=$PATH:/usr/local/bin
```

**3. 权限问题**

```bash
# 修复项目文件权限
chmod -R 755 ~/specs-workflow-mcp
```

**4. 端口转发问题**

VS Code 设置：

- 检查 Remote SSH 设置
- 确保端口 22 开放
- 验证防火墙设置

### 性能优化

**1. SSH 连接优化**

在 `~/.ssh/config` 中添加：

```
Host mydev
  HostName your-server.com
  User your-username
  ControlMaster auto
  ControlPath ~/.ssh/sockets/%r@%h-%p
  ControlPersist 600
```

**2. VS Code 设置优化**

```json
{
  "remote.SSH.connectTimeout": 30,
  "remote.SSH.maxReconnectionAttempts": 3,
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true
  }
}
```

## 环境变量

服务器自动检测这些远程环境变量：

- `SSH_CONNECTION`：SSH 连接信息
- `SSH_CLIENT`：客户端连接详情
- `USER`：远程用户名
- `HOME`：远程主目录
- `PWD`：当前工作目录

## Claude Desktop 集成

在远程环境中使用 Claude Desktop 的配置示例：

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "ssh",
      "args": [
        "user@hostname",
        "node",
        "/home/user/specs-workflow-mcp/dist/index.js"
      ]
    }
  }
}
```

## 最佳实践

1. **保持连接稳定**：使用 SSH 多路复用
2. **定期备份**：定期将远程工作同步到本地
3. **版本控制**：始终使用 Git 进行版本控制
4. **监控资源**：注意远程服务器的 CPU 和内存使用
5. **安全性**：使用 SSH 密钥而非密码认证

## 日志记录

服务器提供详细的环境日志记录：

```
🌐 环境检测结果:
   类型: ssh
   用户: alfadb@dev-server
   工作目录: /home/alfadb/specs-workflow-mcp
   Node.js: v18.17.0
   平台: Linux x64

🔧 VS Code 集成:
   远程扩展: 已启用
   工作空间: 已配置
   调试: 可用
```

通过遵循本指南，你可以在远程 SSH 环境中充分利用 Spec Workflow MCP 服务器的所有功能。
