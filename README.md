# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/spec-workflow-mcp.svg)](https://www.npmjs.com/package/spec-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.com)

[English](README.md) | [简体中文](README-zh.md)

Guide AI to systematically complete software development through a structured **Requirements → Design → Tasks** workflow, ensuring code implementation stays aligned with business needs.

## Table of Contents

- [Why Use It?](#why-use-it)
- [Recent Updates](#recent-updates)
- [Quick Start](#quick-start)
- [Remote Development](#remote-development)
  - [VS Code Remote SSH](#vs-code-remote-ssh)
  - [WSL Development](#wsl-development)
- [Workflow Example](#workflow-example)
- [Document Organization](#document-organization)
- [Installation](#installation)
- [Development Environment Setup](#development-environment-setup)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Why Use It?

### ❌ Without Spec Workflow

- AI jumps randomly between tasks, lacking systematic approach
- Requirements disconnect from actual code implementation
- Scattered documentation, difficult to track project progress
- Missing design decision records

### ✅ With Spec Workflow

- AI completes tasks sequentially, maintaining focus and context
- Complete traceability from user stories to code implementation
- Standardized document templates with automatic progress management
- Each stage requires confirmation, ensuring correct direction
- **Persistent progress**: Continue from where you left off with `check`, even in new conversations

## Recent Updates

> **v1.0.8**
>
> - 🌐 **Remote Development Support**: Full VS Code Remote SSH compatibility with automatic environment detection and path resolution
> - 🐧 **WSL Support**: Complete WSL (Windows Subsystem for Linux) integration with Windows-Linux path conversion and environment detection
>
> **v1.0.7**
>
> - 🎯 Improved reliability for most models to manage tasks with spec workflow
>
> **v1.0.6**
>
> - ✨ Batch task completion: Complete multiple tasks at once for faster progress on large projects
>
> **v1.0.5**
>
> - 🐛 Edge case fixes: Distinguish between "task not found" and "task already completed" to prevent workflow interruption
>
> **v1.0.4**
>
> - ✅ Task management: Added task completion tracking for systematic project progression
>
> **v1.0.3**
>
> - 🎉 Initial release: Core workflow framework for Requirements → Design → Tasks

## Quick Start

### 1. Install (Claude Code Example)

```bash
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest
```

See [full installation guide](#installation) for other clients.

### 2. Start a New Project

```
"Help me use spec workflow to create a user authentication system"
```

### 3. Continue Existing Project

```
"Use spec workflow to check ./my-project"
```

The AI will automatically detect project status and continue from where it left off.

---

## Remote Development

This MCP server includes comprehensive support for remote development environments with automatic detection and configuration.

### Supported Environments

- **Local Development**: Standard local file system
- **VS Code Remote SSH**: SSH connections with automatic path resolution
- **WSL**: Windows Subsystem for Linux with Windows-Linux path conversion
- **Containers**: Docker and other containerized environments

### Quick Start

#### Remote SSH Setup

```bash
# 1. Connect via VS Code Remote SSH
# 2. Clone and setup
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp
./scripts/setup-remote.sh
```

#### WSL Setup

```bash
# In WSL terminal
git clone https://github.com/kingkongshot/specs-workflow-mcp.git
cd specs-workflow-mcp
./scripts/setup-remote.sh  # Auto-detects WSL
```

### Key Features

- 🔍 **Automatic Environment Detection**: Detects SSH, WSL, and container environments
- �️ **Smart Path Resolution**: Handles cross-platform path conversion
- ⚙️ **VS Code Integration**: Pre-configured tasks, debugging, and extensions
- 📊 **Environment Logging**: Detailed environment information for troubleshooting

### Detailed Documentation

For complete setup guides, troubleshooting, and advanced configuration:

- 📖 [Remote SSH Development Guide](./docs/REMOTE-DEVELOPMENT.md)
- 🐧 [WSL Development Guide](./docs/WSL-DEVELOPMENT.md)
- ⚙️ [Technical Implementation Details](./docs/)

---

## Workflow Example

### 1. You describe requirements

```
You: "I need to build a user authentication system"
```

### 2. AI creates structured documents

```
AI: "I'll help you create spec workflow for user authentication..."

📝 requirements.md - User stories and functional requirements
🎨 design.md - Technical architecture and design decisions
✅ tasks.md - Concrete implementation task list
```

### 3. Review and implement step by step

After each stage, the AI requests your confirmation before proceeding, ensuring the project stays on the right track.

## Document Organization

### Basic Structure

```
my-project/specs/
├── requirements.md              # Requirements: user stories, functional specs
├── design.md                    # Design: architecture, APIs, data models
├── tasks.md                     # Tasks: numbered implementation steps
└── .workflow-confirmations.json # Status: automatic progress tracking
```

### Multi-module Projects

```
my-project/specs/
├── user-authentication/         # Auth module
├── payment-system/             # Payment module
└── notification-service/       # Notification module
```

You can specify any directory: `"Use spec workflow to create auth docs in ./src/features/auth"`

## 📦 Installation

<details>
<summary>Installation Instructions</summary>

### Requirements

- Node.js ≥ v18.0.0
- npm or yarn
- Claude Desktop or any MCP-compatible client

### Install in Different MCP Clients

#### Claude Code (Recommended)

Use the Claude CLI to add the MCP server:

```bash
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest
```

#### Claude Desktop

Add to your Claude Desktop configuration:

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

Add to your Cursor configuration (`~/.cursor/config.json`):

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

Use Cline's MCP server management UI to add the server:

1. Open VS Code with Cline extension
2. Open Cline settings (gear icon)
3. Navigate to MCP Servers section
4. Add new server with:
   - Command: `npx`
   - Arguments: `-y spec-workflow-mcp@latest`

#### Windsurf (Codeium)

Add to your Windsurf configuration (`~/.codeium/windsurf/mcp_config.json`):

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

#### VS Code (with MCP extension)

Add to your VS Code settings (`settings.json`):

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

Add to your Zed configuration (`~/.config/zed/settings.json`):

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

### Install from Source

```bash
git clone https://github.com/kingkongshot/specs-mcp.git
cd specs-mcp
npm install
npm run build
```

Then add to Claude Desktop configuration:

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

## 🤖 AI Usage Guide

### Make AI Use This Tool Better

**Strongly recommended** to add the following prompt to your AI assistant configuration. Without it, AI may:

- ❌ Not know when to invoke Spec Workflow
- ❌ Forget to manage task progress, causing disorganized work
- ❌ Not utilize Spec Workflow for systematic documentation
- ❌ Unable to continuously track project status

With this configuration, AI will intelligently use Spec Workflow to manage the entire development process.

> **Configuration Note**: Please modify the following based on your needs:
>
> 1. Change `./specs` to your preferred documentation directory path
> 2. Change "English" to your preferred documentation language (e.g., "Chinese")

```
# Spec Workflow Usage Guidelines

## 1. Check Project Progress
When user mentions continuing previous project or is unsure about current progress, proactively use:
specs-workflow tool with action.type="check" and path="./specs"

## 2. Documentation Language
All spec workflow documents should be written in English consistently, including all content in requirements, design, and task documents.

## 3. Documentation Directory
All spec workflow documents should be placed in ./specs directory to maintain consistent project documentation organization.

## 4. Task Management
Always use the following to manage task progress:
specs-workflow tool with action.type="complete_task" and taskNumber="current task number"
Follow the workflow guidance to continue working until all tasks are completed.

## 5. Best Practices
- Proactive progress check: When user says "continue from last time", first use check to see current status
- Language consistency: Use the same language throughout all project documents
- Flexible structure: Choose single-module or multi-module organization based on project scale
- Task granularity: Each task should be completable within 1-2 hours
```

## 🔗 Links

- [GitHub Repository](https://github.com/kingkongshot/specs-mcp)
- [NPM Package](https://www.npmjs.com/package/spec-workflow-mcp)
- [Report Issues](https://github.com/kingkongshot/specs-mcp/issues)
- [Technical Documentation](./docs/README.md) - Remote development and implementation guides

## 📄 License

MIT License

---

<a href="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp/badge" alt="Spec Workflow MCP server" />
</a>
