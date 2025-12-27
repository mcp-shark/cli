#!/bin/bash

# Test Smart Agent scan with URL input
# Downloads agent card from a URL and scans it

API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${APP_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: APP_TOKEN environment variable is required"
  echo "Usage: export APP_TOKEN='sk_your_token' && $0"
  exit 1
fi

# Example URL - you can replace this with a real agent card URL
# For testing, we'll use a placeholder that should be replaced with a real URL
AGENT_CARD_URL="${AGENT_CARD_URL:-}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Testing Smart Agent scan with URL input..."
echo "API URL: $API_URL"
echo "Agent Card URL: $AGENT_CARD_URL"
echo "CLI Directory: $CLI_DIR"
echo ""
echo "Note: This test requires a valid agent card URL."
echo "Set AGENT_CARD_URL environment variable to use a different URL."
echo ""

cd "$CLI_DIR" || exit 1

# Run the scan
export API_URL
if command -v jq &> /dev/null; then
  ./cli agent scan -i "$AGENT_CARD_URL" --token="$TOKEN" --json | jq '.'
else
  ./cli smart-agent scan -i "$AGENT_CARD_URL" --token="$TOKEN" --json
fi

echo ""
echo "Expected: Smart Agent analysis of agent card downloaded from URL"

