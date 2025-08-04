# Spec Workflow MCP - Test Suite (dev branch)

[English](README.md) | [简体中文](README-zh.md)

⚠️ **Note**: This is the dev branch, specifically for test suite development and debugging. For production use of Spec Workflow MCP, please switch to the [main branch](https://github.com/kingkongshot/specs-workflow-mcp/tree/main).

## Test Suite Overview

This test suite provides comprehensive end-to-end testing coverage for Spec Workflow MCP, ensuring the correctness and stability of all workflow operations.

## Quick Start

### Install Dependencies

```bash
# Project root directory
npm install

# Test suite directory
cd test-specs
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm test -- init        # Run initialization tests only
npm test -- check       # Run check tests only
npm test -- complete    # Run task completion tests only
npm test -- confirm     # Run confirmation tests only
npm test -- skip        # Run skip tests only
```

### Test Reports

After test completion, reports are generated in the `test-specs/reports/` directory:
- `test-report.html` - Visual test report
- `test-report.md` - Markdown format report
- Detailed output files for each test case

## Test Suite Structure

```
test-specs/
├── test-cases/           # Test case definitions
│   ├── init/            # Initialization tests
│   ├── check/           # Check operation tests
│   ├── complete-task/   # Task completion tests
│   ├── confirm/         # Confirmation tests
│   └── skip/            # Skip operation tests
├── fixtures/            # Test data fixtures
├── scripts/             # Test utility scripts
└── reports/             # Test report outputs
```

## Test Categories

### 1. Initialization Tests (init)
- Basic project initialization
- Special character handling
- Duplicate initialization protection
- Parameter validation

### 2. Check Tests (check)
- Workflow state checking
- Document completeness validation
- Progress tracking
- Edge case handling

### 3. Task Completion Tests (complete-task)
- Single task completion
- Subtask handling
- Multi-level tasks
- Format compatibility
- Duplicate numbering handling
- Orphan subtasks

### 4. Confirmation Tests (confirm)
- Stage confirmation flow
- State transition validation
- Duplicate confirmation protection

### 5. Skip Tests (skip)
- Stage skipping functionality
- Workflow flexibility

## Writing New Test Cases

### 1. Create Test Case File

Create a YAML file in the appropriate `test-cases/` directory:

```yaml
name: "Test name"
description: "Test description"
category: "Test category"
priority: "high|medium|low"

setup:
  fixtures: "fixtures/path"  # optional
  target: "./test-target-path"

request:
  method: "tools/call"
  params:
    name: "specs-workflow"
    arguments:
      path: "./path"
      action:
        type: "action-type"
        # other parameters...

expect:
  operation: "expected-operation"
  additional_checks:
    - type: "check-type"
      # check parameters...
```

### 2. Prepare Test Fixtures

If preset files are needed, create the appropriate structure in the `fixtures/` directory:

```
fixtures/
└── your-test/
    ├── requirements.md
    ├── design.md
    ├── tasks.md
    └── .workflow-confirmations.json
```

### 3. Run Single Test

```bash
# Use test file name (without extension)
npm test -- --test "your-test-name"
```

## Debugging Tips

### 1. Enable Verbose Logging

```bash
DEBUG=* npm test
```

### 2. Preserve Test Files

Don't automatically clean up generated files after tests:

```bash
NO_CLEANUP=true npm test
```

### 3. Interactive Debugging

```bash
npm run debug-test -- "test-name"
```

## Continuous Integration

The test suite is integrated with GitHub Actions, automatically running tests on every push. See `.github/workflows/test.yml` for configuration details.

## FAQ

### Q: Test failed but can't see detailed errors?
A: Check specific test output files in the `reports/` directory, or use the `DEBUG=*` environment variable.

### Q: How to test specific edge cases?
A: Refer to edge case test examples in the `test-cases/complete-task/` directory.

### Q: How does the test environment differ from actual usage?
A: The test environment uses the same core code but runs in isolated temporary directories, not affecting actual projects.

## Contributing Guidelines

1. New features must include corresponding test cases
2. Bug fixes should add regression tests
3. Maintain test case independence and repeatability
4. Use meaningful test names and descriptions

## Related Links

- [Main Project Documentation](https://github.com/kingkongshot/specs-workflow-mcp/tree/main)
- [MCP Protocol Documentation](https://modelcontextprotocol.com)
- [Issue Tracker](https://github.com/kingkongshot/specs-workflow-mcp/issues)