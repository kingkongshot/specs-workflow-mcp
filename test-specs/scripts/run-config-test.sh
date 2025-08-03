#!/bin/bash

# 配置驱动的测试运行脚本
# 用法: ./run-config-test.sh [test-group]

set -e

TEST_GROUP=$1

echo "🚀 运行配置驱动的端到端测试"
echo "===================================="

# 确保提取了最新的预期响应
echo "📋 提取 OpenAPI 预期响应..."
cd ..
npm run extract --silent

# 运行测试
if [ -z "$TEST_GROUP" ]; then
    echo "运行所有测试组..."
    npm run test
else
    echo "运行测试组: $TEST_GROUP"
    npm run test:$TEST_GROUP
fi

# 生成测试报告
mkdir -p reports
REPORT_FILE="reports/test-report-config-$(date +%Y%m%d-%H%M%S).md"
echo ""
echo "📝 生成测试报告: $REPORT_FILE"

# 生成 Markdown 报告
cat > "$REPORT_FILE" << EOF
# 配置驱动的端到端测试报告

生成时间: $(date)
测试组: ${TEST_GROUP:-"全部"}

## 测试配置

配置文件: test-config.yaml

## 测试结果

请查看控制台输出获取详细结果。

## 测试覆盖

- init: 初始化功能
- check: 检查文档状态
- skip: 跳过阶段
- confirm: 确认阶段
- complete_task: 完成任务

EOF

echo "✅ 测试完成！"
echo "📊 报告已保存到: $REPORT_FILE"