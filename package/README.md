# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/spec-workflow-mcp.svg)](https://www.npmjs.com/package/spec-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.com)

[English](README.md) | [简体中文](README-zh.md)

An intelligent MCP server for managing software project specifications through a structured workflow of requirements, design, and implementation documents.

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

## Installation

### Requirements

- Node.js ≥ v18.0.0
- npm or yarn
- Claude Desktop or any MCP-compatible client

### Quick Start with npx

```bash
npx spec-workflow-mcp
```

### Install in Claude Code (Recommended)

Use the Claude CLI to add the MCP server:

```bash
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest
```

### Install in Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": ["-y", "spec-workflow-mcp"]
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

## Usage

Once installed, the MCP server provides the following commands through Claude:

### Initialize a New Feature

```
Initialize spec workflow for "user authentication feature"
```

This creates a structured requirements document with sections for:
- Feature overview
- User stories
- Functional requirements
- Non-functional requirements
- Technical constraints

### Check Progress and Generate Next Document

```
Check spec workflow progress
```

The server analyzes your current documentation and:
- Shows completion status for each section
- Identifies missing or incomplete areas
- Automatically generates the next document in the workflow

### Complete Tasks

```
Complete task #3 in the implementation plan
```

Mark specific tasks as completed and track overall progress.

### Skip Stages

```
Skip the design stage and go to implementation
```

Flexibility to adapt the workflow to your project needs.

## Workflow Stages

1. **Requirements Gathering** → 2. **System Design** → 3. **Implementation Planning**

Each stage has:
- Structured templates
- Validation rules
- AI-powered content generation
- Progress tracking

## Features

- 📝 **Smart Templates**: Pre-defined document structures following best practices
- 🤖 **AI-Powered Generation**: Intelligent content suggestions based on your project context
- ✅ **Progress Tracking**: Visual progress indicators and completion tracking
- 🔄 **Flexible Workflow**: Skip stages or adapt the process to your needs
- 📊 **Quality Validation**: Automatic checks for document completeness
- 🔗 **MCP Integration**: Works seamlessly with Claude and other MCP clients
- 🎯 **Sequential Task Execution**: AI completes tasks in order, maintaining focus and context
- 🔄 **Requirements-Driven Development**: From business needs to code implementation in structured steps

## Example Workflow

1. Start with a feature idea:
   ```
   "I need to build a user authentication system"
   ```

2. Initialize the workflow:
   ```
   Initialize spec workflow for "user authentication"
   ```

3. Review and enhance the generated requirements

4. Check progress and generate design document:
   ```
   Check workflow progress
   ```

5. Continue through design and implementation stages

6. Track task completion:
   ```
   Complete task #1: Set up authentication database schema
   ```

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

Built with ❤️ using the Model Context Protocol