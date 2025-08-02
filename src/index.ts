#!/usr/bin/env node

/**
 * MCP specification workflow server
 * Standard implementation based on MCP SDK
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { specWorkflowTool } from './tools/specWorkflowTool.js';

// Create server instance
const server = new McpServer({
  name: 'specs-workflow-mcp',
  version: '3.0.0'
});

// Register tools
specWorkflowTool.register(server);

// Start server
async function main(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // eslint-disable-next-line no-console
    console.error('✨ MCP specification workflow server started');
    // eslint-disable-next-line no-console
    console.error('📍 Version: 3.0.0 (Fully compliant with MCP best practices)');
    
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