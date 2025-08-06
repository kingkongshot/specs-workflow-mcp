/**
 * Intelligent specification workflow tool
 * Implementation fully compliant with MCP best practices
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeWorkflow } from '../features/executeWorkflow.js';
import { toMcpResult } from '../features/shared/mcpTypes.js';

// Input parameter Schema
const inputSchema = {
  path: z.string().describe('Specification directory path (e.g., /Users/link/specs-mcp/batch-log-test)'),
  action: z.object({
    type: z.enum(['init', 'check', 'skip', 'confirm', 'complete_task']).describe('Operation type'),
    featureName: z.string().optional().describe('Feature name (required for init)'),
    introduction: z.string().optional().describe('Feature introduction (required for init)'),
    taskNumber: z.union([
      z.string(),
      z.array(z.string())
    ]).optional().describe('Task number(s) to mark as completed (required for complete_task). Can be a single string or an array of strings')
  }).optional().describe('Operation parameters')
};

export const specWorkflowTool = {
  /**
   * Register tool to MCP server
   */
  register(server: McpServer): void {
    server.registerTool(
      'specs-workflow',
      {
        title: 'Intelligent Specification Workflow Tool',  // Added title property
        description: 'Manage intelligent writing workflow for software project requirements, design, and task documents. Supports initialization, checking, skipping, confirmation, and task completion operations (single or batch).',
        inputSchema,
        annotations: {
          progressReportingHint: true,
          longRunningHint: true,
          readOnlyHint: false,      // This tool modifies files
          idempotentHint: false     // Operation is not idempotent
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (args, _extra) => {
        try {
          // Temporarily not using progress callback, as MCP SDK type definitions may differ
          const onProgress = undefined;
          
          // Execute workflow
          const workflowResult = await executeWorkflow({
            path: args.path,
            action: args.action
          }, onProgress);
          
          // Use standard MCP format converter
          const mcpResult = toMcpResult(workflowResult);
          
          // Return format that meets SDK requirements, including structuredContent
          const callToolResult: Record<string, unknown> = {
            content: mcpResult.content,
            isError: mcpResult.isError
          };
          
          if (mcpResult.structuredContent !== undefined) {
            callToolResult.structuredContent = mcpResult.structuredContent;
          }
          
          // Type assertion to satisfy MCP SDK requirements
          return callToolResult as {
            content: Array<{
              type: 'text';
              text: string;
              [x: string]: unknown;
            }>;
            isError?: boolean;
            [x: string]: unknown;
          };
          
        } catch (error) {
          // Error handling must also comply with MCP format
          return {
            content: [{
              type: 'text' as const,
              text: `Execution failed: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );
  }
};