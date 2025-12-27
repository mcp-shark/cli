#!/bin/bash

# Test Smart Agent scan with SQLite MCP Server
# Based on the official Anthropic SQLite MCP server

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
cat > "$TEMP_DIR/sqlite-agent.json" << 'EOF'
{
  "server": {
    "name": "sqlite",
    "description": "SQLite database operations server"
  },
  "tools": [
    {
      "name": "execute_query",
      "description": "Execute a SQL query on the database",
      "input_schema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "SQL query to execute"
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "list_tables",
      "description": "List all tables in the database",
      "input_schema": {
        "type": "object",
        "properties": {
          "database": {
            "type": "string",
            "description": "Database file path"
          }
        }
      }
    },
    {
      "name": "get_schema",
      "description": "Get schema for a table",
      "input_schema": {
        "type": "object",
        "properties": {
          "database": {
            "type": "string",
            "description": "Database file path"
          },
          "table": {
            "type": "string",
            "description": "Table name"
          }
        },
        "required": ["table"]
      }
    }
  ],
  "resources": [],
  "prompts": []
}
EOF

echo "Testing Smart Agent scan with SQLite MCP Server..."
echo "API URL: $API_URL"
echo "CLI Directory: $CLI_DIR"
echo ""

cd "$CLI_DIR" || exit 1

# Run the scan
export API_URL
if command -v jq &> /dev/null; then
  ./cli agent scan -i "$TEMP_DIR/sqlite-agent.json" --token="$TOKEN" --json | jq '.'
else
  ./cli agent scan -i "$TEMP_DIR/sqlite-agent.json" --token="$TOKEN" --json
fi

echo ""
echo "Expected: SQL injection risk assessment, privilege escalation paths"

