// Auto-generated type definitions - do not modify manually
// Generated from api/spec-workflow.openapi.yaml

export interface WorkflowRequest {
  path: string;  // Specification directory path
  action: Action;
}

export interface Action {
  type: 'init' | 'check' | 'skip' | 'confirm' | 'complete_task';
  featureName?: string;  // Feature name (required for init)
  introduction?: string;  // Feature introduction (required for init)
  taskNumber?: string;  // Task number to mark as completed (required for complete_task)
}

export interface WorkflowResponse {
  result: InitResponse | CheckResponse | SkipResponse | ConfirmResponse | CompleteTaskResponse;
}

export interface InitResponse {
  success: boolean;
  data: { path: string; featureName: string; nextAction: 'edit_requirements' };
  displayText: string;
  resources?: ResourceRef[];
}

export interface CheckResponse {
  stage: 'requirements' | 'design' | 'tasks' | 'completed';
  progress: Progress;
  status: Status;
  displayText: string;
  resources?: ResourceRef[];
}

export interface SkipResponse {
  stage: string;
  skipped: boolean;
  displayText: string;
  resources?: ResourceRef[];
}

export interface ConfirmResponse {
  stage: string;
  confirmed: boolean;
  nextStage: string;
  displayText: string;
  resources?: ResourceRef[];
}

export interface CompleteTaskResponse {
  taskCompleted: string;  // Completed task number
  hasNextTask?: boolean;  // Whether there is a next task
  nextTask?: { number: string; description: string };
  displayText: string;
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
  ref: string;  // Shared resource reference ID
}

// Extended type definitions
export interface ErrorResponse {
  displayText: string;
  variables?: Record<string, unknown>;
}

export interface ContentCheckRules {
  minLength?: number;
  requiredSections?: string[];
  optionalSections?: string[];
  minTasks?: number;
  taskFormat?: string;
  requiresEstimate?: boolean;
}