/**
 * Task guidance template extractor
 * Reads task completion guidance text templates from OpenAPI specification
 */

import { openApiLoader, OpenApiLoader } from "./openApiLoader.js";

export class TaskGuidanceExtractor {
  private static _template:
    | ReturnType<typeof openApiLoader.getTaskGuidanceTemplate>
    | undefined;

  private static get template(): ReturnType<
    typeof openApiLoader.getTaskGuidanceTemplate
  > {
    if (!this._template) {
      // Lazy loading to ensure OpenAPI spec is loaded
      openApiLoader.loadSpec();
      this._template = openApiLoader.getTaskGuidanceTemplate();
    }
    return this._template;
  }

  /**
   * Build task guidance text
   * Read templates from OpenAPI spec and assemble them
   */
  static buildGuidanceText(
    nextTaskContent: string,
    firstSubtask: string,
    taskNumber?: string,
    isFirstTask: boolean = false
  ): string {
    const template = this.template;
    if (!template) {
      throw new Error(
        "Failed to load task guidance template from OpenAPI specification"
      );
    }

    const parts: string[] = [];

    // Add separator line
    parts.push(template.separator);
    parts.push("");

    // Add task header
    parts.push(template.header);
    parts.push(nextTaskContent);
    parts.push("");

    // Add model instructions
    parts.push(template.instructions.prefix);
    const taskFocusText = OpenApiLoader.replaceVariables(
      template.instructions.taskFocus,
      { firstSubtask }
    );
    parts.push(taskFocusText);

    parts.push("");
    parts.push(template.instructions.progressTracking);
    parts.push(template.instructions.workflow);
    parts.push("");

    // Add model prompt based on scenario
    let prompt: string;
    if (isFirstTask) {
      // Replace firstSubtask placeholder in firstTask prompt
      prompt = OpenApiLoader.replaceVariables(template.prompts.firstTask, {
        firstSubtask,
      });
    } else if (taskNumber) {
      // Determine if it's a new task or continuation
      if (taskNumber.includes(".")) {
        // Subtask, use continuation prompt
        prompt = OpenApiLoader.replaceVariables(template.prompts.continueTask, {
          taskNumber,
          firstSubtask,
        });
      } else {
        // Main task, use new task prompt
        prompt = OpenApiLoader.replaceVariables(template.prompts.nextTask, {
          taskNumber,
          firstSubtask,
        });
      }
    } else {
      // Batch completion scenario, no specific task number
      prompt = OpenApiLoader.replaceVariables(template.prompts.batchContinue, {
        firstSubtask,
      });
    }

    parts.push(prompt);

    return parts.join("\n");
  }

  /**
   * Extract the first uncompleted task with its context
   */
  static extractFirstSubtask(taskContent: string): string {
    const taskLines = taskContent.split("\n");
    let firstSubtaskFound = false;
    let firstSubtaskLines: string[] = [];
    let currentIndent = "";

    for (let i = 0; i < taskLines.length; i++) {
      const line = taskLines[i];

      // 忽略空行（但在收集过程中保留）
      if (!line.trim()) {
        if (firstSubtaskFound) {
          firstSubtaskLines.push(line);
        }
        continue;
      }

      // 寻找第一个包含 [ ] 的行（未完成任务）
      if (line.includes("[ ]") && !firstSubtaskFound) {
        // 提取任务号验证这是一个子任务（包含点号）
        const taskMatch = line.match(/(\d+(?:\.\d+)+)\./);
        if (taskMatch) {
          firstSubtaskFound = true;
          firstSubtaskLines.push(line);
          currentIndent = line.match(/^(\s*)/)?.[1] || "";
          continue;
        }
      }

      // 如果已经找到第一个子任务，继续收集其详细内容
      if (firstSubtaskFound) {
        const lineIndent = line.match(/^(\s*)/)?.[1] || "";

        // 如果遇到同级或更高级的任务，停止收集
        if (line.includes("[ ]") && lineIndent.length <= currentIndent.length) {
          break;
        }

        // 如果是更深层次的缩进内容，继续收集
        if (
          lineIndent.length > currentIndent.length ||
          line.trim().startsWith("-") ||
          line.trim().startsWith("*")
        ) {
          firstSubtaskLines.push(line);
        } else {
          // 遇到非缩进内容，停止收集
          break;
        }
      }
    }

    // 如果找到了第一个子任务，返回其完整内容
    if (firstSubtaskLines.length > 0) {
      return firstSubtaskLines.join("\n").trim();
    }

    // 如果没有找到子任务，尝试找第一个未完成的任务
    for (const line of taskLines) {
      if (!line.trim()) continue;

      if (line.includes("[ ]")) {
        const taskMatch = line.match(/(\d+(?:\.\d+)*)\.\s*(.+)/);
        if (taskMatch) {
          const taskNumber = taskMatch[1];
          const taskDesc = taskMatch[2].replace(/\*\*|\*/g, "").trim();
          return `${taskNumber}. ${taskDesc}`;
        }
        return line
          .replace(/[-[\]\s]/g, "")
          .replace(/\*\*|\*/g, "")
          .trim();
      }
    }

    return "Next task";
  }

  /**
   * Get completion message
   */
  static getCompletionMessage(
    type:
      | "taskCompleted"
      | "allCompleted"
      | "alreadyCompleted"
      | "batchSucceeded"
      | "batchCompleted",
    taskNumber?: string
  ): string {
    const template = this.template;
    if (!template) {
      throw new Error(
        "Failed to load task guidance template from OpenAPI specification"
      );
    }

    const message = template.completionMessages[type];
    if (taskNumber && message.includes("${taskNumber}")) {
      return OpenApiLoader.replaceVariables(message, { taskNumber });
    }
    return message;
  }
}
