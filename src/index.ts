#!/usr/bin/env node

/**
 * MCP specification workflow server
 * Standard implementation based on MCP SDK with Remote SSH support
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { specWorkflowTool } from "./tools/specWorkflowTool.js";
import { openApiLoader } from "./features/shared/openApiLoader.js";
import {
  logRemoteEnvironment,
  detectRemoteEnvironment,
} from "./features/shared/remotePathUtils.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);

// Create server instance
const server = new McpServer({
  name: "specs-workflow-mcp",
  version: packageJson.version,
});

// Register tools
specWorkflowTool.register(server);

// Start server
async function main(): Promise<void> {
  try {
    // Log remote environment info for debugging
    const remoteInfo = detectRemoteEnvironment();
    if (remoteInfo.isRemote) {
      logRemoteEnvironment();

      // Show environment-specific messages
      if (remoteInfo.isWSL) {
        process.stderr.write(
          `🐧 Running in WSL environment: ${
            remoteInfo.wslDistribution || "Unknown"
          } v${remoteInfo.wslVersion || "?"}\n`
        );
        if (remoteInfo.windowsPath) {
          process.stderr.write(
            `🗂️  Windows mount point: ${remoteInfo.windowsPath}\n`
          );
        }
      } else {
        process.stderr.write(
          `🌐 Running in ${remoteInfo.environmentType} environment: ${remoteInfo.remoteUser}@${remoteInfo.remoteHost}\n`
        );
      }
    }

    // Initialize OpenAPI loader to ensure examples are cached
    openApiLoader.loadSpec();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    process.stderr.write("✨ MCP specification workflow server started\n");
    process.stderr.write(
      `📍 Version: ${packageJson.version} (Fully compliant with MCP best practices)\n`
    );
    if (remoteInfo.isRemote) {
      const modeText = remoteInfo.isWSL
        ? "🐧 WSL development mode enabled"
        : "🔗 Remote SSH development mode enabled";
      process.stderr.write(`${modeText}\n`);
    }
  } catch (error) {
    process.stderr.write(`❌ Startup failed: ${error}\n`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  process.stderr.write("\n👋 Server shutdown\n");
  process.exit(0);
});

main();
