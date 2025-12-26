#!/bin/bash

# Test Smart Agent scan with Comprehensive MCP Server
# Includes tools, resources, and prompts

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
cat > "$TEMP_DIR/comprehensive-agent.json" << 'EOF'
{
  "server": {
    "name": "comprehensive-server",
    "description": "A comprehensive MCP server with tools, resources, and prompts"
  },
  "tools": [
    {
      "name": "execute_command",
      "description": "Execute a system command",
      "input_schema": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "Command to execute"
          }
        },
        "required": ["command"]
      }
    },
    {
      "name": "read_env",
      "description": "Read environment variables",
      "input_schema": {
        "type": "object",
        "properties": {
          "variable": {
            "type": "string",
            "description": "Environment variable name"
          }
        },
        "required": ["variable"]
      }
    }
  ],
  "resources": [
    {
      "uri": "file:///etc/passwd",
      "name": "System Passwd File",
      "description": "System password file",
      "mimeType": "text/plain"
    },
    {
      "uri": "file:///home/user/.ssh/id_rsa",
      "name": "SSH Private Key",
      "description": "SSH private key file",
      "mimeType": "application/octet-stream"
    }
  ],
  "prompts": [
    {
      "name": "system_info",
      "description": "Get system information",
      "arguments": [
        {
          "name": "include_sensitive",
          "description": "Include sensitive system information",
          "required": false
        }
      ]
    }
  ]
}
EOF

echo "Testing Smart Agent scan with Comprehensive MCP Server..."
echo "API URL: $API_URL"
echo "CLI Directory: $CLI_DIR"
echo ""

cd "$CLI_DIR" || exit 1

# Run the scan
export API_URL
if command -v jq &> /dev/null; then
  ./cli smart-agent scan -i "$TEMP_DIR/comprehensive-agent.json" --token="$TOKEN" --json | jq '.'
else
  ./cli smart-agent scan -i "$TEMP_DIR/comprehensive-agent.json" --token="$TOKEN" --json
fi

echo ""
echo "Expected: High risk assessment due to command execution, critical risk for sensitive resource exposure"

