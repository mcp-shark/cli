#!/bin/bash

# Main test runner script
# Usage: ./run-tests.sh [API_URL] [TOKEN]
# Example: ./run-tests.sh http://localhost:3000 sk_your_token_here

set -e

# Parse arguments
API_URL="${1:-${API_URL:-http://localhost:3000}}"
TOKEN="${2:-${APP_TOKEN:-}}"

if [ -z "$TOKEN" ]; then
  echo "Error: Token is required"
  echo ""
  echo "Usage:"
  echo "  $0 [API_URL] [TOKEN]"
  echo ""
  echo "Examples:"
  echo "  $0 http://localhost:3000 sk_your_token_here"
  echo "  $0 http://localhost:3000"
  echo "    (will prompt for token if APP_TOKEN not set)"
  echo ""
  echo "Or set environment variables:"
  echo "  export API_URL='http://localhost:3000'"
  echo "  export APP_TOKEN='sk_your_token_here'"
  echo "  $0"
  exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Export for child scripts
export API_URL
export APP_TOKEN="$TOKEN"

echo "=========================================="
echo "CLI Test Runner"
echo "=========================================="
echo "API URL: $API_URL"
echo "Token: ${TOKEN:0:20}..."
echo "CLI Directory: $CLI_DIR"
echo "=========================================="
echo ""

cd "$CLI_DIR" || exit 1

# Counter for results
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test script
run_test() {
  local script="$1"
  local test_name="$2"
  
  if [ ! -f "$script" ]; then
    echo "Warning: Test script not found: $script"
    return 1
  fi
  
  TOTAL=$((TOTAL + 1))
  echo "=========================================="
  echo "[$TOTAL] Running: $test_name"
  echo "=========================================="
  
  if "$script"; then
    echo ""
    echo "✓ PASSED: $test_name"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo ""
    echo "✗ FAILED: $test_name"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Run Smart Agent tests
echo "Smart Agent Scan Tests"
echo "=========================================="
run_test "$SCRIPT_DIR/test-smart-agent-filesystem.sh" "Filesystem MCP Server"
run_test "$SCRIPT_DIR/test-smart-agent-github.sh" "GitHub MCP Server"
run_test "$SCRIPT_DIR/test-smart-agent-slack.sh" "Slack MCP Server"
run_test "$SCRIPT_DIR/test-smart-agent-sqlite.sh" "SQLite MCP Server"
run_test "$SCRIPT_DIR/test-smart-agent-a2a-agent-card.sh" "A2A Agent Card"
run_test "$SCRIPT_DIR/test-smart-agent-comprehensive.sh" "Comprehensive MCP Server"

echo ""
echo "Regular Scan Tests"
echo "=========================================="
run_test "$SCRIPT_DIR/test-scan-filesystem.sh" "Regular Scan (Filesystem)"

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✓ All tests passed!"
  exit 0
else
  echo "✗ $FAILED test(s) failed"
  exit 1
fi

