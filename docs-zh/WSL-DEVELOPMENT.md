# WSL 开发指南

这份全面的指南涵盖了 Spec Workflow MCP 服务器的 WSL（Windows Linux 子系统）特定功能和高级设置。

## 概述

WSL（Windows Linux 子系统）允许你在 Windows 上直接运行 Linux 环境。这个 MCP 服务器包含全面的 WSL 支持，具备自动环境检测、Windows-Linux 路径转换和无缝跨平台集成。

## 功能特性

### 🔍 高级 WSL 检测

服务器自动检测并提供详细的 WSL 信息：

```javascript
// WSL 环境检测输出示例
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

### 🛤️ 智能路径转换

Windows 和 Linux 格式之间的无缝路径转换：

```typescript
// Windows 到 WSL 转换
windowsToWSLPath("C:/Users/username/Documents");
// → '/mnt/c/Users/username/Documents'

windowsToWSLPath("D:/Development/specs-workflow-mcp");
// → "/mnt/d/Development/specs-workflow-mcp"

// WSL 到 Windows 转换
wslToWindowsPath("/mnt/c/Users/username/Documents");
// → "C:/Users/username/Documents"

wslToWindowsPath("/home/ubuntu/my-project");
// → "\\\\wsl$\\Ubuntu-22.04\\home\\ubuntu\\my-project"
```

### 📁 文件系统集成

- 从 WSL 访问 Windows 文件
- 跨平台项目的正确路径解析
- Windows 驱动器挂载检测

## 快速设置

### 先决条件

1. **Windows 10/11** 启用 WSL
2. **WSL 分发版** 已安装（Ubuntu、Debian 等）
3. **Node.js** 安装在 WSL 环境中
4. **VS Code** 配合远程 WSL 扩展

### 安装

```bash
# 在 WSL 终端中
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp

# 运行 WSL 感知的设置脚本
./scripts/setup-remote.sh
```

设置脚本将自动检测 WSL 并相应地进行配置。

## 开发工作流程

### VS Code 集成

1. **在 WSL 中打开：**

   ```bash
   # 从项目目录的 WSL 终端
   code .
   ```

2. **或者从 Windows VS Code：**
   - `Ctrl+Shift+P` → "Remote-WSL: Open Folder in WSL"
   - 导航到你的项目文件夹

### 可用命令

```bash
# 测试 WSL 环境
npm run wsl:test

# 获取 WSL 信息
npm run wsl:info

# 运行开发服务器
npm run dev

# 构建项目
npm run build
```

### VS Code 任务

通过 `Ctrl+Shift+P` → "Tasks: Run Task" 访问：

- **Test WSL Environment**：全面 WSL 测试
- **WSL Path Conversion Test**：测试路径转换函数
- **Build**：标准构建过程
- **Watch**：带热重载的开发

## 高级 WSL 集成

### Claude Desktop 配置选项

**选项 1：直接 WSL 执行**

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

**选项 2：PowerShell 桥接**

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

**选项 3：批处理文件包装器**

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "C:/Users/username/wsl-mcp-bridge.bat"
    }
  }
}
```

### PowerShell 集成示例

```powershell
# 从 PowerShell 启动 MCP 服务器
wsl node /home/username/specs-workflow-mcp/dist/index.js

# 检查 WSL 环境
wsl npm run wsl:info

# 运行测试
wsl npm test

# 在 Windows VS Code 中打开 WSL 项目
wsl code /home/username/specs-workflow-mcp
```

### Windows 文件系统集成

**从 WSL 访问 Windows 文件：**

```bash
# Windows 文档文件夹
cd /mnt/c/Users/username/Documents

# Windows 桌面
ls /mnt/c/Users/username/Desktop

# 程序文件
ls "/mnt/c/Program Files"

# 跨平台项目
/mnt/c/Users/username/projects/my-app
```

**环境变量：**

```bash
# 自动检测的 WSL 特定变量
echo $WSL_DISTRO_NAME          # Ubuntu-22.04
echo $WSLENV                   # 共享环境变量
echo $PATH                     # 包括 Windows 路径

# 可访问的 Windows 路径
/mnt/c/Windows/System32
/mnt/c/Program Files/nodejs
```

### 性能优化

**文件系统性能：**

- 将频繁访问的文件存储在 WSL 文件系统中（`/home/`）
- 对大型媒体文件使用 Windows 文件系统（`/mnt/c/`）
- 避免跨系统符号链接以获得更好性能

**开发工作流程：**

```bash
# 快速：WSL 原生
~/projects/specs-workflow-mcp/

# 较慢：Windows 挂载（但可从 Windows 访问）
/mnt/c/Users/username/projects/specs-workflow-mcp/
```

## 项目结构示例

### Windows 可访问的 WSL 项目

```bash
/mnt/c/Users/username/projects/my-app/
├── specs/
├── src/
├── package.json
└── README.md
```

### WSL 原生项目

```bash
/home/username/projects/my-app/
├── specs/
├── src/
├── package.json
└── README.md
```

### 跨平台开发

**在 Windows 和 WSL 之间共享文件：**

```bash
# 创建 Windows 可访问的工作空间
mkdir /mnt/c/shared-workspace
cd /mnt/c/shared-workspace

# 克隆并在项目上工作
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp

# 现在可从 Windows 和 WSL 访问
# Windows: C:\shared-workspace\specs-workflow-mcp
# WSL: /mnt/c/shared-workspace/specs-workflow-mcp
```

## WSL 环境检测

服务器提供全面的环境信息：

```javascript
// 详细的 WSL 环境检测
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

## 故障排除

### 常见 WSL 问题

**1. 权限问题**

```bash
# 修复 WSL 文件权限
sudo chown -R $USER:$USER ~/specs-workflow-mcp
chmod -R 755 ~/specs-workflow-mcp
```

**2. 找不到 Node.js**

```bash
# 在 WSL 中安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

**3. 路径解析问题**

```bash
# 测试路径转换
npm run wsl:test

# 调试路径解析
node -e "console.log(require('./dist/features/shared/remotePathUtils').detectRemoteEnvironment())"
```

**4. VS Code 集成问题**

```bash
# 在 WSL 中重新安装 VS Code Server
code --install-extension ms-vscode-remote.remote-wsl

# 重置 VS Code WSL 连接
code --uninstall-extension ms-vscode-remote.remote-wsl
code --install-extension ms-vscode-remote.remote-wsl
```

### 性能问题

**文件监视问题：**

```bash
# 增加文件监视限制
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**内存使用：**

```bash
# 检查 WSL 内存使用
free -h

# 如需要重启 WSL（从 Windows PowerShell）
wsl --shutdown
wsl
```

## 路径转换示例

### 自动路径转换

服务器提供智能路径转换：

```typescript
// 路径转换示例详解
const pathUtils = require("./dist/features/shared/remotePathUtils");

// Windows 路径到 WSL
console.log(
  pathUtils.windowsToWSLPath("C:\\Users\\JohnDoe\\Documents\\project")
);
// 输出: "/mnt/c/Users/JohnDoe/Documents/project"

// WSL 路径到 Windows
console.log(pathUtils.wslToWindowsPath("/home/ubuntu/my-project"));
// 输出: "\\\\wsl$\\Ubuntu-22.04\\home\\ubuntu\\my-project"

// 相对路径处理
console.log(pathUtils.resolveRemotePath("./my-specs"));
// 根据当前环境自动解析
```

## 最佳实践

1. **文件放置策略**：

   - WSL 原生（`/home/`）：频繁修改的源代码
   - Windows 挂载（`/mnt/c/`）：需要 Windows 程序访问的文件

2. **性能考虑**：

   - 避免跨文件系统的频繁 I/O
   - 使用 WSL 原生路径进行开发
   - Windows 路径用于文档和资源

3. **版本控制**：

   - Git 仓库可以在任一文件系统中
   - 推荐使用 WSL 原生路径获得更好性能

4. **编辑器集成**：
   - 使用 VS Code Remote-WSL 获得最佳体验
   - 配置适当的文件监视排除规则

## 日志记录

服务器提供详细的 WSL 环境日志：

```
🐧 WSL 环境检测:
   版本: WSL2
   分发版: Ubuntu-22.04
   Windows 用户: JohnDoe
   Linux 用户: ubuntu
   挂载点: /mnt/c, /mnt/d

🛤️ 路径转换:
   Windows 根: /mnt/c
   工作目录: /home/ubuntu/specs-workflow-mcp
   转换测试: 通过

⚙️ VS Code 集成:
   Remote-WSL: 已启用
   工作空间: 已配置
   任务: 可用
```

通过遵循本指南，你可以在 WSL 环境中充分利用 Spec Workflow MCP 服务器的所有跨平台功能。
