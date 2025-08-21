# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/spec-workflow-mcp.svg)](https://www.npmjs.com/package/spec-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.com)

[English](README.md) | [简体中文](README-zh.md)

通过结构化的 **需求 → 设计 → 任务** 工作流，引导 AI 系统地完成软件开发，确保代码实现与业务需求始终保持一致。

## 目录

- [为什么需要它？](#为什么需要它)
- [最近更新](#最近更新)
- [快速开始](#快速开始)
- [远程开发](#远程开发)
  - [VS Code Remote SSH](#vs-code-remote-ssh)
  - [WSL 开发](#wsl-开发)
- [工作流程示例](#工作流程示例)
- [文档组织](#文档组织)
- [安装指南](#安装指南)
- [AI 使用指南](#ai-使用指南)
- [链接](#链接)
- [许可证](#许可证)

## 为什么需要它？

### ❌ 没有 Spec Workflow 时

- AI 在任务间随机跳跃，缺乏系统性
- 需求与实际代码实现脱节
- 文档散乱，难以追踪项目进度
- 缺少设计决策的记录

### ✅ 使用 Spec Workflow 后

- AI 按顺序完成任务，保持专注和上下文
- 从用户故事到代码实现的完整追踪
- 标准化文档模板，自动进度管理
- 每个阶段都需要确认，确保方向正确
- **进度持久化保存**：即使新建对话，也能通过 `check` 继续之前的工作

## 最近更新

> **v1.0.8**
>
> - 🌐 **远程开发支持**：完整的 VS Code Remote SSH 兼容性，具备自动环境检测和路径解析功能
> - 🐧 **WSL 支持**：完整的 WSL（Windows Linux 子系统）集成，支持 Windows-Linux 路径转换和环境检测

## 快速开始

### 1. 安装（以 Claude Code 为例）

```bash
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest
```

其他客户端请参考[完整安装指南](#安装指南)。

### 2. 开始新项目

```
"帮我用 spec workflow 创建一个用户认证系统"
```

### 3. 继续现有项目

```
"用 spec workflow check ./my-project"
```

AI 会自动检测项目状态并从上次中断的地方继续。

---

## 远程开发

本 MCP 服务器包含对远程开发环境的全面支持，具备自动检测和配置功能。

### 支持的环境

- **本地开发**：标准本地文件系统
- **VS Code Remote SSH**：具备自动路径解析的 SSH 连接
- **WSL**：支持 Windows-Linux 路径转换的 Windows Linux 子系统
- **容器**：Docker 和其他容器化环境

### 快速开始

#### Remote SSH 配置

```bash
# 1. 通过 VS Code Remote SSH 连接
# 2. 克隆和设置
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp
./scripts/setup-remote.sh
```

#### WSL 配置

```bash
# 在 WSL 终端中
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp
./scripts/setup-remote.sh  # 自动检测 WSL
```

### 关键功能

- 🔍 **自动环境检测**：检测 SSH、WSL 和容器环境
- 🛤️ **智能路径解析**：处理跨平台路径转换
- ⚙️ **VS Code 集成**：预配置的任务、调试和扩展
- 📊 **环境日志记录**：详细的环境信息用于故障排除

### 详细文档

完整的设置指南、故障排除和高级配置请参考：

- 📖 [远程 SSH 开发指南](./docs-zh/REMOTE-DEVELOPMENT.md)
- 🐧 [WSL 开发指南](./docs-zh/WSL-DEVELOPMENT.md)
- ⚙️ [技术实现详情](./docs-zh/)

---

## 工作流程示例

### 1. 你描述需求

```
你："我需要构建一个用户认证系统"
```

### 2. AI 创建结构化文档

```
AI："我来帮你创建用户认证的 spec workflow..."

📝 requirements.md - 用户故事和功能需求
🎨 design.md - 技术架构和设计决策  
✅ tasks.md - 具体实现任务列表
```

### 3. 逐步审批和实施

每个阶段完成后，AI 会请求你的确认才继续下一步，确保项目始终在正确的轨道上。

## 文档组织

### 基础结构

```
my-project/specs/
├── requirements.md              # 需求：用户故事、功能规格
├── design.md                    # 设计：架构、API、数据模型
├── tasks.md                     # 任务：编号的实施步骤
└── .workflow-confirmations.json # 状态：自动进度追踪
```

### 多模块项目

```
my-project/specs/
├── user-authentication/         # 认证模块
├── payment-system/             # 支付模块
└── notification-service/       # 通知模块
```

你可以指定任何目录：`"在 ./src/features/auth 中使用 spec workflow 创建认证文档"`

## 📦 安装指南

<details>
<summary>安装说明</summary>

### 系统要求

- Node.js ≥ v18.0.0
- npm 或 yarn
- Claude Desktop 或任何兼容 MCP 的客户端

### 在不同 MCP 客户端中安装

#### Claude Code（推荐）

使用 Claude CLI 添加 MCP 服务器：

```bash
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest
```

#### Claude Desktop

添加到你的 Claude Desktop 配置文件：

- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%/Claude/claude_desktop_config.json`
- Linux：`~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": ["-y", "spec-workflow-mcp@latest"]
    }
  }
}
```

#### Cursor

添加到你的 Cursor 配置文件（`~/.cursor/config.json`）：

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": ["-y", "spec-workflow-mcp@latest"]
    }
  }
}
```

#### Cline

使用 Cline 的 MCP 服务器管理界面添加服务器：

1. 打开安装了 Cline 扩展的 VS Code
2. 打开 Cline 设置（齿轮图标）
3. 导航到 MCP Servers 部分
4. 添加新服务器：
   - Command：`npx`
   - Arguments：`-y spec-workflow-mcp@latest`

#### Windsurf (Codeium)

添加到你的 Windsurf 配置文件（`~/.codeium/windsurf/mcp_config.json`）：

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": ["-y", "spec-workflow-mcp@latest"],
      "env": {},
      "autoApprove": [],
      "disabled": false,
      "timeout": 60,
      "transportType": "stdio"
    }
  }
}
```

#### VS Code（需要 MCP 扩展）

添加到你的 VS Code 设置文件（`settings.json`）：

```json
{
  "mcp.servers": {
    "spec-workflow": {
      "command": "npx",
      "args": ["-y", "spec-workflow-mcp@latest"]
    }
  }
}
```

#### Zed

添加到你的 Zed 配置文件（`~/.config/zed/settings.json`）：

```json
{
  "assistant": {
    "version": "2",
    "mcp": {
      "servers": {
        "spec-workflow": {
          "command": "npx",
          "args": ["-y", "spec-workflow-mcp@latest"]
        }
      }
    }
  }
}
```

### 从源码安装

```bash
git clone https://github.com/kingkongshot/specs-mcp.git
cd specs-mcp
npm install
npm run build
```

然后添加到 Claude Desktop 配置：

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/absolute/path/to/specs-mcp/dist/index.js"]
    }
  }
}
```

</details>

## 🤖 AI 使用指南

### 让 AI 更好地使用这个工具

**强烈推荐** 将以下提示添加到你的 AI 助手配置中。没有这个配置，AI 可能会：

- ❌ 不知道何时调用 Spec Workflow
- ❌ 忘记管理任务进度，导致工作混乱
- ❌ 不使用 Spec Workflow 进行系统化文档管理
- ❌ 无法连续追踪项目状态

使用这个配置，AI 将智能地使用 Spec Workflow 管理整个开发过程。

> **配置说明**：请根据需要修改以下内容：
>
> 1. 将 `./specs` 更改为你偏好的文档目录路径
> 2. 将 "中文" 更改为你偏好的文档语言（如 "English"）

```
# Spec Workflow 使用指南

## 1. 检查项目进度
当用户提到继续之前的项目或不确定当前进度时，主动使用：
specs-workflow 工具，设置 action.type="check" 和 path="./specs"

## 2. 文档语言
所有 spec workflow 文档应该用中文统一编写，包括需求、设计和任务文档中的所有内容。

## 3. 文档目录
所有 spec workflow 文档应放在 ./specs 目录中，保持项目文档组织的一致性。

## 4. 任务管理
始终使用以下方式管理任务进度：
specs-workflow 工具，设置 action.type="complete_task" 和 taskNumber="当前任务编号"
按照工作流指引继续工作直到所有任务完成。

## 5. 最佳实践
- 主动进度检查：当用户说"从上次继续"时，首先使用 check 查看当前状态
- 语言一致性：在所有项目文档中使用相同语言
- 灵活结构：根据项目规模选择单模块或多模块组织
- 任务粒度：每个任务应该能在 1-2 小时内完成
```

## 🔗 链接

- [GitHub 仓库](https://github.com/kingkongshot/specs-mcp)
- [NPM 包](https://www.npmjs.com/package/spec-workflow-mcp)
- [问题反馈](https://github.com/kingkongshot/specs-mcp/issues)
- [技术文档](./docs-zh/README.md) - 远程开发和实现指南

## 📄 许可证

MIT License

---

<a href="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp/badge" alt="Spec Workflow MCP server" />
</a>
