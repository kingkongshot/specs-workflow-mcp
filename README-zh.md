# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/spec-workflow-mcp.svg)](https://www.npmjs.com/package/spec-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.com)

[English](README.md) | [简体中文](README-zh.md)

通过结构化的 **需求 → 设计 → 任务** 工作流，引导 AI 系统地完成软件开发，确保代码实现与业务需求始终保持一致。

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

> **v1.0.6**
> - ✨ 批量任务完成：一次完成多个任务，大型项目进展更快
> 
> **v1.0.5** 
> - 🐛 边缘情况修复：区分"任务不存在"和"任务已完成"，避免工作流中断
> 
> **v1.0.4**
> - ✅ 任务管理功能：添加任务完成追踪，让 AI 能够系统地推进项目
> 
> **v1.0.3**
> - 🎉 首次发布：提供需求→设计→任务的核心工作流框架

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

你可以指定任意目录：`"用 spec workflow 在 ./src/features/auth 创建认证文档"`

## AI 使用指南

### 🤖 让 AI 更好地使用此工具

**强烈建议**在你的 AI 助手配置中添加以下引导词。如果不配置，AI 可能会：
- ❌ 不知道何时调用 Spec Workflow
- ❌ 忘记管理任务进度，导致工作混乱
- ❌ 不会利用 Spec Workflow 来系统地编写文档
- ❌ 无法持续跟踪项目状态

配置后，AI 将能够智能地使用 Spec Workflow 来管理整个开发流程。

> **配置提醒**：请根据您的实际情况修改以下内容：
> 1. 将 `./specs` 改为您偏好的文档目录路径
> 2. 将"中文"改为您偏好的文档语言（如"英文"）

```
# Spec Workflow 使用规范

## 1. 检查项目进度
当用户提到继续之前的项目或不确定当前进度时，主动使用：
specs-workflow 工具，action.type="check"，path="./specs"

## 2. 文档语言
所有 spec workflow 文档统一使用中文编写，包括需求、设计、任务文档中的所有内容。

## 3. 文档目录
所有 spec workflow 文档统一放置在 ./specs 目录下，保持项目文档的组织一致性。

## 4. 任务管理
始终使用以下方式管理任务进度：
specs-workflow 工具，action.type="complete_task"，taskNumber="当前任务编号"
按照 workflow 返回的指引继续工作，直到所有任务完成。

## 5. 最佳实践
- 主动检查进度：当用户说"继续上次的工作"时，先用 check 查看当前状态
- 保持语言一致：整个项目文档使用同一种语言
- 灵活的目录结构：根据项目规模选择单模块或多模块组织方式
- 任务粒度控制：每个任务应该可以在 1-2 小时内完成
```

## 安装指南

<details>
<summary>📦 查看完整安装说明</summary>

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

添加到您的 Claude Desktop 配置文件：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

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

添加到您的 Cursor 配置文件（`~/.cursor/config.json`）：

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
   - Command: `npx`
   - Arguments: `-y spec-workflow-mcp@latest`

#### Windsurf (Codeium)

添加到您的 Windsurf 配置文件（`~/.codeium/windsurf/mcp_config.json`）：

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

添加到您的 VS Code 设置（`settings.json`）：

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

添加到您的 Zed 配置文件（`~/.config/zed/settings.json`）：

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


## 链接

- [GitHub 仓库](https://github.com/kingkongshot/specs-mcp)
- [NPM 包](https://www.npmjs.com/package/spec-workflow-mcp)
- [问题反馈](https://github.com/kingkongshot/specs-mcp/issues)

## 许可证

MIT License

---

<a href="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp/badge" alt="Spec Workflow MCP server" />
</a>