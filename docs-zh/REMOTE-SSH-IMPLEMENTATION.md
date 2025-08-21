# Remote SSH 实现详情

本文档详细介绍了 Spec Workflow MCP 服务器中 Remote SSH 支持的技术实现。

## 架构概览

Remote SSH 支持通过以下核心组件实现：

- `remotePathUtils.ts` - 环境检测和路径解析
- 自动设置脚本 - 环境配置
- VS Code 集成 - 开发环境优化

## 环境检测实现

### SSH 环境识别

```typescript
export function detectRemoteEnvironment(): RemoteEnvironment {
  const sshConnection = process.env.SSH_CONNECTION;
  const sshClient = process.env.SSH_CLIENT;

  if (sshConnection || sshClient) {
    return {
      isRemote: true,
      environmentType: "ssh",
      remoteUser: process.env.USER,
      remoteHost: extractHostFromSSH(sshConnection),
      remoteWorkspaceFolder: process.cwd(),
      // ... 其他属性
    };
  }

  return createLocalEnvironment();
}
```

### 主机信息提取

```typescript
function extractHostFromSSH(
  sshConnection: string | undefined
): string | undefined {
  if (!sshConnection) return undefined;

  // SSH_CONNECTION 格式: "client_ip client_port server_ip server_port"
  const parts = sshConnection.split(" ");
  if (parts.length >= 4) {
    return parts[2]; // 服务器 IP
  }

  return undefined;
}
```

## 路径解析

### 远程路径解析器

```typescript
export function createRemotePathResolver(): PathResolver {
  const env = detectRemoteEnvironment();

  return {
    resolve: (inputPath: string): string => {
      if (path.isAbsolute(inputPath)) {
        return inputPath;
      }

      const basePath = env.remoteWorkspaceFolder || process.cwd();
      return path.resolve(basePath, inputPath);
    },

    normalize: (inputPath: string): string => {
      return path.posix.normalize(inputPath);
    },
  };
}
```

## 自动设置

### 设置脚本实现

```bash
#!/bin/bash
# scripts/setup-remote.sh

detect_environment() {
    if [[ -n "$SSH_CONNECTION" || -n "$SSH_CLIENT" ]]; then
        echo "ssh"
    elif grep -q "microsoft" /proc/version 2>/dev/null; then
        echo "wsl"
    else
        echo "local"
    fi
}

setup_remote_config() {
    local env_type=$1
    local config_dir=".remote"

    mkdir -p "$config_dir"

    cat > "$config_dir/config.json" <<EOF
{
  "remoteEnvironment": true,
  "environmentType": "$env_type",
  "setupDate": "$(date -Iseconds)",
  "nodeVersion": "$(node --version 2>/dev/null || echo 'unknown')",
  "platform": "$(uname -s)",
  "arch": "$(uname -m)",
  "user": "$(whoami)",
  "hostname": "$(hostname)",
  "workingDirectory": "$(pwd)"
}
EOF
}
```

## VS Code 集成

### 任务配置

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
        "reveal": "always"
      }
    }
  ]
}
```

### 调试配置

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug MCP Server (Remote)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

## 日志记录

### 环境日志

```typescript
function logRemoteEnvironment(env: RemoteEnvironment): void {
  if (env.isRemote) {
    console.error(
      "🌐 运行在远程环境中:",
      `${env.remoteUser}@${env.remoteHost}`
    );
    console.error("🔗 远程 SSH 开发模式已启用");
    console.error("📍 远程工作空间:", env.remoteWorkspaceFolder);
  }
}
```

## 错误处理

### 连接故障

```typescript
function handleSSHErrors(): void {
  process.on("SIGTERM", () => {
    console.error("🔌 SSH 连接中断，正在清理...");
    // 清理逻辑
    process.exit(0);
  });

  process.on("SIGHUP", () => {
    console.error("🔄 SSH 连接重新建立");
    // 重新连接逻辑
  });
}
```

## 性能优化

### 连接复用

```typescript
// SSH 连接优化建议
const sshConfig = `
Host mydev
  HostName your-server.com
  User your-username
  ControlMaster auto
  ControlPath ~/.ssh/sockets/%r@%h-%p
  ControlPersist 600
`;
```

### 文件监视优化

```typescript
const watcherOptions = {
  ignored: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
  persistent: true,
  ignoreInitial: true,
};
```

## 安全考虑

### SSH 密钥管理

```bash
# 生成 SSH 密钥对
ssh-keygen -t ed25519 -C "your_email@example.com"

# 添加公钥到远程服务器
ssh-copy-id user@hostname
```

### 权限控制

```typescript
function validateRemoteAccess(path: string): boolean {
  // 确保路径在允许的目录内
  const allowedPaths = ["/home/user/projects/", "/tmp/workspace/"];

  return allowedPaths.some((allowed) => path.startsWith(allowed));
}
```

## 测试

### 环境检测测试

```typescript
describe("Remote SSH Detection", () => {
  it("should detect SSH environment", () => {
    process.env.SSH_CONNECTION = "192.168.1.100 12345 192.168.1.1 22";

    const env = detectRemoteEnvironment();

    expect(env.isRemote).toBe(true);
    expect(env.environmentType).toBe("ssh");
    expect(env.remoteHost).toBe("192.168.1.1");
  });
});
```

### 路径解析测试

```typescript
describe("Remote Path Resolution", () => {
  it("should resolve relative paths correctly", () => {
    const resolver = createRemotePathResolver();
    const resolved = resolver.resolve("./specs");

    expect(resolved).toMatch(/\/.*\/specs$/);
  });
});
```

通过这些技术实现，Spec Workflow MCP 服务器能够无缝地在远程 SSH 环境中运行，并提供完整的开发体验。
