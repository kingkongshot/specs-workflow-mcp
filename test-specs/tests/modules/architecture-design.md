# 模块化测试运行器架构设计

## 问题分析
当前的 `ModularTestRunner` 类违反了单一职责原则，承担了过多职责。需要将其分解为多个专门的模块。

## 新架构设计

### 1. 核心模块划分

```
test-specs/tests/modules/
├── server/
│   ├── mcpServerManager.js      # MCP 服务器生命周期管理
│   └── messageHandler.js        # 消息通信处理
├── loader/
│   ├── testCaseLoader.js        # 测试用例加载
│   └── expectedResponseLoader.js # 预期响应加载
├── validator/
│   ├── responseValidator.js     # 响应验证主逻辑
│   ├── schemaValidator.js       # JSON Schema 验证
│   └── additionalChecks.js      # 额外检查（文件存在等）
├── reporter/
│   ├── consoleReporter.js       # 控制台输出
│   └── markdownReporter.js      # Markdown 报告生成
├── utils/
│   ├── fileOperations.js        # 文件系统操作
│   ├── pathResolver.js          # 路径解析
│   └── configManager.js         # 配置管理
└── testRunner.js                # 主运行器（组合各模块）
```

### 2. 各模块职责

#### 2.1 服务器管理模块 (server/)
- **mcpServerManager.js**: 纯函数化的服务器管理
  - `startServer(config) => Promise<ServerInstance>`
  - `stopServer(server) => Promise<void>`
  - `isServerReady(server) => Promise<boolean>`

- **messageHandler.js**: 消息通信的纯函数处理
  - `sendRequest(server, method, params) => Promise<Response>`
  - `parseMessage(data) => Message | null`
  - `createRequest(method, params, id) => Request`

#### 2.2 加载器模块 (loader/)
- **testCaseLoader.js**: 测试用例的纯函数加载
  - `loadTestCases(testGroup?) => Promise<TestCases>`
  - `loadTestFile(filePath) => Promise<TestCase>`
  - `validateTestCase(testCase) => ValidationResult`

- **expectedResponseLoader.js**: 预期响应的加载
  - `loadExpectedResponses() => Promise<ExpectedResponses>`
  - `getExpectedResponse(operation, type) => ExpectedResponse`

#### 2.3 验证器模块 (validator/)
- **responseValidator.js**: 响应验证的组合器
  - `validateResponse(testCase, actualResponse, expectedResponses) => ValidationResult`
  - `determineValidationType(testCase) => ValidationType`

- **schemaValidator.js**: JSON Schema 验证的纯函数
  - `validateSchema(data, schema) => SchemaValidationResult`
  - `preprocessSchema(schema) => ProcessedSchema`

- **additionalChecks.js**: 额外检查的纯函数集合
  - `checkFileExists(path) => Promise<CheckResult>`
  - `checkFileContains(path, content) => Promise<CheckResult>`
  - `checkValueEquals(data, path, value) => CheckResult`

#### 2.4 报告模块 (reporter/)
- **consoleReporter.js**: 控制台输出的纯函数
  - `printTestStart(testCase) => void`
  - `printTestResult(result) => void`
  - `printSummary(results) => void`

- **markdownReporter.js**: Markdown 报告的纯函数生成
  - `generateReport(results, timestamp) => ReportContent`
  - `generateDetailedComparison(testResult) => ComparisonContent`
  - `saveReport(content, path) => Promise<void>`

#### 2.5 工具模块 (utils/)
- **fileOperations.js**: 文件操作的纯函数封装
  - `copyDirectory(src, dest) => Promise<void>`
  - `cleanupDirectory(path) => Promise<void>`
  - `ensureDirectory(path) => Promise<void>`

- **pathResolver.js**: 路径解析的纯函数
  - `resolveTestPath(relativePath) => string`
  - `getReportPath(timestamp) => string`

- **configManager.js**: 配置管理的纯函数
  - `loadConfig() => Config`
  - `validateConfig(config) => ValidationResult`

### 3. 主运行器设计 (testRunner.js)

```javascript
// 使用函数组合模式
export async function runTests(options = {}) {
  const config = loadConfig();
  const { testGroup } = options;
  
  // 使用管道模式组合各个步骤
  const pipeline = pipe(
    loadTestCases,
    validateTestCases,
    setupTestEnvironment,
    runTestCases,
    generateReports,
    cleanup
  );
  
  return pipeline({ config, testGroup });
}
```

### 4. 设计原则

1. **纯函数优先**: 所有模块都以纯函数为主，避免副作用
2. **依赖注入**: 通过参数传递依赖，而不是在模块内部创建
3. **函数组合**: 使用函数组合构建复杂功能
4. **错误即数据**: 使用 Result 类型处理错误，避免异常抛出
5. **不可变数据**: 使用不可变数据结构，避免状态突变

### 5. 实施步骤

1. 先创建新的模块结构，不删除原有代码
2. 逐个实现各模块的纯函数
3. 创建新的主运行器，使用组合模式
4. 编写测试确保功能一致
5. 完成迁移后删除旧代码