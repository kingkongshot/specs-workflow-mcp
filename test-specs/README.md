# specs-mcp End-to-End Testing

[English](#english) | [中文](#中文)

## English

This is the end-to-end test suite for the specs-mcp tool, using a configuration-driven approach for testing.

## Directory Structure

```
test-specs/
├── test-cases/         # Modular test cases (one test per file)
│   ├── init/           # Initialization tests
│   │   └── 01-init-new-project.yaml
│   ├── check/          # Check functionality tests
│   │   ├── 01-check-not-edited.yaml
│   │   └── 02-check-ready-to-confirm.yaml
│   ├── skip/           # Skip functionality tests
│   ├── confirm/        # Confirmation tests
│   └── complete-task/  # Task completion tests
├── tests/              # Test runner
│   └── modules/        # Modular test runner components
├── scripts/            # Test scripts
│   ├── run-config-test.sh       # Run configuration-driven tests
│   └── extract-expected-responses.js  # Extract expected responses from OpenAPI
├── fixtures/           # Test fixtures (pre-configured test data)
│   ├── init/          # Initialization fixtures
│   ├── requirements/  # Requirements stage fixtures
│   ├── design/        # Design stage fixtures
│   └── tasks/         # Tasks stage fixtures
├── generated/          # Generated files
│   └── openapi-expected-responses.json  # Expected responses from OpenAPI
├── reports/            # Test reports
└── package.json        # Test project configuration
```

## Setup

1. Copy `.env.test.example` to `.env.test` and update paths:
   ```bash
   cp .env.test.example .env.test
   # Edit .env.test with your actual paths
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the main project:
   ```bash
   cd .. && npm run build
   ```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Groups
```bash
# Only run initialization tests
TEST_FILTER_GROUP=init npm test

# Only run check tests
TEST_FILTER_GROUP=check npm test

# Only run confirmation tests
TEST_FILTER_GROUP=confirm npm test
```

### View Test Reports
```bash
# Latest test report location is shown after test run
# Reports are in: reports/test-YYYY-MM-DD-HH-mm-ss/
```

## Test Case Structure

Each test case is an independent YAML file:

```yaml
# Test case metadata
name: "Test Name"
description: "Test Description"

# Pre-test setup
setup:
  cleanup: ["./path/to/clean"]      # Pre-test cleanup
  fixtures: "fixtures/source"       # Test fixtures to use
  target: "./test-target"          # Target location for fixtures

# Request to send
request:
  method: "tools/call"
  params:
    name: "specs-workflow"
    arguments:
      path: "./test-path"
      action:
        type: "init"
        featureName: "Feature Name"

# Expected results
expect:
  operation: "init"                # Operation type (from OpenAPI)
  scenario: "success"              # Scenario (from OpenAPI)
  additional_checks:               # Additional checks
    - type: "file_exists"
      path: "./test-path/requirements.md"
    - type: "value_equals"
      path: "stage"
      value: "requirements"

# Post-test cleanup
cleanup: ["./test-path"]
```

## Adding New Tests

1. Create a new YAML file in the appropriate `test-cases/` subdirectory
2. Define the test following the structure above
3. If needed, create test fixtures in the `fixtures/` directory
4. Run tests to verify configuration

---

## 中文

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
│   └── modules/        # 模块化测试运行器组件
├── scripts/            # 测试脚本
│   ├── run-config-test.sh       # 运行配置驱动的测试
│   └── extract-expected-responses.js  # 从 OpenAPI 提取预期响应
├── fixtures/           # 测试夹具（预置的测试数据）
│   ├── init/          # 初始化夹具
│   ├── requirements/  # 需求阶段夹具
│   ├── design/        # 设计阶段夹具
│   └── tasks/         # 任务阶段夹具
├── generated/          # 生成的文件
│   └── openapi-expected-responses.json  # 从 OpenAPI 提取的预期响应
├── reports/            # 测试报告
└── package.json        # 测试项目配置
```

## 设置

1. 复制 `.env.test.example` 到 `.env.test` 并更新路径：
   ```bash
   cp .env.test.example .env.test
   # 编辑 .env.test 填入实际路径
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 构建主项目：
   ```bash
   cd .. && npm run build
   ```

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定测试组
```bash
# 只运行初始化测试
TEST_FILTER_GROUP=init npm test

# 只运行检查测试
TEST_FILTER_GROUP=check npm test

# 只运行确认测试
TEST_FILTER_GROUP=confirm npm test
```

### 查看测试报告
```bash
# 测试运行后会显示最新报告位置
# 报告位于: reports/test-YYYY-MM-DD-HH-mm-ss/
```

## 测试用例结构

每个测试用例都是一个独立的 YAML 文件：

```yaml
# 测试用例元数据
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

## 添加新测试

1. 在相应的 `test-cases/` 子目录中创建新的 YAML 文件
2. 按照上述结构定义测试
3. 如需要，在 `fixtures/` 目录创建测试夹具
4. 运行测试验证配置正确