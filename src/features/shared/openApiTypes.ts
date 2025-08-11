// Auto-generated type definitions - do not modify manually
// Generated from api/spec-workflow.openapi.yaml

export interface WorkflowRequest {
  path: string;  // Specification directory path (e.g., /Users/link/specs-mcp/batch-log-test)
  action: Action;
}

export interface Action {
  type: 'init' | 'check' | 'skip' | 'confirm' | 'complete_task';
  featureName?: string;  // Feature name (required for init)
  introduction?: string;  // Feature introduction (required for init)
  taskNumber?: string | string[];  // Task number(s) to mark as completed (required for complete_task)
}

export interface WorkflowResponse {
  result: InitResponse | CheckResponse | SkipResponse | ConfirmResponse | BatchCompleteTaskResponse;
}

export interface InitResponse {
  success: boolean;
  data: { path: string; featureName: string; nextAction: 'edit_requirements' };
  displayText: string;
  resources?: ResourceRef[];
}

export interface CheckResponse {
  stage: Stage;
  progress: Progress;
  status: Status;
  displayText: string;
  resources?: ResourceRef[];
}

export interface SkipResponse {
  stage: string;
  skipped: boolean;
  progress: Progress;
  displayText: string;
  resources?: ResourceRef[];
}

export interface ConfirmResponse {
  stage: string;
  confirmed: boolean;
  nextStage: string;
  progress: Progress;
  displayText: string;
  resources?: ResourceRef[];
}



export interface BatchCompleteTaskResponse {
  success: boolean;  // Whether the batch operation succeeded
  completedTasks?: string[];  // Task numbers that were actually completed in this operation
  alreadyCompleted?: string[];  // Task numbers that were already completed before this operation
  failedTasks?: { taskNumber: string; reason: string }[];  // Tasks that could not be completed with reasons
  results?: { taskNumber: string; success: boolean; status: 'completed' | 'already_completed' | 'failed' }[];  // Detailed results for each task in the batch
  nextTask?: { number: string; description: string };  // Information about the next uncompleted task
  hasNextTask?: boolean;  // Whether there are more tasks to complete
  displayText: string;  // Human-readable message about the batch operation
}

export interface Stage {
}

export interface Progress {
  overall: number;  // Overall progress percentage
  requirements: number;  // Requirements phase progress
  design: number;  // Design phase progress
  tasks: number;  // Tasks phase progress
}

export interface Status {
  type: 'not_started' | 'not_edited' | 'in_progress' | 'ready_to_confirm' | 'confirmed' | 'completed';
  reason?: string;
  readyToConfirm?: boolean;
}

export interface Resource {
  id: string;  // Resource identifier
  content: string;  // Resource content (Markdown format)
}

export interface ResourceRef {
  uri: string;  // Resource URI
  title?: string;  // Optional resource title
  mimeType: string;  // Resource MIME type
  text?: string;  // Optional resource text content
}

// Extended type definitions
export interface ErrorResponse {
  displayText: string;
  variables?: Record<string, any>;
}

export interface ContentCheckRules {
  minLength?: number;
  requiredSections?: string[];
  optionalSections?: string[];
  minTasks?: number;
  taskFormat?: string;
  requiresEstimate?: boolean;
}