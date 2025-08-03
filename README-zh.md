# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/spec-workflow-mcp.svg)](https://www.npmjs.com/package/spec-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.com)

一个智能的 MCP 服务器，通过结构化的需求、设计和实现文档工作流来管理软件项目规范。

## 什么是 Spec Workflow MCP？

Spec Workflow MCP 通过提供 AI 驱动的工作流，帮助开发团队维护高质量的项目文档，指导您创建全面的规范文档。

### ❌ 没有 Spec Workflow MCP

- 项目间文档不一致
- 缺少关键需求细节
- 设计决策缺乏结构
- 实现任务不明确
- 手动跟踪文档完成度
- **AI 在任务间随机跳跃，缺乏结构性**
- **需求与实际代码实现脱节**

### ✅ 使用 Spec Workflow MCP

- 标准化的需求、设计和任务文档模板
- 基于最佳实践的 AI 引导文档生成
- 自动进度跟踪和工作流管理
- 智能验证文档完整性
- 与 Claude 和其他 MCP 兼容工具无缝集成
- **AI 按顺序系统性完成任务，一个完成后再进入下一个**
- **需求 → 设计 → 任务的工作流确保代码与业务需求对齐**

## 安装

### 系统要求

- Node.js ≥ v18.0.0
- npm 或 yarn
- Claude Desktop 或任何 MCP 兼容客户端

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
git clone https://github.com/linkdai/specs-mcp.git
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

## 使用方法

安装后，MCP 服务器通过 Claude 提供以下命令：

### 初始化新功能

```
初始化用户认证功能的规范工作流
```

这将创建一个包含以下部分的结构化需求文档：
- 功能概述
- 用户故事
- 功能需求
- 非功能需求
- 技术约束

### 检查进度并生成下一个文档

```
检查规范工作流进度
```

服务器会分析您当前的文档并：
- 显示每个部分的完成状态
- 识别缺失或不完整的区域
- 自动生成工作流中的下一个文档

### 完成任务

```
完成实施计划中的任务 #3
```

标记特定任务为已完成并跟踪整体进度。

### 跳过阶段

```
跳过设计阶段，直接进入实施
```

灵活地调整工作流以适应您的项目需求。

## 工作流阶段

1. **需求收集** → 2. **系统设计** → 3. **实施规划**

每个阶段都包含：
- 结构化模板
- 验证规则
- AI 驱动的内容生成
- 进度跟踪

## 功能特性

- 📝 **智能模板**：遵循最佳实践的预定义文档结构
- 🤖 **AI 驱动生成**：基于项目上下文的智能内容建议
- ✅ **进度跟踪**：可视化进度指示器和完成度跟踪
- 🔄 **灵活工作流**：可跳过阶段或调整流程以适应需求
- 📊 **质量验证**：自动检查文档完整性
- 🔗 **MCP 集成**：与 Claude 和其他 MCP 客户端无缝协作
- 🎯 **顺序任务执行**：AI 按照任务顺序完成，保持专注和上下文
- 🔄 **需求驱动开发**：从业务需求到代码实现的结构化步骤

## 示例工作流

1. 从一个功能想法开始：
   ```
   "我需要构建一个用户认证系统"
   ```

2. 初始化工作流：
   ```
   初始化用户认证的规范工作流
   ```

3. 审查并增强生成的需求

4. 检查进度并生成设计文档：
   ```
   检查工作流进度
   ```

5. 继续完成设计和实施阶段

6. 跟踪任务完成情况：
   ```
   完成任务 #1：设置认证数据库架构
   ```

## 开发

### 从源码构建

```bash
npm install
npm run build
```

### 在开发模式下运行

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

- [GitHub 仓库](https://github.com/linkdai/specs-mcp)
- [NPM 包](https://www.npmjs.com/package/spec-workflow-mcp)
- [MCP 文档](https://modelcontextprotocol.com)

---

使用 Model Context Protocol 用 ❤️ 构建