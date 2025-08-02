#!/usr/bin/env tsx
/**
 * Generate WebUI directly from OpenAPI specification
 * No intermediate JSON files needed, directly parse YAML to generate HTML
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read OpenAPI specification
const specPath = path.join(__dirname, '../api/spec-workflow.openapi.yaml');
const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;

// Scenario type definition
interface Scenario {
  id: string;
  title: string;
  description: string;
  responseType: string;
  example: any;
  schema: any;
}

// Extract all scenarios from OpenAPI
function extractScenarios(): Scenario[] {
  const allScenarios: Scenario[] = [];
  
  // First collect all scenarios, without numbering
  const responseSchemas = ['InitResponse', 'CheckResponse', 'SkipResponse', 'ConfirmResponse', 'CompleteTaskResponse'];
  
  for (const schemaName of responseSchemas) {
    const schema = spec.components.schemas[schemaName];
    if (!schema || !schema.examples) continue;

    schema.examples.forEach((example: any, index: number) => {
      allScenarios.push({
        id: `${schemaName.toLowerCase()}-${index + 1}`,
        title: getScenarioTitle(schemaName, example),
        description: getScenarioDescription(schemaName, example),
        responseType: schemaName,
        example: example,
        schema: schema
      });
    });
  }

  // Add error response scenarios
  if (spec['x-error-responses']) {
    for (const [errorType, errorDef] of Object.entries(spec['x-error-responses']) as [string, any][]) {
      allScenarios.push({
        id: `error-${errorType}`,
        title: `Error: ${errorType}`,
        description: 'Error response example',
        responseType: 'ErrorResponse',
        example: { displayText: errorDef.displayText },
        schema: null
      });
    }
  }

  // Reorder scenarios by workflow sequence
  const orderedScenarios: Scenario[] = [];
  
  // 1. Initialization
  const initScenario = allScenarios.find(s => s.responseType === 'InitResponse');
  if (initScenario) orderedScenarios.push(initScenario);
  
  // 2. requirements stage
  const reqNotEdited = allScenarios.find(s => 
    s.responseType === 'CheckResponse' && 
    s.example.stage === 'requirements' && 
    s.example.status?.type === 'not_edited' &&
    !s.example.status?.skipIntent
  );
  if (reqNotEdited) orderedScenarios.push(reqNotEdited);
  
  const reqReadyToConfirm = allScenarios.find(s => 
    s.responseType === 'CheckResponse' && 
    s.example.stage === 'requirements' && 
    s.example.status?.type === 'ready_to_confirm' &&
    !s.example.status?.userApproved
  );
  if (reqReadyToConfirm) orderedScenarios.push(reqReadyToConfirm);
  
  const confirmReq = allScenarios.find(s => 
    s.responseType === 'ConfirmResponse' && 
    s.example.stage === 'requirements'
  );
  if (confirmReq) orderedScenarios.push(confirmReq);
  
  // 3. design stage
  const designNotEdited = allScenarios.find(s => 
    s.responseType === 'CheckResponse' && 
    s.example.stage === 'design' && 
    s.example.status?.type === 'not_edited'
  );
  if (designNotEdited) orderedScenarios.push(designNotEdited);
  
  const designReadyToConfirm = allScenarios.find(s => 
    s.responseType === 'CheckResponse' && 
    s.example.stage === 'design' && 
    s.example.status?.type === 'ready_to_confirm'
  );
  if (designReadyToConfirm) orderedScenarios.push(designReadyToConfirm);
  
  const confirmDesign = allScenarios.find(s => 
    s.responseType === 'ConfirmResponse' && 
    s.example.stage === 'design'
  );
  if (confirmDesign) orderedScenarios.push(confirmDesign);
  
  // 4. tasks stage
  const tasksNotEdited = allScenarios.find(s => 
    s.responseType === 'CheckResponse' && 
    s.example.stage === 'tasks' && 
    s.example.status?.type === 'not_edited'
  );
  if (tasksNotEdited) orderedScenarios.push(tasksNotEdited);
  
  const tasksReadyToConfirm = allScenarios.find(s => 
    s.responseType === 'CheckResponse' && 
    s.example.stage === 'tasks' && 
    s.example.status?.type === 'ready_to_confirm'
  );
  if (tasksReadyToConfirm) orderedScenarios.push(tasksReadyToConfirm);
  
  const confirmTasks = allScenarios.find(s => 
    s.responseType === 'ConfirmResponse' && 
    s.example.stage === 'tasks'
  );
  if (confirmTasks) orderedScenarios.push(confirmTasks);
  
  // 5. Complete task scenarios
  const completeTaskScenarios = allScenarios.filter(s => s.responseType === 'CompleteTaskResponse');
  orderedScenarios.push(...completeTaskScenarios);
  
  // 6. Skip related scenarios
  // First add skip intent detection
  const reqSkipIntent = allScenarios.find(s => 
    s.responseType === 'CheckResponse' && 
    s.example.stage === 'requirements' && 
    s.example.status?.skipIntent
  );
  if (reqSkipIntent) orderedScenarios.push(reqSkipIntent);
  
  // Then add actual skip responses
  const skipScenarios = allScenarios.filter(s => s.responseType === 'SkipResponse');
  orderedScenarios.push(...skipScenarios);
  
  // 7. Error scenarios
  const errorScenarios = allScenarios.filter(s => s.responseType === 'ErrorResponse');
  orderedScenarios.push(...errorScenarios);
  
  // Renumber
  orderedScenarios.forEach((scenario, index) => {
    scenario.title = `${index + 1}. ${scenario.title}`;
  });
  
  return orderedScenarios;
}

// Get scenario title
function getScenarioTitle(schemaName: string, example: any): string {
  const titles: Record<string, (ex: any) => string> = {
    InitResponse: (ex) => ex.success ? 'Initialization Successful' : 'Initialization Scenario',
    CheckResponse: (ex) => {
      if (ex.status?.type === 'not_edited' && ex.status?.skipIntent) return `${ex.stage || 'Stage'} Skip Confirmation`;
      if (ex.status?.type === 'not_edited') return `${ex.stage || 'Stage'} Not Edited`;
      if (ex.status?.type === 'ready_to_confirm' && ex.status?.userApproved) return `${ex.stage || 'Stage'} User Approved`;
      if (ex.status?.type === 'ready_to_confirm') return `${ex.stage || 'Stage'} Ready to Confirm`;
      return 'Check Status';
    },
    SkipResponse: (ex) => `Skip ${ex.stage || 'Stage'}`,
    ConfirmResponse: (ex) => `Confirm ${ex.stage || 'Stage'}`,
    CompleteTaskResponse: (ex) => ex.hasNextTask ? 'Complete Task (Has Next)' : 'Complete Task (All Done)'
  };

  const titleFn = titles[schemaName];
  return titleFn ? titleFn(example) : schemaName;
}

// Get scenario description
function getScenarioDescription(schemaName: string, example: any): string {
  const descriptions: Record<string, string> = {
    InitResponse: 'Response for initializing workflow',
    CheckResponse: 'Response for checking current status',
    SkipResponse: 'Response for skipping stage',
    ConfirmResponse: 'Response for confirming stage completion',
    CompleteTaskResponse: 'Response for marking task as complete'
  };
  return descriptions[schemaName] || schemaName;
}

// Generate HTML
function generateHTML(scenarios: Scenario[]): string {
  const scenarioCards = scenarios.map(scenario => `
    <div class="scenario-card">
      <h3>${scenario.title}</h3>
      <p class="description">${scenario.description}</p>
      
      <div class="response-type">Response Type: <code>${scenario.responseType}</code></div>
      
      <div class="example-section">
        <h4>Example Response:</h4>
        <pre class="example-content">${JSON.stringify(scenario.example, null, 2)}</pre>
      </div>
      
      ${scenario.example.displayText ? `
      <div class="display-text-section">
        <h4>Display Text:</h4>
        <pre class="display-text">${scenario.example.displayText}</pre>
      </div>
      ` : ''}
      
      ${scenario.example.resources ? `
      <div class="resources-section">
        <h4>Included Resources:</h4>
        <ul>
          ${scenario.example.resources.map((r: any) => `<li>${r.ref || r.id || 'Unknown Resource'}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spec Workflow - OpenAPI Response Examples</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            background: #f6f8fa;
            color: #24292e;
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #0366d6;
        }
        
        .subtitle {
            text-align: center;
            color: #586069;
            margin-bottom: 20px;
            font-size: 1.1em;
        }
        
        .info-box {
            background: #f0f7ff;
            border: 1px solid #c8e1ff;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .scenario-card {
            background: white;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        .scenario-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .scenario-card h3 {
            color: #0366d6;
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        
        .description {
            color: #586069;
            margin-bottom: 15px;
        }
        
        .response-type {
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            margin-bottom: 15px;
            display: inline-block;
        }
        
        code {
            background: #f3f4f6;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        .example-section, .display-text-section, .resources-section {
            margin-top: 15px;
        }
        
        h4 {
            color: #24292e;
            font-size: 1em;
            margin-bottom: 8px;
        }
        
        pre {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 12px;
            overflow-x: auto;
            font-size: 0.85em;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        .example-content {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .display-text {
            background: #f0f9ff;
            border-color: #bae6fd;
            white-space: pre-wrap;
        }
        
        .resources-section ul {
            list-style: none;
            padding-left: 0;
        }
        
        .resources-section li {
            background: #e7f5ff;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 4px;
            font-size: 0.9em;
        }
        
        .stats {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e1e4e8;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #0366d6;
        }
        
        .stat-label {
            color: #586069;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Spec Workflow - OpenAPI Response Examples</h1>
        <p class="subtitle">All response scenarios automatically generated from OpenAPI specification</p>
        
        <div class="info-box">
            <p>📍 Data Source: <code>api/spec-workflow.openapi.yaml</code></p>
            <p>🔄 Last Updated: ${new Date().toLocaleString('en-US')}</p>
        </div>
        
        <div class="grid">
            ${scenarioCards}
        </div>
        
        <div class="stats">
            <h2>Statistics</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${scenarios.length}</div>
                    <div class="stat-label">Total Scenarios</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${responseSchemas.length}</div>
                    <div class="stat-label">Response Types</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${Object.keys(spec['x-error-responses'] || {}).length}</div>
                    <div class="stat-label">Error Types</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Main function
function main() {
  console.log('🔍 Extracting scenarios from OpenAPI specification...');
  
  const scenarios = extractScenarios();
  console.log(`✅ Extracted ${scenarios.length} scenarios`);
  
  const html = generateHTML(scenarios);
  
  const outputPath = path.join(__dirname, '../webui/prompt-grid.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  
  console.log('✅ WebUI generated to:', outputPath);
  console.log('🚀 Open this file in browser to view all response examples');
}

// Define response type list
const responseSchemas = ['InitResponse', 'CheckResponse', 'SkipResponse', 'ConfirmResponse', 'CompleteTaskResponse'];

main();