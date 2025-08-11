import { openApiLoader } from './openApiLoader.js';
import { OpenApiLoader } from './openApiLoader.js';
import { WorkflowResult } from './mcpTypes.js';
import { isObject, hasProperty, isArray } from './typeGuards.js';
import { TaskGuidanceExtractor } from './taskGuidanceTemplate.js';

// Response builder - builds responses based on OpenAPI specification
export class ResponseBuilder {

  // Build initialization response
  buildInitResponse(path: string, featureName: string): WorkflowResult {
    const example = openApiLoader.getResponseExample('InitResponse', {
      success: true
    });

    if (!example) {
      throw new Error('Initialization response template not found');
    }

    // Deep copy example
    const response = JSON.parse(JSON.stringify(example));

    // Replace variables
    response.displayText = OpenApiLoader.replaceVariables(response.displayText, {
      featureName,
      path,
      progress: response.progress?.overall || 0
    });

    // Update data
    response.data.path = path;
    response.data.featureName = featureName;

    // Resolve resource references
    if (response.resources) {
      response.resources = openApiLoader.resolveResources(response.resources);
    }

    // Embed resources into display text for better client compatibility
    const enhancedDisplayText = this.embedResourcesIntoText(response.displayText, response.resources);

    // Return WorkflowResult format, but include complete OpenAPI response in data
    return {
      displayText: enhancedDisplayText,
      data: response,
      resources: response.resources
    };
  }

  // Build check response
  buildCheckResponse(
    stage: string,
    progress: unknown,
    status: unknown,
    checkResults?: unknown,
    path?: string,
    firstTask?: string | null
  ): WorkflowResult {
    // Select appropriate example based on status type
    const statusType = isObject(status) && 'type' in status ? status.type : 'not_started';

    // Debug info: check examples cache
    const examplesCount = openApiLoader.getExamplesCount('CheckResponse');

    const example = openApiLoader.getResponseExample('CheckResponse', {
      stage,
      'status.type': statusType
    });

    if (!example) {
      throw new Error(`Check response template not found: stage=${stage}, status=${statusType} (cached examples: ${examplesCount})`);
    }

    // Deep copy example
    const response = JSON.parse(JSON.stringify(example));

    // Update actual values
    response.stage = stage;
    
    // Convert progress format to comply with OpenAPI specification
    // If input is WorkflowProgress format, need to convert
    if (isObject(progress) && hasProperty(progress, 'percentage')) {
      // Calculate phase progress based on stage status
      const details = isObject(progress.details) ? progress.details : {};
      const requirements = isObject(details.requirements) ? details.requirements : {};
      const design = isObject(details.design) ? details.design : {};
      const tasks = isObject(details.tasks) ? details.tasks : {};
      
      const requirementsProgress = requirements.confirmed || requirements.skipped ? 100 : 0;
      const designProgress = design.confirmed || design.skipped ? 100 : 0;
      // Tasks stage: only count as progress if confirmed, not skipped
      const tasksProgress = tasks.confirmed ? 100 : 0;
      
      response.progress = this.calculateProgress(requirementsProgress, designProgress, tasksProgress);
    } else {
      // If already in correct format, use directly
      response.progress = progress;
    }
    
    response.status = status;

    // If there are check results, update display text
    if (checkResults && response.displayText.includes('The tasks document includes')) {
      // Dynamically build check items list
      const checkItems = this.buildCheckItemsList(checkResults);
      // More precise regex that only matches until next empty line or "Model please" line
      response.displayText = response.displayText.replace(
        /The tasks document includes:[\s\S]*?(?=\n\s*Model please|\n\s*\n\s*Model please|$)/,
        `The tasks document includes:\n${checkItems}\n\n`
      );
    }

    // Replace variables including progress
    const variables: Record<string, unknown> = {};
    if (path) {
      variables.path = path;
    }
    if (response.progress && typeof response.progress.overall === 'number') {
      variables.progress = response.progress.overall;
    }
    response.displayText = OpenApiLoader.replaceVariables(response.displayText, variables);
    
    // If completed stage and has uncompleted tasks, add task information
    if (stage === 'completed' && firstTask) {
      response.displayText += `\n\n📄 Next uncompleted task:\n${firstTask}\n\nModel please ask the user: "Ready to start the next task?"`;
    }

    // Resolve resource references
    if (response.resources) {
      response.resources = openApiLoader.resolveResources(response.resources);
    }

    // Embed resources into display text for better client compatibility
    const enhancedDisplayText = this.embedResourcesIntoText(response.displayText, response.resources);

    // Return WorkflowResult format
    return {
      displayText: enhancedDisplayText,
      data: response,
      resources: response.resources
    };
  }

  // Build skip response
  buildSkipResponse(stage: string, path?: string, progress?: unknown): WorkflowResult {
    const example = openApiLoader.getResponseExample('SkipResponse', {
      stage
    });

    if (!example) {
      throw new Error(`Skip response template not found: stage=${stage}`);
    }

    // Deep copy example
    const response = JSON.parse(JSON.stringify(example));
    response.stage = stage;
    
    // Update progress if provided
    if (progress) {
      // Convert progress format to comply with OpenAPI specification
      if (isObject(progress) && hasProperty(progress, 'percentage')) {
        // Calculate phase progress based on stage status
        const details = isObject(progress.details) ? progress.details : {};
        const requirements = isObject(details.requirements) ? details.requirements : {};
        const design = isObject(details.design) ? details.design : {};
        const tasks = isObject(details.tasks) ? details.tasks : {};
        
        const requirementsProgress = requirements.confirmed || requirements.skipped ? 100 : 0;
        const designProgress = design.confirmed || design.skipped ? 100 : 0;
        // Tasks stage: only count as progress if confirmed, not skipped
        const tasksProgress = tasks.confirmed ? 100 : 0;
        
        response.progress = this.calculateProgress(requirementsProgress, designProgress, tasksProgress);
      } else {
        // If already in correct format, use directly
        response.progress = progress;
      }
    }

    // Replace variables including progress
    const variables: Record<string, unknown> = {};
    if (path) {
      variables.path = path;
    }
    if (response.progress && typeof response.progress.overall === 'number') {
      variables.progress = response.progress.overall;
    }
    response.displayText = OpenApiLoader.replaceVariables(response.displayText, variables);

    // Resolve resource references
    if (response.resources) {
      response.resources = openApiLoader.resolveResources(response.resources);
    }

    // Embed resources into display text for better client compatibility
    const enhancedDisplayText = this.embedResourcesIntoText(response.displayText, response.resources);

    // Return WorkflowResult format
    return {
      displayText: enhancedDisplayText,
      data: response,
      resources: response.resources
    };
  }

  // Build confirm response
  buildConfirmResponse(stage: string, nextStage: string | null, path?: string, firstTaskContent?: string | null, progress?: unknown): WorkflowResult {
    const example = openApiLoader.getResponseExample('ConfirmResponse', {
      stage,
      nextStage: nextStage || null
    });

    if (!example) {
      throw new Error(`Confirm response template not found: stage=${stage}`);
    }

    // Deep copy example
    const response = JSON.parse(JSON.stringify(example));
    response.stage = stage;
    response.nextStage = nextStage;
    
    // Update progress if provided
    if (progress) {
      // Convert progress format to comply with OpenAPI specification
      if (isObject(progress) && hasProperty(progress, 'percentage')) {
        // Calculate phase progress based on stage status
        const details = isObject(progress.details) ? progress.details : {};
        const requirements = isObject(details.requirements) ? details.requirements : {};
        const design = isObject(details.design) ? details.design : {};
        const tasks = isObject(details.tasks) ? details.tasks : {};
        
        const requirementsProgress = requirements.confirmed || requirements.skipped ? 100 : 0;
        const designProgress = design.confirmed || design.skipped ? 100 : 0;
        // Tasks stage: only count as progress if confirmed, not skipped
        const tasksProgress = tasks.confirmed ? 100 : 0;
        
        response.progress = this.calculateProgress(requirementsProgress, designProgress, tasksProgress);
      } else {
        // If already in correct format, use directly
        response.progress = progress;
      }
    }

    // Replace variables including progress
    const variables: Record<string, unknown> = {};
    if (path) {
      variables.path = path;
    }
    if (response.progress && typeof response.progress.overall === 'number') {
      variables.progress = response.progress.overall;
    }
    response.displayText = OpenApiLoader.replaceVariables(response.displayText, variables);

    // If tasks stage confirmation and has first task content, append to display text
    if (stage === 'tasks' && nextStage === null && firstTaskContent) {
      // Extract first uncompleted subtask for focused planning
      const firstSubtask = TaskGuidanceExtractor.extractFirstSubtask(firstTaskContent);

      // 如果没有找到子任务，从任务内容中提取任务描述
      let effectiveFirstSubtask = firstSubtask;
      if (!effectiveFirstSubtask) {
        // 从 firstTaskContent 中提取任务号和描述
        const taskMatch = firstTaskContent.match(/(\d+(?:\.\d+)*)\.\s*\*?\*?([^*\n]+)/);
        if (taskMatch) {
          effectiveFirstSubtask = `${taskMatch[1]}. ${taskMatch[2].trim()}`;
        } else {
          effectiveFirstSubtask = 'Next task';
        }
      }

      // Build guidance text using the template
      const guidanceText = TaskGuidanceExtractor.buildGuidanceText(
        firstTaskContent,
        effectiveFirstSubtask,
        undefined, // no specific task number
        true // is first task
      );

      response.displayText += '\n\n' + guidanceText;
    }

    // Resolve resource references
    if (response.resources) {
      response.resources = openApiLoader.resolveResources(response.resources);
    }

    // Embed resources into display text for better client compatibility
    const enhancedDisplayText = this.embedResourcesIntoText(response.displayText, response.resources);

    // Return WorkflowResult format
    return {
      displayText: enhancedDisplayText,
      data: response,
      resources: response.resources
    };
  }

  // Build error response
  buildErrorResponse(errorType: string, variables?: Record<string, unknown>): string {
    const template = openApiLoader.getErrorResponse(errorType);
    
    if (!template) {
      return `❌ Error: ${errorType}`;
    }

    if (variables) {
      return OpenApiLoader.replaceVariables(template, variables);
    }

    return template;
  }

  // Calculate progress
  calculateProgress(
    requirementsProgress: number,
    designProgress: number,
    tasksProgress: number
  ): Record<string, unknown> {
    // const rules = openApiLoader.getProgressRules(); // \u672a\u4f7f\u7528
    
    // Use rules defined in OpenAPI to calculate overall progress
    const overall = Math.round(
      requirementsProgress * 0.3 +
      designProgress * 0.3 +
      tasksProgress * 0.4
    );

    return {
      overall,
      requirements: requirementsProgress,
      design: designProgress,
      tasks: tasksProgress
    };
  }




  // Private method: embed resources into display text
  private embedResourcesIntoText(displayText: string, resources?: unknown[]): string {
    if (!resources || resources.length === 0) {
      return displayText;
    }

    // 为每个 resource 构建嵌入文本
    const resourceTexts = resources.map(resource => {
      if (!isObject(resource)) return '';
      const header = `\n\n---\n[Resource: ${resource.title || resource.uri}]\n`;
      const content = resource.text || '';
      return header + content;
    });

    // 将资源内容附加到显示文本末尾
    return displayText + resourceTexts.join('');
  }

  // Private method: build check items list
  private buildCheckItemsList(checkResults: unknown): string {
    const items: string[] = [];

    if (!isObject(checkResults)) return '';
    
    if (isArray(checkResults.requiredSections)) {
      checkResults.requiredSections.forEach((section: unknown) => {
        if (typeof section === 'string') {
          items.push(`- ✓ ${section}`);
        }
      });
    }

    if (isArray(checkResults.optionalSections) && checkResults.optionalSections.length > 0) {
      checkResults.optionalSections.forEach((section: unknown) => {
        if (typeof section === 'string') {
          items.push(`- ✓ ${section}`);
        }
      });
    }

    return items.join('\n');
  }
}

// Export singleton
export const responseBuilder = new ResponseBuilder();
