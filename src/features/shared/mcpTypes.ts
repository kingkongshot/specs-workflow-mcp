/**
 * MCP (Model Context Protocol) compatible type definitions
 * Standard interfaces conforming to MCP specification
 */

/**
 * MCP text content
 */
export interface McpTextContent {
  type: "text";
  text: string;
}

/**
 * MCP image content
 */
export interface McpImageContent {
  type: "image";
  data: string;      // base64 encoded
  mimeType: string;  // e.g. "image/png"
}

/**
 * MCP audio content
 */
export interface McpAudioContent {
  type: "audio";
  data: string;      // base64 encoded
  mimeType: string;  // e.g. "audio/mp3"
}

/**
 * MCP resource content
 */
export interface McpResourceContent {
  type: "resource";
  resource: {
    uri: string;       // Resource URI
    title?: string;    // Optional title
    mimeType: string;  // MIME type
    text?: string;     // Optional text content
  };
}

/**
 * MCP content type union
 */
export type McpContent = 
  | McpTextContent 
  | McpImageContent 
  | McpAudioContent 
  | McpResourceContent;

/**
 * MCP tool call result
 * This is the standard format that must be returned after tool execution
 */
export interface McpCallToolResult {
  content: McpContent[];
  isError?: boolean;
  structuredContent?: unknown; // Used when outputSchema is defined
}

/**
 * Internally used workflow result
 * Used to pass data between functional modules
 */
export interface WorkflowResult {
  displayText: string;
  data: {
    success?: boolean;
    error?: string;
    [key: string]: unknown;
  };
  resources?: Array<{
    uri: string;
    title?: string;
    mimeType: string;
    text?: string;
  }>;
}

/**
 * Create text content
 */
export function createTextContent(text: string): McpTextContent {
  return {
    type: "text",
    text
  };
}

/**
 * Create resource content
 */
export function createResourceContent(resource: McpResourceContent['resource']): McpResourceContent {
  return {
    type: "resource",
    resource
  };
}

/**
 * Convert internal workflow result to MCP format
 */
export function toMcpResult(result: WorkflowResult): McpCallToolResult {
  const content: McpContent[] = [
    createTextContent(result.displayText)
  ];
  
  // Resources are now embedded in displayText, no need to add them separately
  // This avoids duplicate display in clients that support resource content type
  
  return {
    content,
    isError: result.data.success === false,
    // Add structured content, return response object conforming to OpenAPI specification
    structuredContent: result.data && typeof result.data === 'object' && 'displayText' in result.data 
      ? result.data  // If data is already a complete response object
      : undefined    // Otherwise don't return structuredContent
  };
}