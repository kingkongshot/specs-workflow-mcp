# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/spec-workflow-mcp.svg)](https://www.npmjs.com/package/spec-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.com)

[English](README.md) | [简体中文](README-zh.md)

An intelligent MCP server that guides AI to create software project specifications through a structured **spec workflow**: Requirements → Design → Tasks.

## Quick Start - How to Use

After installation, simply tell your AI assistant:

### Start a New Project
```
"Help me use spec workflow to create a user authentication system"
```
or
```
"Use spec workflow to organize our chat history into project documentation"
```

The AI will:
1. 📝 Create a requirements document based on user stories
2. 🎨 Generate a design document with technical details
3. ✅ List clear implementation tasks
4. 🚀 Guide development following the task list

### Continue Existing Project
```
"Use spec workflow to check ./my-project"
```

The AI will pick up where you left off and continue the workflow.

### How It Works

1. **You describe what you want** - Just explain your project idea
2. **AI creates structured docs** - Requirements → Design → Tasks
3. **You review and approve** - Each stage needs your confirmation
4. **Development follows tasks** - Clear, trackable implementation

Each step requires your approval before proceeding, ensuring you maintain control over the project direction.

## Document Structure

Spec Workflow MCP organizes your project documentation into modules. You can tell the AI to place documents in any directory by saying "put the docs in my-project/example/". If no specific directory is requested, it will default to a `specs` directory. 

**Important**: While the directory location is flexible, each feature module MUST contain all three documentation files together in the same directory for proper workflow tracking and progress management.

### Single Module Structure
```
my-project/specs/
├── requirements.md              # User stories and functional requirements
├── design.md                    # Technical architecture and design decisions
├── tasks.md                     # Implementation task list
└── .workflow-confirmations.json # Workflow state and progress tracking
```

### Multiple Modules Example
```
my-project/specs/
├── user-authentication/
│   ├── requirements.md              # Auth user stories: login, registration, password reset
│   ├── design.md                    # JWT strategy, database schema, API endpoints
│   ├── tasks.md                     # Tasks: setup DB, implement JWT, create API routes
│   └── .workflow-confirmations.json # Status: requirements ✓, design ✓, tasks in progress
│
├── payment-system/
│   ├── requirements.md              # Payment processing requirements, compliance needs
│   ├── design.md                    # Stripe integration, webhook handling, security
│   ├── tasks.md                     # Tasks: Stripe SDK setup, webhook endpoints, testing
│   └── .workflow-confirmations.json # Status: requirements ✓, design pending
│
└── notification-service/
    ├── requirements.md              # Email/SMS/Push notification requirements
    ├── design.md                    # Queue architecture, template system, providers
    ├── tasks.md                     # Tasks: setup queues, integrate providers, templates
    └── .workflow-confirmations.json # Status: requirements pending
```

This modular approach allows you to:
- Work on multiple features in parallel
- Track progress independently for each module
- Maintain clear separation of concerns
- Resume work on any module at any time

### Flexible Directory Placement
```
# You can specify custom directories:
"Use spec workflow to create auth docs in ./src/features/auth"
"Use spec workflow to organize payments in ./modules/payment"

# Result: Documents will be created in your specified location
./src/features/auth/
├── requirements.md
├── design.md
├── tasks.md
└── .workflow-confirmations.json
```

## Installation

<details>
<summary>📦 Installation Instructions</summary>

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

## Example Workflow

<details>
<summary>📋 See Complete Example</summary>

### 1. Start with an idea
```
You: "I need to build a user authentication system"
```

### 2. AI creates requirements
```
AI: "I'll help you create spec workflow for user authentication. Let me start with the requirements document..."

[Creates requirements.md with user stories, functional requirements, etc.]

AI: "I've created the requirements document. Please review it and let me know if you'd like any changes."
```

### 3. Review and confirm
```
You: "Looks good, continue"
```

### 4. AI creates design
```
AI: "Now I'll create the technical design based on these requirements..."

[Creates design.md with architecture, API design, database schema, etc.]
```

### 5. AI creates tasks
```
AI: "Based on the design, here are the implementation tasks..."

[Creates tasks.md with numbered task list]
```

### 6. Start development
```
AI: "Let's start with Task 1: Set up authentication database schema..."

[Implements each task in order]
```

</details>

## Key Features

- 📝 **User Story Based**: Start with user stories and transform them into technical requirements
- 🔄 **Three-Phase Workflow**: Requirements → Design → Tasks with progress tracking
- ✅ **Task Management**: Clear task lists with completion tracking
- 🎯 **Sequential Execution**: AI completes tasks in order, maintaining focus and context
- 🔒 **Approval Gates**: Each phase requires your confirmation before proceeding

## What is Spec Workflow MCP?

Spec Workflow MCP helps development teams maintain high-quality project documentation by providing an AI-powered workflow that guides you through creating comprehensive specifications.

### ❌ Without Spec Workflow MCP

- Inconsistent documentation across projects
- Missing critical requirements details  
- Unstructured design decisions
- Unclear implementation tasks
- Manual tracking of document completion
- **AI jumps between tasks randomly without structure**
- **No connection between requirements and actual code implementation**

### ✅ With Spec Workflow MCP

- Standardized document templates for requirements, design, and tasks
- AI-guided document generation based on best practices
- Automatic progress tracking and workflow management
- Smart validation of document completeness
- Seamless integration with Claude and other MCP-compatible tools
- **AI follows task order systematically, completing one before moving to the next**
- **Requirements → Design → Tasks workflow ensures code aligns with business needs**

## Workflow Stages

1. **Requirements Gathering** → 2. **System Design** → 3. **Implementation Planning**

Each stage has:
- Structured templates
- Validation rules
- AI-powered content generation
- Progress tracking

## Development

### Build from Source

```bash
npm install
npm run build
```

### Run in Development Mode

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Debug with MCP Inspector

```bash
npm run inspector
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Links

- [GitHub Repository](https://github.com/kingkongshot/specs-mcp)
- [NPM Package](https://www.npmjs.com/package/spec-workflow-mcp)
- [MCP Documentation](https://modelcontextprotocol.com)

---

<a href="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kingkongshot/specs-workflow-mcp/badge" alt="Spec Workflow MCP server" />
</a>