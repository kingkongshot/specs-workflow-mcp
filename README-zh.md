# Spec Workflow MCP - 测试套件 (dev 分支)

[English](README.md) | [简体中文](README-zh.md)

⚠️ **注意**: 这是 dev 分支，专门用于测试套件开发和调试。如需正式使用 Spec Workflow MCP，请切换到 [main 分支](https://github.com/kingkongshot/specs-workflow-mcp/tree/main)。

## 测试套件概览

本测试套件为 Spec Workflow MCP 提供全面的端到端测试覆盖，确保所有工作流操作的正确性和稳定性。

## 快速开始

### 安装依赖

```bash
# 项目根目录
npm install

# 测试套件目录
cd test-specs
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定类别的测试
npm test -- init        # 仅运行初始化测试
npm test -- check       # 仅运行检查测试
npm test -- complete    # 仅运行任务完成测试
npm test -- confirm     # 仅运行确认测试
npm test -- skip        # 仅运行跳过测试
```

### 测试报告

测试完成后，报告会生成在 `test-specs/reports/` 目录下：
- `test-report.html` - 可视化测试报告
- `test-report.md` - Markdown 格式报告
- 各个测试用例的详细输出文件

## 测试套件结构

```
test-specs/
├── test-cases/           # 测试用例定义
│   ├── init/            # 初始化操作测试
│   ├── check/           # 检查操作测试
│   ├── complete-task/   # 任务完成测试
│   ├── confirm/         # 确认操作测试
│   └── skip/            # 跳过操作测试
├── fixtures/            # 测试数据夹具
├── scripts/             # 测试工具脚本
└── reports/             # 测试报告输出
```

## 测试用例类别

### 1. 初始化测试 (init)
- 基础项目初始化
- 特殊字符处理
- 重复初始化防护
- 参数验证

### 2. 检查测试 (check)
- 工作流状态检查
- 文档完整性验证
- 进度追踪
- 边缘场景处理

### 3. 任务完成测试 (complete-task)
- 单任务完成
- 子任务处理
- 多层级任务
- 格式兼容性
- 重复编号处理
- 孤立子任务

### 4. 确认测试 (confirm)
- 阶段确认流程
- 状态转换验证
- 重复确认防护

### 5. 跳过测试 (skip)
- 阶段跳过功能
- 工作流灵活性

## 编写新测试用例

### 1. 创建测试用例文件

在 `test-cases/` 相应目录下创建 YAML 文件：

```yaml
name: "测试名称"
description: "测试描述"
category: "测试类别"
priority: "high|medium|low"

setup:
  fixtures: "fixtures/路径"  # 可选
  target: "./测试目标路径"

request:
  method: "tools/call"
  params:
    name: "specs-workflow"
    arguments:
      path: "./路径"
      action:
        type: "操作类型"
        # 其他参数...

expect:
  operation: "期望的操作"
  additional_checks:
    - type: "检查类型"
      # 检查参数...
```

### 2. 准备测试夹具

如需要预设文件，在 `fixtures/` 目录下创建相应结构：

```
fixtures/
└── your-test/
    ├── requirements.md
    ├── design.md
    ├── tasks.md
    └── .workflow-confirmations.json
```

### 3. 运行单个测试

```bash
# 使用测试文件名（不含扩展名）
npm test -- --test "your-test-name"
```

## 调试技巧

### 1. 启用详细日志

```bash
DEBUG=* npm test
```

### 2. 保留测试文件

测试后不自动清理生成的文件：

```bash
NO_CLEANUP=true npm test
```

### 3. 交互式调试

```bash
npm run debug-test -- "test-name"
```

## 持续集成

测试套件已集成 GitHub Actions，每次推送都会自动运行测试。查看 `.github/workflows/test.yml` 了解配置详情。

## 常见问题

### Q: 测试失败但看不到详细错误？
A: 查看 `reports/` 目录下的具体测试输出文件，或使用 `DEBUG=*` 环境变量。

### Q: 如何测试特定的边缘场景？
A: 参考 `test-cases/complete-task/` 目录下的边缘场景测试用例。

### Q: 测试环境与实际使用有何不同？
A: 测试环境使用相同的核心代码，但会在隔离的临时目录中运行，不影响实际项目。

## 贡献指南

1. 新功能必须包含相应的测试用例
2. 修复 bug 时应添加回归测试
3. 保持测试用例的独立性和可重复性
4. 使用有意义的测试名称和描述

## 相关链接

- [主项目文档](https://github.com/kingkongshot/specs-workflow-mcp/tree/main)
- [MCP 协议文档](https://modelcontextprotocol.com)
- [问题反馈](https://github.com/kingkongshot/specs-workflow-mcp/issues)