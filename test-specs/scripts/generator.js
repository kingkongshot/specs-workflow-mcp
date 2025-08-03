#!/usr/bin/env node

/**
 * 测试装置生成器
 * 用于生成不同阶段和状态的测试项目
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FixtureGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
  }

  /**
   * 生成初始化后的项目（空文档）
   */
  async generateInitializedProject(targetDir, featureName = 'Test Feature', stage = 'requirements') {
    await fs.mkdir(targetDir, { recursive: true });

    // 创建工作流状态文件（使用正确的格式）
    const workflowState = {
      confirmed: {
        requirements: false,
        design: false,
        tasks: false
      },
      skipped: {
        requirements: false,
        design: false,
        tasks: false
      }
    };

    await fs.writeFile(
      path.join(targetDir, '.workflow-confirmations.json'),
      JSON.stringify(workflowState, null, 2)
    );

    // 创建空的需求文档
    await fs.writeFile(
      path.join(targetDir, 'requirements.md'),
      `# ${featureName} - Requirements Document

## Core Features

<template-requirements>
Describe the core functionality of the feature here.
</template-requirements>

## User Stories

<template-requirements>
- As a [user type], I want [feature], so that [benefit]
</template-requirements>

## Acceptance Criteria

<template-requirements>
- [ ] Criterion 1
- [ ] Criterion 2
</template-requirements>

## Non-functional Requirements

<template-requirements>
- Performance requirements
- Security requirements
- Compatibility requirements
</template-requirements>
`
    );

    if (stage === 'design' || stage === 'tasks') {
      // 创建设计文档
      await fs.writeFile(
        path.join(targetDir, 'design.md'),
        `# ${featureName} - Design Document

## Overview

<template-design>
Provide a high-level overview of the design approach.
</template-design>

## Architecture

<template-design>
Describe the overall architecture and key components.
</template-design>

## Components and Interfaces

<template-design>
Detail the main components and their interfaces.
</template-design>

## Data Models

<template-design>
Define the data structures and models.
</template-design>

## Error Handling

<template-design>
Explain error handling strategies.
</template-design>

## Testing Strategy

<template-design>
Outline the testing approach.
</template-design>
`
      );
      
      // 更新确认状态
      workflowState.confirmed.requirements = true;
    }

    if (stage === 'tasks') {
      // 创建任务文档
      await fs.writeFile(
        path.join(targetDir, 'tasks.md'),
        `# ${featureName} - Task List

## Implementation Tasks

<template-tasks>
- [ ] Task 1
  - [ ] 1.1 Subtask
  - [ ] 1.2 Subtask
- [ ] Task 2
</template-tasks>

## Task Dependencies

<template-tasks>
List any dependencies between tasks.
</template-tasks>

## Estimated Timeline

<template-tasks>
Provide time estimates for major tasks.
</template-tasks>
`
      );
      
      // 更新确认状态
      workflowState.confirmed.design = true;
    }

    // 更新工作流状态文件
    await fs.writeFile(
      path.join(targetDir, '.workflow-confirmations.json'),
      JSON.stringify(workflowState, null, 2)
    );
  }

  /**
   * 生成需求阶段正在编辑的项目
   */
  async generateRequirementsInProgress(targetDir, featureName = 'Test Feature', progress = 50) {
    await this.generateInitializedProject(targetDir, featureName, 'requirements');

    // 创建部分完成的需求文档
    const content = `# ${featureName} - Requirements Document

## Core Features

The ${featureName} provides essential functionality for testing the specs-mcp workflow system.

## User Stories

- As a developer, I want to test the workflow, so that I can ensure it works correctly
- As a tester, I want to verify all states, so that I can catch edge cases

## Acceptance Criteria

- [ ] The system must handle all workflow states
- [ ] Error handling must be comprehensive
${progress >= 75 ? '- [ ] Performance must meet benchmarks\n- [ ] Security requirements must be met' : '<template-requirements>\n- [ ] More criteria needed\n</template-requirements>'}

## Non-functional Requirements

${progress >= 90 ? `- Performance: Response time < 2s
- Security: All inputs validated
- Compatibility: Works on macOS and Linux` : `<template-requirements>
- Performance requirements
- Security requirements
- Compatibility requirements
</template-requirements>`}
`;

    await fs.writeFile(path.join(targetDir, 'requirements.md'), content);
  }

  /**
   * 生成需求阶段已完成的项目
   */
  async generateRequirementsReady(targetDir, featureName = 'Test Feature') {
    await this.generateRequirementsInProgress(targetDir, featureName, 100);

    // 创建完整的需求文档（移除所有模板标记）
    const content = `# ${featureName} - Requirements Document

## Core Features

The ${featureName} provides essential functionality for testing the specs-mcp workflow system. It enables comprehensive validation of all workflow states and transitions.

## User Stories

- As a developer, I want to test the workflow, so that I can ensure it works correctly
- As a tester, I want to verify all states, so that I can catch edge cases
- As a maintainer, I want automated tests, so that I can prevent regressions

## Acceptance Criteria

- [ ] The system must handle all workflow states (init, check, skip, confirm, complete_task)
- [ ] Error handling must be comprehensive and provide clear error messages
- [ ] Performance must meet benchmarks (< 2s response time)
- [ ] Security requirements must be met (input validation, no code injection)
- [ ] All operations must be idempotent where applicable

## Non-functional Requirements

- Performance: Response time < 2s for all operations
- Security: All inputs validated, no arbitrary code execution
- Compatibility: Works on macOS and Linux
- Reliability: 100% test coverage required
- Maintainability: Clear error messages and logging
`;

    await fs.writeFile(path.join(targetDir, 'requirements.md'), content);
  }

  /**
   * 生成设计阶段正在编辑的项目
   */
  async generateDesignInProgress(targetDir, featureName = 'Test Feature', progress = 50) {
    await this.generateRequirementsReady(targetDir, featureName);
    
    // 更新状态到设计阶段
    const stateFile = path.join(targetDir, '.workflow-confirmations.json');
    const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
    state.confirmed.requirements = true;
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));

    // 创建部分完成的设计文档
    const content = `# ${featureName} - Design Document

## Overview

The design implements a comprehensive testing framework for the specs-mcp workflow system.

## Architecture

${progress >= 30 ? `The system follows a modular architecture with:
- Test configuration layer (YAML files)
- Test execution layer (Node.js runners)
- Validation layer (JSON Schema)
- Reporting layer (Markdown reports)` : `<template-design>
Describe the overall architecture and key components.
</template-design>`}

## Components and Interfaces

${progress >= 60 ? `### Test Runner
- Loads test configurations
- Executes MCP requests
- Validates responses

### Fixture Generator
- Creates test states
- Manages test data` : `<template-design>
Detail the main components and their interfaces.
</template-design>`}

## Data Models

${progress >= 80 ? `- TestCase: Configuration for individual tests
- TestResult: Execution results
- ValidationReport: Detailed validation info` : `<template-design>
Define the data structures and models.
</template-design>`}

## Error Handling

<template-design>
Explain error handling strategies.
</template-design>

## Testing Strategy

<template-design>
Outline the testing approach.
</template-design>
`;

    await fs.writeFile(path.join(targetDir, 'design.md'), content);
  }

  /**
   * 生成设计阶段已完成的项目
   */
  async generateDesignReady(targetDir, featureName = 'Test Feature') {
    await this.generateDesignInProgress(targetDir, featureName, 100);

    // 创建完整的设计文档
    const content = `# ${featureName} - Design Document

## Overview

The design implements a comprehensive testing framework for the specs-mcp workflow system using modular components and JSON Schema validation.

## Architecture

The system follows a modular architecture with:
- Test configuration layer (YAML files)
- Test execution layer (Node.js runners)
- Validation layer (JSON Schema)
- Reporting layer (Markdown reports)

## Components and Interfaces

### Test Runner
- Loads test configurations from YAML files
- Executes MCP requests via JSON-RPC
- Validates responses using JSON Schema
- Generates detailed comparison reports

### Fixture Generator
- Creates test states for different workflow stages
- Manages test data and file structures
- Supports corrupted state generation

### Response Validator
- Performs JSON Schema validation
- Validates business logic rules
- Checks state transitions

## Data Models

- TestCase: Configuration for individual tests
- TestResult: Execution results with validation details
- ValidationReport: Detailed validation information
- FixtureState: Test environment state representation

## Error Handling

- Invalid parameters: Return 400 with parameter details
- Missing paths: Return 404 with path information
- State conflicts: Return 409 with current state
- Internal errors: Return 500 with stack trace

## Testing Strategy

- Unit tests for each component
- Integration tests for workflows
- Error recovery scenarios
- Performance benchmarks
`;

    await fs.writeFile(path.join(targetDir, 'design.md'), content);
  }

  /**
   * 生成任务阶段的项目（包含任务列表）
   */
  async generateTasksWithProgress(targetDir, featureName = 'Test Feature', completedTasks = []) {
    await this.generateDesignReady(targetDir, featureName);
    
    // 更新状态到任务阶段
    const stateFile = path.join(targetDir, '.workflow-confirmations.json');
    const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
    state.confirmed.requirements = true;
    state.confirmed.design = true;
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));

    // 创建层次化的任务文档
    const taskStructure = [
      {
        num: '1',
        title: '**测试基础设施建设**',
        subtasks: [
          {
            num: '1.1',
            title: '创建测试环境配置系统',
            details: [
              '*目标*: 建立灵活的测试环境配置，支持不同测试场景',
              '*详情*: 包括 YAML 配置加载、环境变量管理、测试路径管理',
              '*需求参考*: FR-1.1, NFR-可维护性'
            ]
          },
          {
            num: '1.2',
            title: '实现 MCP 连接管理器',
            details: [
              '*目标*: 提供稳定的 MCP 服务器连接和通信机制',
              '*详情*: 处理连接建立、重连、超时、错误恢复',
              '*需求参考*: FR-1.2, NFR-可靠性'
            ]
          },
          {
            num: '1.3',
            title: '搭建测试数据管理系统',
            details: [
              '*目标*: 集中管理测试装置和预期结果',
              '*详情*: 支持动态生成、版本控制、数据隔离',
              '*需求参考*: FR-1.3'
            ]
          }
        ]
      },
      {
        num: '2',
        title: '**测试装置生成器开发**',
        subtasks: [
          {
            num: '2.1',
            title: '实现基础装置生成功能',
            details: [
              '*目标*: 生成不同工作流阶段的测试项目',
              '*详情*: 支持 init、requirements、design、tasks 各阶段',
              '*需求参考*: FR-2.1'
            ]
          },
          {
            num: '2.2',
            title: '添加状态变化模拟',
            details: [
              '*目标*: 模拟真实的工作流状态转换',
              '*详情*: 包括正常流程和异常情况',
              '*需求参考*: FR-2.2'
            ]
          }
        ]
      },
      {
        num: '3',
        title: '**操作测试用例实现**',
        subtasks: [
          {
            num: '3.1',
            title: 'init 操作测试套件',
            details: [
              '*目标*: 全面测试项目初始化功能',
              '*覆盖*: 正常初始化、重复初始化、参数验证、特殊字符处理',
              '*需求参考*: FR-3.1'
            ]
          },
          {
            num: '3.2',
            title: 'check 操作测试套件',
            details: [
              '*目标*: 验证状态检查逻辑',
              '*覆盖*: 各阶段检查、进度计算、文档分析',
              '*需求参考*: FR-3.2'
            ]
          },
          {
            num: '3.3',
            title: 'skip 操作测试套件',
            details: [
              '*目标*: 测试阶段跳过功能',
              '*覆盖*: 合法跳过、非法跳过、状态更新',
              '*需求参考*: FR-3.3'
            ]
          },
          {
            num: '3.4',
            title: 'confirm 操作测试套件',
            details: [
              '*目标*: 测试阶段确认功能',
              '*覆盖*: 文档验证、状态转换、下一阶段生成',
              '*需求参考*: FR-3.4'
            ]
          },
          {
            num: '3.5',
            title: 'complete_task 操作测试套件',
            details: [
              '*目标*: 测试任务完成功能',
              '*覆盖*: 任务标记、进度更新、任务依赖',
              '*需求参考*: FR-3.5'
            ]
          }
        ]
      },
      {
        num: '4',
        title: '**集成测试与端到端测试**',
        subtasks: [
          {
            num: '4.1',
            title: '完整工作流测试',
            details: [
              '*目标*: 验证完整的工作流程',
              '*场景*: 从 init 到所有任务完成',
              '*需求参考*: FR-4.1'
            ]
          },
          {
            num: '4.2',
            title: '异常恢复测试',
            details: [
              '*目标*: 测试系统的容错能力',
              '*场景*: 中断恢复、状态修复、错误处理',
              '*需求参考*: NFR-可靠性'
            ]
          }
        ]
      },
      {
        num: '5',
        title: '**测试运行器增强**',
        subtasks: [
          {
            num: '5.1',
            title: '并行测试执行',
            details: [
              '*目标*: 提高测试执行效率',
              '*实现*: 测试隔离、资源池管理、结果聚合',
              '*需求参考*: NFR-性能'
            ]
          },
          {
            num: '5.2',
            title: '测试重试机制',
            details: [
              '*目标*: 提高测试稳定性',
              '*策略*: 智能重试、失败分析、跳过不稳定测试',
              '*需求参考*: NFR-可靠性'
            ]
          }
        ]
      },
      {
        num: '6',
        title: '**测试报告与分析**',
        subtasks: [
          {
            num: '6.1',
            title: '详细测试报告生成',
            details: [
              '*目标*: 提供全面的测试结果分析',
              '*内容*: 覆盖率、性能指标、失败分析、趋势图表',
              '*需求参考*: FR-6.1'
            ]
          },
          {
            num: '6.2',
            title: 'Web 报告界面',
            details: [
              '*目标*: 提供交互式的测试结果查看',
              '*功能*: 过滤、搜索、对比、导出',
              '*需求参考*: FR-6.2'
            ]
          }
        ]
      }
    ];

    // 生成任务内容
    const taskLines = [];
    taskStructure.forEach(mainTask => {
      const isMainCompleted = completedTasks.includes(mainTask.num);
      taskLines.push(`- [${isMainCompleted ? 'x' : ' '}] ${mainTask.num}. ${mainTask.title}`);
      
      mainTask.subtasks.forEach(subtask => {
        const isSubCompleted = completedTasks.includes(subtask.num);
        taskLines.push(`    - [${isSubCompleted ? 'x' : ' '}] ${subtask.num}. ${subtask.title}`);
        subtask.details.forEach(detail => {
          taskLines.push(`        - ${detail}`);
        });
      });
    });
    
    const taskContent = taskLines.join('\n');

    const content = `# ${featureName} - Task List

## Implementation Tasks

${taskContent}

## 任务依赖关系

- 任务 1 （基础设施）必须在任务 2-6 之前完成
- 任务 2 （装置生成器）必须在任务 3 之前完成
- 任务 3 （操作测试）的各个子任务可以并行执行
- 任务 4 （集成测试）依赖于任务 3 的完成
- 任务 5-6 （增强和报告）可以在任何时候进行

## 预计时间线

- 基础设施建设: 8 小时
- 装置生成器开发: 6 小时
- 操作测试实现: 20 小时
- 集成测试: 8 小时
- 运行器增强: 10 小时
- 报告与分析: 8 小时
- **总计: 60 小时**
`;

    await fs.writeFile(path.join(targetDir, 'tasks.md'), content);
  }

  /**
   * 生成损坏的项目状态
   */
  async generateCorruptedState(targetDir, featureName = 'Test Feature', corruptionType = 'invalid_json') {
    await fs.mkdir(targetDir, { recursive: true });

    switch (corruptionType) {
      case 'invalid_json':
        // 创建损坏的 JSON 文件
        await fs.writeFile(
          path.join(targetDir, '.workflow-confirmations.json'),
          '{ "featureName": "Test", "currentStage": "requirements", invalid json here'
        );
        break;

      case 'missing_required_fields':
        // 创建缺少必需字段的状态文件
        await fs.writeFile(
          path.join(targetDir, '.workflow-confirmations.json'),
          JSON.stringify({ confirmed: {} }, null, 2)  // 缺少 skipped 字段
        );
        break;

      case 'invalid_stage':
        // 创建包含无效字段的状态文件
        await fs.writeFile(
          path.join(targetDir, '.workflow-confirmations.json'),
          JSON.stringify({
            confirmed: {
              requirements: false,
              design: false,
              tasks: false,
              invalid_stage: true  // 额外的无效字段
            },
            skipped: {
              requirements: false,
              design: false,
              tasks: false
            }
          }, null, 2)
        );
        break;

      case 'missing_files':
        // 只创建状态文件，不创建文档文件
        await fs.writeFile(
          path.join(targetDir, '.workflow-confirmations.json'),
          JSON.stringify({
            confirmed: {
              requirements: false,
              design: false,
              tasks: false
            },
            skipped: {
              requirements: false,
              design: false,
              tasks: false
            }
          }, null, 2)
        );
        break;
    }
  }

  /**
   * 清理测试目录
   */
  async cleanup(targetDir) {
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略不存在的目录错误
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new FixtureGenerator();
  
  // 示例用法
  console.log('测试装置生成器示例:');
  console.log('1. 生成初始化项目: node generator.js init ./test-project');
  console.log('2. 生成需求完成项目: node generator.js requirements-ready ./test-project');
  console.log('3. 生成损坏的项目: node generator.js corrupted ./test-project invalid_json');
  
  const [,, command, targetDir, ...args] = process.argv;
  
  if (!command || !targetDir) {
    process.exit(0);
  }

  async function run() {
    switch (command) {
      case 'init':
        await generator.generateInitializedProject(targetDir);
        console.log(`✅ 已生成初始化项目: ${targetDir}`);
        break;
      case 'requirements-progress':
        await generator.generateRequirementsInProgress(targetDir, 'Test Feature', parseInt(args[0] || '50'));
        console.log(`✅ 已生成需求编辑中项目: ${targetDir}`);
        break;
      case 'requirements-ready':
        await generator.generateRequirementsReady(targetDir);
        console.log(`✅ 已生成需求完成项目: ${targetDir}`);
        break;
      case 'design-progress':
        await generator.generateDesignInProgress(targetDir, 'Test Feature', parseInt(args[0] || '50'));
        console.log(`✅ 已生成设计编辑中项目: ${targetDir}`);
        break;
      case 'design-ready':
        await generator.generateDesignReady(targetDir);
        console.log(`✅ 已生成设计完成项目: ${targetDir}`);
        break;
      case 'tasks':
        await generator.generateTasksWithProgress(targetDir, 'Test Feature', args);
        console.log(`✅ 已生成任务阶段项目: ${targetDir}`);
        break;
      case 'corrupted':
        await generator.generateCorruptedState(targetDir, 'Test Feature', args[0] || 'invalid_json');
        console.log(`✅ 已生成损坏的项目: ${targetDir}`);
        break;
      case 'cleanup':
        await generator.cleanup(targetDir);
        console.log(`✅ 已清理目录: ${targetDir}`);
        break;
      default:
        console.error(`未知命令: ${command}`);
    }
  }

  run().catch(console.error);
}

export default FixtureGenerator;