#!/usr/bin/env node

/**
 * 批量生成测试装置脚本
 * 为所有测试用例生成对应的测试装置
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FixtureGenerator from './generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateAllFixtures() {
  const generator = new FixtureGenerator();
  const fixturesBaseDir = path.join(__dirname, '../fixtures');

  console.log('🚀 开始生成所有测试装置...\n');

  // 定义所有需要生成的装置
  const fixtures = [
    // Init 操作装置（大多数不需要预设装置）
    { 
      name: 'init/empty',
      description: '空目录（用于正常初始化）',
      generate: async (dir) => {
        // 空目录，不需要任何内容
        await fs.mkdir(dir, { recursive: true });
      }
    },
    { 
      name: 'init/existing-project',
      description: '已存在的项目（用于重复初始化测试）',
      generate: async (dir) => {
        await generator.generateInitializedProject(dir, 'Existing Project');
      }
    },

    // Check 操作装置 - 需求阶段
    { 
      name: 'requirements/not-edited',
      description: '需求文档未编辑',
      generate: async (dir) => {
        await generator.generateInitializedProject(dir, 'Requirements Test', 'requirements');
      }
    },
    { 
      name: 'requirements/in-progress',
      description: '需求文档编辑中',
      generate: async (dir) => {
        await generator.generateRequirementsInProgress(dir, 'Requirements Test', 60);
      }
    },
    { 
      name: 'requirements/ready',
      description: '需求文档已完成',
      generate: async (dir) => {
        await generator.generateRequirementsReady(dir, 'Requirements Test');
      }
    },

    // Check 操作装置 - 设计阶段
    { 
      name: 'design/not-edited',
      description: '设计文档未编辑',
      generate: async (dir) => {
        await generator.generateInitializedProject(dir, 'Design Test', 'design');
      }
    },
    { 
      name: 'design/in-progress',
      description: '设计文档编辑中',
      generate: async (dir) => {
        await generator.generateDesignInProgress(dir, 'Design Test', 70);
      }
    },
    { 
      name: 'design/ready',
      description: '设计文档已完成',
      generate: async (dir) => {
        await generator.generateDesignReady(dir, 'Design Test');
      }
    },

    // Check 操作装置 - 任务阶段
    { 
      name: 'tasks/not-edited',
      description: '任务文档未编辑',
      generate: async (dir) => {
        await generator.generateInitializedProject(dir, 'Tasks Test', 'tasks');
      }
    },
    { 
      name: 'tasks/in-progress',
      description: '任务文档编辑中（部分任务完成）',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Tasks Test', ['1', '2', '3']);
      }
    },
    { 
      name: 'tasks/ready',
      description: '任务文档已完成',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Tasks Test', []);
        // 更新任务文档，移除所有模板标记
        const tasksFile = path.join(dir, 'tasks.md');
        let content = await fs.readFile(tasksFile, 'utf-8');
        content = content.replace(/<template-tasks>[\s\S]*?<\/template-tasks>/g, '');
        await fs.writeFile(tasksFile, content);
      }
    },

    // 损坏的装置
    { 
      name: 'corrupted/invalid-json',
      description: '损坏的 JSON 文件',
      generate: async (dir) => {
        await generator.generateCorruptedState(dir, 'Corrupted Test', 'invalid_json');
      }
    },
    { 
      name: 'corrupted/missing-fields',
      description: '缺少必需字段',
      generate: async (dir) => {
        await generator.generateCorruptedState(dir, 'Corrupted Test', 'missing_required_fields');
      }
    },
    { 
      name: 'corrupted/invalid-stage',
      description: '无效的阶段值',
      generate: async (dir) => {
        await generator.generateCorruptedState(dir, 'Corrupted Test', 'invalid_stage');
      }
    },
    { 
      name: 'corrupted/missing-files',
      description: '缺少文档文件',
      generate: async (dir) => {
        await generator.generateCorruptedState(dir, 'Corrupted Test', 'missing_files');
      }
    },

    // Skip 操作装置
    { 
      name: 'skip/requirements-stage',
      description: '需求阶段（可跳过）',
      generate: async (dir) => {
        await generator.generateRequirementsReady(dir, 'Skip Test');
      }
    },
    { 
      name: 'skip/design-stage',
      description: '设计阶段（可跳过）',
      generate: async (dir) => {
        await generator.generateDesignReady(dir, 'Skip Test');
      }
    },
    {
      name: 'skip/tasks-stage',
      description: '任务阶段（可跳过）',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Skip Test', []);
        // 确认到任务阶段
        const stateFile = path.join(dir, '.workflow-confirmations.json');
        const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        state.confirmed.requirements = true;
        state.confirmed.design = true;
        state.confirmed.tasks = false; // 任务阶段未确认，可以跳过
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      }
    },

    // Confirm 操作装置
    { 
      name: 'confirm/requirements-ready',
      description: '需求已完成（可确认）',
      generate: async (dir) => {
        await generator.generateRequirementsReady(dir, 'Confirm Test');
      }
    },
    { 
      name: 'confirm/design-ready',
      description: '设计已完成（可确认）',
      generate: async (dir) => {
        await generator.generateDesignReady(dir, 'Confirm Test');
      }
    },
    { 
      name: 'confirm/tasks-ready',
      description: '任务已完成（可确认）',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Confirm Test', []);
        // 标记任务文档为已完成但未确认
        const stateFile = path.join(dir, '.workflow-confirmations.json');
        const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        state.confirmed.tasks = false; // 未确认状态
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      }
    },

    // Complete Task 操作装置
    { 
      name: 'complete-task/tasks-stage',
      description: '任务阶段（有多个任务）',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Complete Task Test', []);
        // 确认到任务阶段
        const stateFile = path.join(dir, '.workflow-confirmations.json');
        const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        state.confirmed.design = true;
        state.confirmed.tasks = true; // tasks 文档已存在，应标记为已确认
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      }
    },
    { 
      name: 'complete-task/some-completed',
      description: '部分任务已完成',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Complete Task Test', ['1', '2', '3']);
        // 确认到任务阶段
        const stateFile = path.join(dir, '.workflow-confirmations.json');
        const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        state.confirmed.design = true;
        state.confirmed.tasks = true; // tasks 文档已存在，应标记为已确认
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      }
    },
    { 
      name: 'complete-task/almost-done',
      description: '只剩最后一个任务',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Complete Task Test', 
          ['1', '2', '3', '4', '5', '6', '7', '8', '9']);
        // 确认到任务阶段
        const stateFile = path.join(dir, '.workflow-confirmations.json');
        const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        state.confirmed.design = true;
        state.confirmed.tasks = true; // tasks 文档已存在，应标记为已确认
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      }
    },
    {
      name: 'complete-task/all-done',
      description: '所有任务都已完成',
      generate: async (dir) => {
        await generator.generateTasksWithProgress(dir, 'Complete Task Test', 
          ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
        // 确认所有阶段
        const stateFile = path.join(dir, '.workflow-confirmations.json');
        const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        state.confirmed.requirements = true;
        state.confirmed.design = true;
        state.confirmed.tasks = true;
        await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
      }
    }
  ];

  // 生成所有装置
  for (const fixture of fixtures) {
    const fixtureDir = path.join(fixturesBaseDir, fixture.name);
    
    try {
      // 清理旧装置
      await generator.cleanup(fixtureDir);
      
      // 生成新装置
      await fixture.generate(fixtureDir);
      
      console.log(`✅ ${fixture.name}: ${fixture.description}`);
    } catch (error) {
      console.error(`❌ ${fixture.name}: ${error.message}`);
    }
  }

  console.log('\n✨ 所有测试装置生成完成！');
  
  // 显示统计信息
  const stats = {
    init: fixtures.filter(f => f.name.startsWith('init/')).length,
    check: fixtures.filter(f => f.name.match(/^(requirements|design|tasks)\//)).length,
    skip: fixtures.filter(f => f.name.startsWith('skip/')).length,
    confirm: fixtures.filter(f => f.name.startsWith('confirm/')).length,
    completeTask: fixtures.filter(f => f.name.startsWith('complete-task/')).length,
    corrupted: fixtures.filter(f => f.name.startsWith('corrupted/')).length
  };

  console.log('\n📊 装置统计:');
  console.log(`  - Init 操作: ${stats.init} 个`);
  console.log(`  - Check 操作: ${stats.check} 个`);
  console.log(`  - Skip 操作: ${stats.skip} 个`);
  console.log(`  - Confirm 操作: ${stats.confirm} 个`);
  console.log(`  - Complete Task 操作: ${stats.completeTask} 个`);
  console.log(`  - 损坏状态: ${stats.corrupted} 个`);
  console.log(`  - 总计: ${fixtures.length} 个装置`);
}

// 运行生成器
generateAllFixtures().catch(console.error);