/**
 * Complete task - 统一使用批量完成逻辑
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  parseTasksFromContent,
  getFirstUncompletedTask,
  formatTaskForFullDisplay,
  Task,
} from "../shared/taskParser.js";
import { responseBuilder } from "../shared/responseBuilder.js";
import { WorkflowResult } from "../shared/mcpTypes.js";
import { BatchCompleteTaskResponse } from "../shared/openApiTypes.js";
import { TaskGuidanceExtractor } from "../shared/taskGuidanceTemplate.js";

export interface CompleteTaskOptions {
  path: string;
  taskNumber: string | string[];
}

export async function completeTask(
  options: CompleteTaskOptions
): Promise<WorkflowResult> {
  const { path, taskNumber } = options;

  // 统一转换为数组格式进行批量处理
  const taskNumbers = Array.isArray(taskNumber) ? taskNumber : [taskNumber];

  if (!existsSync(path)) {
    return {
      displayText: responseBuilder.buildErrorResponse("invalidPath", { path }),
      data: {
        success: false,
        error: "Directory does not exist",
      },
    };
  }

  const tasksPath = join(path, "tasks.md");
  if (!existsSync(tasksPath)) {
    return {
      displayText:
        "❌ Error: tasks.md file does not exist\n\nPlease complete writing the tasks document first.",
      data: {
        success: false,
        error: "tasks.md does not exist",
      },
    };
  }

  // 统一使用批量处理逻辑
  const batchResult = await completeBatchTasks(tasksPath, taskNumbers);
  return {
    displayText: batchResult.displayText,
    data: { ...batchResult },
  };
}

/**
 * Complete multiple tasks in batch
 */
async function completeBatchTasks(
  tasksPath: string,
  taskNumbers: string[]
): Promise<BatchCompleteTaskResponse> {
  // Read tasks file
  const originalContent = readFileSync(tasksPath, "utf-8");
  const tasks = parseTasksFromContent(originalContent);

  // Categorize tasks: already completed, can be completed, cannot be completed
  const alreadyCompleted: string[] = [];
  const canBeCompleted: string[] = [];
  const cannotBeCompleted: Array<{
    taskNumber: string;
    reason: string;
  }> = [];

  for (const taskNum of taskNumbers) {
    const targetTask = findTaskByNumber(tasks, taskNum);

    if (!targetTask) {
      cannotBeCompleted.push({
        taskNumber: taskNum,
        reason: "Task does not exist",
      });
    } else if (targetTask.checked) {
      alreadyCompleted.push(taskNum);
    } else if (
      targetTask.subtasks &&
      targetTask.subtasks.some((s) => !s.checked)
    ) {
      cannotBeCompleted.push({
        taskNumber: taskNum,
        reason: "Has uncompleted subtasks",
      });
    } else {
      canBeCompleted.push(taskNum);
    }
  }

  // If there are tasks that cannot be completed (excluding already completed), return error
  if (cannotBeCompleted.length > 0) {
    const errorMessages = cannotBeCompleted
      .map((v) => `- ${v.taskNumber}: ${v.reason}`)
      .join("\n");

    return {
      success: false,
      completedTasks: [],
      alreadyCompleted: [],
      failedTasks: cannotBeCompleted,
      displayText: `❌ Batch task completion failed\n\nThe following tasks cannot be completed:\n${errorMessages}\n\nPlease resolve these issues and try again.`,
    };
  }

  // If no tasks can be completed but there are already completed tasks, still return success
  if (canBeCompleted.length === 0 && alreadyCompleted.length > 0) {
    const allTasks = parseTasksFromContent(originalContent);
    const nextTask = getFirstUncompletedTask(allTasks);

    const alreadyCompletedText = alreadyCompleted
      .map((t) => `- ${t} (already completed)`)
      .join("\n");

    const displayText = `${TaskGuidanceExtractor.getCompletionMessage(
      "batchCompleted"
    )}\n\nThe following tasks were already completed:\n${alreadyCompletedText}\n\n${
      nextTask
        ? `Next task: ${nextTask.number}. ${nextTask.description}`
        : TaskGuidanceExtractor.getCompletionMessage("allCompleted")
    }`;

    return {
      success: true,
      completedTasks: [],
      alreadyCompleted,
      nextTask: nextTask
        ? {
            number: nextTask.number,
            description: nextTask.description,
          }
        : undefined,
      hasNextTask: nextTask !== null,
      displayText,
    };
  }

  // Execution phase: complete tasks in dependency order
  let currentContent = originalContent;
  const actuallyCompleted: string[] = [];
  const results: Array<{
    taskNumber: string;
    success: boolean;
    status: "completed" | "already_completed" | "failed";
  }> = [];

  try {
    // Sort by task number, ensure parent tasks are processed after subtasks (avoid dependency conflicts)
    const sortedTaskNumbers = [...canBeCompleted].sort((a, b) => {
      // Subtasks first (numbers with more dots have priority)
      const aDepth = a.split(".").length;
      const bDepth = b.split(".").length;
      if (aDepth !== bDepth) {
        return bDepth - aDepth; // Process deeper levels first
      }
      return a.localeCompare(b); // Same depth, sort by string
    });

    for (const taskNum of sortedTaskNumbers) {
      const updatedContent = markTaskAsCompleted(currentContent, taskNum);

      if (!updatedContent) {
        // This should not happen as we have already validated
        throw new Error(
          `Unexpected error: Task ${taskNum} could not be marked`
        );
      }

      currentContent = updatedContent;
      actuallyCompleted.push(taskNum);
      results.push({
        taskNumber: taskNum,
        success: true,
        status: "completed" as const,
      });
    }

    // Add results for already completed tasks
    for (const taskNum of alreadyCompleted) {
      results.push({
        taskNumber: taskNum,
        success: true,
        status: "already_completed" as const,
      });
    }

    // All tasks completed successfully, save file
    if (actuallyCompleted.length > 0) {
      writeFileSync(tasksPath, currentContent, "utf-8");
    }

    // Build success response
    const allTasks = parseTasksFromContent(currentContent);
    const nextTask = getFirstUncompletedTask(allTasks);

    // Build detailed completion information
    let completedInfo = "";
    if (actuallyCompleted.length > 0) {
      completedInfo +=
        "Newly completed tasks:\n" +
        actuallyCompleted.map((t) => `- ${t}`).join("\n");
    }
    if (alreadyCompleted.length > 0) {
      if (completedInfo) completedInfo += "\n\n";
      completedInfo +=
        "Already completed tasks:\n" +
        alreadyCompleted.map((t) => `- ${t} (already completed)`).join("\n");
    }

    let displayText = `${TaskGuidanceExtractor.getCompletionMessage(
      "batchSucceeded"
    )}\n\n${completedInfo}`;

    // Add enhanced guidance for next task
    if (nextTask) {
      // 获取主任务的完整内容用于显示任务块
      let mainTask = nextTask;
      let mainTaskContent = "";

      // 如果当前是子任务，需要找到对应的主任务
      if (nextTask.number.includes(".")) {
        const mainTaskNumber = nextTask.number.split(".")[0];
        const mainTaskObj = allTasks.find(
          (task) => task.number === mainTaskNumber
        );
        if (mainTaskObj) {
          mainTask = mainTaskObj;
          mainTaskContent = formatTaskForFullDisplay(mainTask, currentContent);
        } else {
          // 如果找不到主任务，使用当前任务
          mainTaskContent = formatTaskForFullDisplay(nextTask, currentContent);
        }
      } else {
        // 如果本身就是主任务，直接使用
        mainTaskContent = formatTaskForFullDisplay(nextTask, currentContent);
      }

      // 构建下一个具体子任务的描述（用于指导文本）
      let effectiveFirstSubtask: string;
      let actualNextSubtask: Task | null = null;

      if (nextTask.number.includes(".")) {
        // 如果下一个任务是子任务，直接使用
        actualNextSubtask = nextTask;
      } else {
        // 如果下一个任务是主任务，找到第一个未完成的子任务
        if (mainTask.subtasks && mainTask.subtasks.length > 0) {
          actualNextSubtask =
            mainTask.subtasks.find((subtask) => !subtask.checked) || null;
        }
      }

      if (actualNextSubtask) {
        // 使用具体的子任务构建指导文本，包含完整内容
        const nextSubtaskContent = formatTaskForFullDisplay(
          actualNextSubtask,
          currentContent
        );

        if (nextSubtaskContent.trim()) {
          // 如果能获取到完整内容，直接使用
          effectiveFirstSubtask = nextSubtaskContent.trim();
        } else {
          // 如果获取不到完整内容，手动构建
          effectiveFirstSubtask = `- [ ] ${actualNextSubtask.number} ${actualNextSubtask.description}`;

          // 从主任务内容中提取这个子任务的详细信息
          const mainTaskLines = mainTaskContent.split("\n");
          let capturing = false;
          let taskIndent = "";

          for (const line of mainTaskLines) {
            // 找到目标子任务的开始
            if (
              line.includes(
                `${actualNextSubtask.number} ${actualNextSubtask.description}`
              ) ||
              line.includes(
                `${actualNextSubtask.number}. ${actualNextSubtask.description}`
              )
            ) {
              capturing = true;
              taskIndent = line.match(/^(\s*)/)?.[1] || "";
              continue;
            }

            // 如果正在捕获内容
            if (capturing) {
              const lineIndent = line.match(/^(\s*)/)?.[1] || "";

              // 如果遇到下一个任务（同级或更高级），停止捕获
              if (
                line.includes("[ ]") &&
                lineIndent.length <= taskIndent.length
              ) {
                break;
              }

              // 如果是更深层次的内容，添加到结果中
              if (lineIndent.length > taskIndent.length && line.trim()) {
                effectiveFirstSubtask += `\n${line}`;
              }
            }
          }
        }
      } else {
        // 如果找不到具体的子任务，使用主任务
        effectiveFirstSubtask = `${nextTask.number}. ${nextTask.description}`;
      }

      // Build guidance text using the template
      const guidanceText = TaskGuidanceExtractor.buildGuidanceText(
        mainTaskContent, // 显示主任务块
        effectiveFirstSubtask, // 用于指导文本的具体子任务
        undefined, // no specific task number for batch
        false // not first task
      );

      displayText += "\n\n" + guidanceText;
    } else {
      displayText +=
        "\n\n" + TaskGuidanceExtractor.getCompletionMessage("allCompleted");
    }

    return {
      success: true,
      completedTasks: actuallyCompleted,
      alreadyCompleted,
      failedTasks: [],
      results,
      nextTask: nextTask
        ? {
            number: nextTask.number,
            description: nextTask.description,
          }
        : undefined,
      hasNextTask: nextTask !== null,
      displayText,
    };
  } catch (error) {
    // Execution failed, need to rollback to original state
    if (actuallyCompleted.length > 0) {
      writeFileSync(tasksPath, originalContent, "utf-8");
    }

    return {
      success: false,
      completedTasks: [],
      alreadyCompleted: [],
      failedTasks: [
        {
          taskNumber: "batch",
          reason: error instanceof Error ? error.message : String(error),
        },
      ],
      results,
      displayText: `❌ Batch task execution failed\n\nError: ${
        error instanceof Error ? error.message : String(error)
      }\n\nRolled back to original state.`,
    };
  }
}

/**
 * Mark task as completed
 */
function markTaskAsCompleted(
  content: string,
  taskNumber: string
): string | null {
  const lines = content.split("\n");
  const tasks = parseTasksFromContent(content);
  let found = false;

  // Find target task (including subtasks)
  const targetTask = findTaskByNumber(tasks, taskNumber);
  if (!targetTask) {
    return null;
  }

  // Build set of task numbers to mark
  const numbersToMark = new Set<string>();
  numbersToMark.add(taskNumber);

  // If it's a leaf task, check if parent task should be auto-marked
  const parentNumber = taskNumber.substring(0, taskNumber.lastIndexOf("."));
  if (parentNumber && taskNumber.includes(".")) {
    const parentTask = findTaskByNumber(tasks, parentNumber);
    if (parentTask && parentTask.subtasks) {
      // Check if all sibling tasks are completed
      const allSiblingsCompleted = parentTask.subtasks
        .filter((s) => s.number !== taskNumber)
        .every((s) => s.checked);

      if (allSiblingsCompleted) {
        numbersToMark.add(parentNumber);
      }
    }
  }

  // Mark all related tasks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip already completed tasks
    if (!line.includes("[ ]")) continue;

    // Check if line contains task number to mark
    for (const num of numbersToMark) {
      // More robust matching strategy: as long as the line contains both task number and checkbox
      // Don't care about their relative position and format details
      if (containsTaskNumber(line, num)) {
        lines[i] = line.replace("[ ]", "[x]");
        found = true;
        break;
      }
    }
  }

  return found ? lines.join("\n") : null;
}

/**
 * Check if line contains specified task number
 * Use flexible matching strategy, ignore format details
 */
function containsTaskNumber(line: string, taskNumber: string): boolean {
  // Remove checkbox part to avoid interference with matching
  const lineWithoutCheckbox = line.replace(/\[[xX ]\]/g, "");

  // Use more precise matching for task numbers
  // Match the exact task number as a separate token
  const escapedNumber = escapeRegExp(taskNumber);

  // Try multiple patterns to ensure robust matching while avoiding false positives:
  const patterns = [
    // Standard formats at beginning: "- [ ] 3.3 description" or "- [ ] 3.3. description"
    // Must be preceded by whitespace/symbols, followed by separator or end
    `(^|[\\s\\-*]+)${escapedNumber}\\.?(\\s|:|\\)|$)`,
    // Parentheses format: "(3.3)" or "(3.3.)"
    `\\(${escapedNumber}\\.?\\)`,
  ];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern);
    if (regex.test(lineWithoutCheckbox)) {
      return true;
    }
  }

  return false;
}

/**
 * Escape regex special characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursively find task (including subtasks)
 */
function findTaskByNumber(tasks: Task[], targetNumber: string): Task | null {
  for (const task of tasks) {
    if (task.number === targetNumber) {
      return task;
    }

    // Recursively search subtasks
    if (task.subtasks) {
      const found = findTaskByNumber(task.subtasks, targetNumber);
      if (found) {
        return found;
      }
    }
  }

  return null;
}
