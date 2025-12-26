#!/bin/bash

# Run all Smart Agent test scripts
# This script runs all test-smart-agent-*.sh scripts in sequence

API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${APP_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: APP_TOKEN environment variable is required"
  echo "Usage: export APP_TOKEN='sk_your_token' && $0"
  exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Running all Smart Agent CLI tests..."
echo "API URL: $API_URL"
echo "=========================================="
echo ""

# Export environment variables for child scripts
export API_URL
export APP_TOKEN="$TOKEN"

# Counter for results
PASSED=0
FAILED=0
TOTAL=0

# Run all smart-agent test scripts
for script in "$SCRIPT_DIR"/test-smart-agent-*.sh; do
  if [ -f "$script" ]; then
    TOTAL=$((TOTAL + 1))
    echo "=========================================="
    echo "Running: $(basename "$script")"
    echo "=========================================="
    
    if "$script"; then
      echo "✓ PASSED: $(basename "$script")"
      PASSED=$((PASSED + 1))
    else
      echo "✗ FAILED: $(basename "$script")"
      FAILED=$((FAILED + 1))
    fi
    echo ""
  fi
done

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✓ All tests passed!"
  exit 0
else
  echo "✗ Some tests failed"
  exit 1
fi

