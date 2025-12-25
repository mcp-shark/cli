#!/bin/bash

# Test AgentRadar scan with Filesystem MCP Server
# Based on the official Anthropic filesystem MCP server

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
cat > "$TEMP_DIR/filesystem-agent.json" << 'EOF'
{
  "server": {
    "name": "filesystem",
    "description": "File system operations server"
  },
  "tools": [
    {
      "name": "read_file",
      "description": "Read a file from the filesystem",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Path to the file to read"
          }
        },
        "required": ["path"]
      }
    },
    {
      "name": "write_file",
      "description": "Write content to a file",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Path where the file should be written"
          },
          "content": {
            "type": "string",
            "description": "Content to write to the file"
          }
        },
        "required": ["path", "content"]
      }
    },
    {
      "name": "list_directory",
      "description": "List files and directories",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Path to the directory to list"
          }
        },
        "required": ["path"]
      }
    },
    {
      "name": "create_directory",
      "description": "Create a new directory",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Path where the directory should be created"
          }
        },
        "required": ["path"]
      }
    },
    {
      "name": "delete_file",
      "description": "Delete a file or directory",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Path to the file or directory to delete"
          }
        },
        "required": ["path"]
      }
    }
  ],
  "resources": [],
  "prompts": []
}
EOF

echo "Testing AgentRadar scan with Filesystem MCP Server..."
echo "API URL: $API_URL"
echo "CLI Directory: $CLI_DIR"
echo ""

cd "$CLI_DIR" || exit 1

# Run the scan
export API_URL
if command -v jq &> /dev/null; then
  ./cli agentradar scan -i "$TEMP_DIR/filesystem-agent.json" --token="$TOKEN" --json | jq '.'
else
  ./cli agentradar scan -i "$TEMP_DIR/filesystem-agent.json" --token="$TOKEN" --json
fi

echo ""
echo "Expected: AgentRadar analysis with filesystem tools, privilege escalation paths (read → write → delete)"

