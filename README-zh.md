# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/spec-workflow-mcp.svg)](https://www.npmjs.com/package/spec-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.com)

[English](README.md) | [简体中文](README-zh.md)

一个智能的 MCP 服务器，引导 AI 通过结构化工作流创建软件项目规格文档：需求 → 设计 → 任务。

## 快速开始 - 如何使用

安装后，只需告诉你的 AI 助手：

### 开始新项目
```
"帮我用 specs 创建一个用户认证系统"
```
或
```
"用 specs 把我们的聊天内容整理成项目文档"
```

AI 将会：
1. 📝 基于用户故事创建需求文档
2. 🎨 生成包含技术细节的设计文档
3. ✅ 列出清晰的实现任务
4. 🚀 按照任务列表指导开发

### 继续现有项目
```
"用 specs check ./my-project"
```

AI 会从上次中断的地方继续工作流程。

### 工作原理

1. **你描述想要什么** - 只需解释你的项目想法
2. **AI 创建结构化文档** - 需求 → 设计 → 任务
3. **你审查并批准** - 每个阶段都需要你的确认
4. **按任务开发** - 清晰、可追踪的实现

每一步都需要你的批准才能继续，确保你始终掌控项目方向。

## 安装

<details>
<summary>📦 安装说明</summary>

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

## 示例工作流

<details>
<summary>📋 查看完整示例</summary>

### 1. 从一个想法开始
```
你："我需要构建一个用户认证系统"
```

### 2. AI 创建需求
```
AI："我来帮你创建用户认证的 specs。让我先从需求文档开始..."

[创建包含用户故事、功能需求等的 requirements.md]

AI："我已经创建了需求文档。请审查一下，如果需要修改请告诉我。"
```

### 3. 审查并确认
```
你："看起来不错，继续"
```

### 4. AI 创建设计
```
AI："现在我将基于这些需求创建技术设计..."

[创建包含架构、API 设计、数据库模式等的 design.md]
```

### 5. AI 创建任务
```
AI："基于设计，这里是实现任务..."

[创建带有编号任务列表的 tasks.md]
```

### 6. 开始开发
```
AI："让我们从任务 1 开始：设置认证数据库模式..."

[按顺序实现每个任务]
```

</details>

## 核心功能

- 📝 **基于用户故事**：从用户故事开始，转化为技术需求
- 🔄 **三阶段工作流**：需求 → 设计 → 任务，带进度追踪
- ✅ **任务管理**：清晰的任务列表和完成状态追踪
- 🎯 **顺序执行**：AI 按顺序完成任务，保持专注和上下文
- 🔒 **审批关卡**：每个阶段都需要你的确认才能继续

## 什么是 Spec Workflow MCP？

Spec Workflow MCP 通过提供 AI 驱动的工作流，帮助开发团队维护高质量的项目文档，引导您创建全面的规格说明。

### ❌ 没有 Spec Workflow MCP

- 项目间文档不一致
- 缺少关键需求细节
- 设计决策无组织
- 实现任务不清晰  
- 手动跟踪文档完成度
- **AI 在任务间随机跳跃，没有结构**
- **需求与实际代码实现脱节**

### ✅ 使用 Spec Workflow MCP

- 标准化的需求、设计和任务文档模板
- 基于最佳实践的 AI 引导文档生成
- 自动进度跟踪和工作流管理
- 智能验证文档完整性
- 与 Claude 和其他 MCP 兼容工具无缝集成
- **AI 系统地按顺序执行任务，完成一个再进行下一个**
- **需求 → 设计 → 任务工作流确保代码与业务需求一致**

## 工作流阶段

1. **需求收集** → 2. **系统设计** → 3. **实施规划**

每个阶段都有：
- 结构化模板
- 验证规则
- AI 驱动的内容生成
- 进度跟踪

## 开发

### 从源码构建

```bash
npm install
npm run build
```

### 开发模式运行

```bash
npm run dev
```

### 运行测试

```bash
npm test
```

### 使用 MCP Inspector 调试

```bash
npm run inspector
```

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 许可证

MIT 许可证 - 详见 LICENSE 文件

## 链接

- [GitHub 仓库](https://github.com/kingkongshot/specs-workflow-mcp)
- [NPM 包](https://www.npmjs.com/package/spec-workflow-mcp)
- [MCP 文档](https://modelcontextprotocol.com)

---

<a href="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp/badge" alt="Spec Workflow MCP server" />
</a>

使用 Model Context Protocol 用 ❤️ 构建