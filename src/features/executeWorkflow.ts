/**
 * Workflow execution entry point with remote environment support
 */

import { existsSync } from "fs";
import { getWorkflowStatus, getCurrentStage } from "./shared/documentStatus.js";
import { initWorkflow } from "./init/initWorkflow.js";
import { checkWorkflow } from "./check/checkWorkflow.js";
import { skipStage } from "./skip/skipStage.js";
import { confirmStage } from "./confirm/confirmStage.js";
import { completeTask } from "./task/completeTask.js";
import { resolveRemotePath } from "./shared/remotePathUtils.js";
import { WorkflowResult } from "./shared/mcpTypes.js";

export interface WorkflowArgs {
  path: string;
  action?: {
    type: string;
    featureName?: string;
    introduction?: string;
    taskNumber?: string | string[];
  };
}

export async function executeWorkflow(
  args: WorkflowArgs,
  onProgress?: (
    progress: number,
    total: number,
    message: string
  ) => Promise<void>
): Promise<WorkflowResult> {
  // Resolve path for remote environment compatibility
  const resolvedPath = resolveRemotePath(args.path);
  const { action } = args;

  if (!action) {
    return getStatus(resolvedPath);
  }

  switch (action.type) {
    case "init":
      if (!action.featureName || !action.introduction) {
        return {
          displayText:
            "❌ Initialization requires featureName and introduction parameters",
          data: {
            success: false,
            error: "Missing required parameters",
          },
        };
      }
      return initWorkflow({
        path: resolvedPath,
        featureName: action.featureName,
        introduction: action.introduction,
        onProgress,
      });

    case "check":
      return checkWorkflow({ path: resolvedPath, onProgress });

    case "skip":
      return skipStage({ path: resolvedPath });

    case "confirm":
      return confirmStage({ path: resolvedPath });

    case "complete_task":
      if (!action.taskNumber) {
        return {
          displayText: "❌ Completing task requires taskNumber parameter",
          data: {
            success: false,
            error: "Missing required parameters",
          },
        };
      }
      return completeTask({
        path: resolvedPath,
        taskNumber: action.taskNumber,
      });

    default:
      return {
        displayText: `❌ Unknown operation type: ${action.type}`,
        data: {
          success: false,
          error: `Unknown operation type: ${action.type}`,
        },
      };
  }
}

function getStatus(path: string): WorkflowResult {
  if (!existsSync(path)) {
    return {
      displayText: `📁 Directory does not exist

Please use init operation to initialize:
\`\`\`json
{
  "action": {
    "type": "init",
    "featureName": "Feature name",
    "introduction": "Feature description"
  }
}
\`\`\``,
      data: {
        message: "Directory does not exist, initialization required",
      },
    };
  }

  const status = getWorkflowStatus(path);
  const stage = getCurrentStage(status, path);

  return {
    displayText: `📊 Current status

Available operations:
- check: Check current stage
- skip: Skip current stage`,
    data: {
      message: "Please select an operation",
      stage,
    },
  };
}
