#!/usr/bin/env node

/**
 * MCP specification workflow server
 * Standard implementation based on MCP SDK
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { specWorkflowTool } from './tools/specWorkflowTool.js';
import { openApiLoader } from './features/shared/openApiLoader.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

// Create server instance
const server = new McpServer({
  name: 'specs-workflow-mcp',
  version: packageJson.version
});

// Register tools
specWorkflowTool.register(server);

// Start server
async function main(): Promise<void> {
  try {
    // Initialize OpenAPI loader to ensure examples are cached
    openApiLoader.loadSpec();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    // eslint-disable-next-line no-console
    console.error('✨ MCP specification workflow server started');
    // eslint-disable-next-line no-console
    console.error(`📍 Version: ${packageJson.version} (Fully compliant with MCP best practices)`);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Startup failed:', error);
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
}

// Graceful shutdown
// eslint-disable-next-line no-undef
process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.error('\n👋 Server shutdown');
  // eslint-disable-next-line no-undef
  process.exit(0);
});

main();