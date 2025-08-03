# specs-mcp 端到端测试

这是 specs-mcp 工具的端到端测试套件，使用配置驱动的方式进行测试。

## 目录结构

```
test-specs/
├── test-cases/         # 模块化的测试用例（每个文件一个测试）
│   ├── init/           # 初始化功能测试
│   │   └── 01-init-new-project.yaml
│   ├── check/          # 检查功能测试
│   │   ├── 01-check-not-edited.yaml
│   │   └── 02-check-ready-to-confirm.yaml
│   ├── skip/           # 跳过功能测试
│   ├── confirm/        # 确认功能测试
│   └── complete-task/  # 完成任务功能测试
├── tests/              # 测试运行器
│   └── modular-test-runner.js      # 模块化测试运行器
├── scripts/            # 测试脚本
│   ├── run-config-test.sh       # 运行配置驱动的测试
│   └── extract-expected-responses.js  # 从 OpenAPI 提取预期响应
├── fixtures/           # 测试夹具（预置的测试数据）
│   ├── initialized-spec/        # 刚初始化的项目
│   ├── requirements-done/       # 需求文档已完成
│   ├── requirements-ready/      # 需求文档待确认
│   └── tasks-in-progress/       # 任务进行中
├── generated/          # 生成的文件
│   └── openapi-expected-responses.json  # 从 OpenAPI 提取的预期响应
├── logs/               # 测试日志
├── reports/            # 测试报告
└── package.json        # 测试项目配置
```

## 模块化测试设计

每个测试用例都是一个独立的 YAML 文件，存放在对应功能的目录下。

### 测试用例文件结构

```yaml
# 测试用例描述
name: "测试名称"
description: "测试描述"

# 测试前准备
setup:
  cleanup: ["./path/to/clean"]      # 测试前清理
  fixtures: "fixtures/source"       # 使用的测试夹具
  target: "./test-target"          # 复制夹具到的目标位置

# 发送的请求
request:
  method: "tools/call"
  params:
    name: "specs-workflow"
    arguments:
      path: "./test-path"
      action:
        type: "init"
        featureName: "功能名称"

# 期望的结果
expect:
  operation: "init"                # 操作类型（对应 OpenAPI）
  scenario: "success"              # 场景（对应 OpenAPI）
  additional_checks:               # 额外的检查
    - type: "file_exists"
      path: "./test-path/requirements.md"
    - type: "value_equals"
      path: "stage"
      value: "requirements"

# 测试后清理
cleanup: ["./test-path"]
```

## 使用方法

### 运行所有测试

```bash
npm run test:all
```

### 运行特定测试组

```bash
npm run test:init      # 只运行初始化测试
npm run test:check     # 只运行检查测试
npm run test:skip      # 只运行跳过测试
npm run test:confirm   # 只运行确认测试
npm run test:complete-task  # 只运行完成任务测试
```

### 使用脚本运行

```bash
cd scripts
./run-config-test.sh          # 运行所有测试
./run-config-test.sh init     # 运行特定测试组
```

### 查看测试报告

```bash
cat reports/test-report-*.md
```

## 测试原理

1. **配置驱动**：所有测试场景都在 `test-config.yaml` 中定义，无需编写测试代码。

2. **自动验证**：基于 OpenAPI 规范自动提取预期响应格式进行验证。

3. **真实 MCP 通信**：测试通过启动真实的 MCP 服务器进程，使用 JSON-RPC 协议进行通信。

4. **灵活的检查**：支持多种检查类型：
   - 响应格式验证（基于 OpenAPI）
   - 文件存在性检查
   - 字段值验证

## 添加新测试

1. 编辑 `test-config.yaml` 文件
2. 在相应的测试组下添加新的测试配置
3. 如需要测试数据，在 `fixtures/` 目录创建相应的夹具
4. 运行测试验证配置正确