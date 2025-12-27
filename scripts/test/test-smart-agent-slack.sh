#!/bin/bash

# Test Smart Agent scan with Slack MCP Server
# Based on the official Anthropic Slack MCP server

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
cat > "$TEMP_DIR/slack-agent.json" << 'EOF'
{
  "server": {
    "name": "slack",
    "description": "Slack operations server"
  },
  "tools": [
    {
      "name": "send_message",
      "description": "Send a message to a Slack channel",
      "input_schema": {
        "type": "object",
        "properties": {
          "channel": {
            "type": "string",
            "description": "Channel ID or name"
          },
          "text": {
            "type": "string",
            "description": "Message text"
          }
        },
        "required": ["channel", "text"]
      }
    },
    {
      "name": "list_channels",
      "description": "List all channels in the workspace",
      "input_schema": {
        "type": "object",
        "properties": {
          "types": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Channel types to filter"
          }
        }
      }
    },
    {
      "name": "get_channel_history",
      "description": "Get message history from a channel",
      "input_schema": {
        "type": "object",
        "properties": {
          "channel": {
            "type": "string",
            "description": "Channel ID or name"
          },
          "limit": {
            "type": "number",
            "description": "Number of messages to retrieve"
          }
        },
        "required": ["channel"]
      }
    },
    {
      "name": "upload_file",
      "description": "Upload a file to a Slack channel",
      "input_schema": {
        "type": "object",
        "properties": {
          "channel": {
            "type": "string",
            "description": "Channel ID or name"
          },
          "file_path": {
            "type": "string",
            "description": "Path to file to upload"
          },
          "title": {
            "type": "string",
            "description": "File title"
          }
        },
        "required": ["channel", "file_path"]
      }
    }
  ],
  "resources": [],
  "prompts": []
}
EOF

echo "Testing Smart Agent scan with Slack MCP Server..."
echo "API URL: $API_URL"
echo "CLI Directory: $CLI_DIR"
echo ""

cd "$CLI_DIR" || exit 1

# Run the scan
export API_URL
if command -v jq &> /dev/null; then
  ./cli agent scan -i "$TEMP_DIR/slack-agent.json" --token="$TOKEN" --json | jq '.'
else
  ./cli agent scan -i "$TEMP_DIR/slack-agent.json" --token="$TOKEN" --json
fi

echo ""
echo "Expected: Data exfiltration risk assessment, privilege escalation paths"

