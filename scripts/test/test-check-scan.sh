#!/bin/bash

# Test the check command to retrieve scan results
# Requires a scan_id from a previous scan

API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${APP_TOKEN:-}"
SCAN_ID="${SCAN_ID:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: APP_TOKEN environment variable is required"
  echo "Usage: export APP_TOKEN='sk_your_token' && $0"
  exit 1
fi

if [ -z "$SCAN_ID" ]; then
  echo "Error: SCAN_ID environment variable is required"
  echo "Usage: export SCAN_ID='scan-uuid-here' && $0"
  echo ""
  echo "To get a scan_id, run one of the test scripts first:"
  echo "  export APP_TOKEN='sk_your_token'"
  echo "  export API_URL='http://localhost:3000'"
  echo "  ./scripts/test/test-smart-agent-filesystem.sh"
  echo ""
  echo "Then copy the scan_id from the output and run:"
  echo "  export SCAN_ID='your-scan-id'"
  echo "  $0"
  exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Testing check command to retrieve scan results..."
echo "API URL: $API_URL"
echo "Scan ID: $SCAN_ID"
echo "CLI Directory: $CLI_DIR"
echo ""

cd "$CLI_DIR" || exit 1

# Run the check command
export API_URL
if command -v jq &> /dev/null; then
  ./cli check -j "$SCAN_ID" --token="$TOKEN" --json | jq '.'
else
  ./cli check -j "$SCAN_ID" --token="$TOKEN" --json
fi

echo ""
echo "Expected: Scan result details including analysis, Smart Agent data (if available)"

