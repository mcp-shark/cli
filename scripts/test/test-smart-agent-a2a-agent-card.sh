#!/bin/bash

# Test Smart Agent scan with A2A Agent Card Format
# Example of an A2A (Agent-to-Agent) agent card format

API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${APP_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: APP_TOKEN environment variable is required"
  echo "Usage: export APP_TOKEN='sk_your_token' && $0"
  exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMP_DIR="$CLI_DIR/temp"

# Create temp directory if it doesn't exist
mkdir -p "$TEMP_DIR"

# Create test JSON file
cat > "$TEMP_DIR/a2a-agent-card.json" << 'EOF'
{
  "id": "file-processor-agent",
  "agent_id": "file-processor-agent",
  "agent_name": "File Processor Agent",
  "description": "An agent that processes files and performs operations",
  "tools": [
    {
      "name": "read_file",
      "description": "Read a file from the filesystem",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string"
          }
        },
        "required": ["path"]
      }
    },
    {
      "name": "process_file",
      "description": "Process a file and extract data",
      "input_schema": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string"
          },
          "operation": {
            "type": "string",
            "enum": ["extract", "transform", "analyze"]
          }
        },
        "required": ["file_path", "operation"]
      }
    },
    {
      "name": "upload_result",
      "description": "Upload processing result to external service",
      "input_schema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "description": "URL to upload the result"
          },
          "data": {
            "type": "string",
            "description": "Data to upload"
          }
        },
        "required": ["url", "data"]
      }
    }
  ],
  "capabilities": [
    {
      "name": "file_reading",
      "type": "read",
      "description": "Can read files from filesystem"
    },
    {
      "name": "file_processing",
      "type": "process",
      "description": "Can process file contents"
    },
    {
      "name": "data_upload",
      "type": "write",
      "description": "Can upload data to external services"
    }
  ]
}
EOF

echo "Testing Smart Agent scan with A2A Agent Card..."
echo "API URL: $API_URL"
echo "CLI Directory: $CLI_DIR"
echo ""

cd "$CLI_DIR" || exit 1

# Run the scan
export API_URL
if command -v jq &> /dev/null; then
  ./cli agent scan -i "$TEMP_DIR/a2a-agent-card.json" --token="$TOKEN" --json | jq '.'
else
  ./cli agent scan -i "$TEMP_DIR/a2a-agent-card.json" --token="$TOKEN" --json
fi

echo ""
echo "Expected: Smart Agent analysis of agent capabilities, privilege escalation path detection (read → process → upload)"

