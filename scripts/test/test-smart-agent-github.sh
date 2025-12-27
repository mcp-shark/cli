#!/bin/bash

# Test Smart Agent scan with GitHub MCP Server
# Based on the official Anthropic GitHub MCP server

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
cat > "$TEMP_DIR/github-agent.json" << 'EOF'
{
  "server": {
    "name": "github",
    "description": "GitHub operations server"
  },
  "tools": [
    {
      "name": "create_repository",
      "description": "Create a new GitHub repository",
      "input_schema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Repository name"
          },
          "private": {
            "type": "boolean",
            "description": "Whether the repository should be private"
          }
        },
        "required": ["name"]
      }
    },
    {
      "name": "get_file_contents",
      "description": "Get contents of a file from a repository",
      "input_schema": {
        "type": "object",
        "properties": {
          "owner": {
            "type": "string",
            "description": "Repository owner"
          },
          "repo": {
            "type": "string",
            "description": "Repository name"
          },
          "path": {
            "type": "string",
            "description": "File path in repository"
          }
        },
        "required": ["owner", "repo", "path"]
      }
    },
    {
      "name": "create_file",
      "description": "Create a file in a repository",
      "input_schema": {
        "type": "object",
        "properties": {
          "owner": {
            "type": "string",
            "description": "Repository owner"
          },
          "repo": {
            "type": "string",
            "description": "Repository name"
          },
          "path": {
            "type": "string",
            "description": "File path in repository"
          },
          "content": {
            "type": "string",
            "description": "File content"
          }
        },
        "required": ["owner", "repo", "path", "content"]
      }
    },
    {
      "name": "delete_file",
      "description": "Delete a file from a repository",
      "input_schema": {
        "type": "object",
        "properties": {
          "owner": {
            "type": "string",
            "description": "Repository owner"
          },
          "repo": {
            "type": "string",
            "description": "Repository name"
          },
          "path": {
            "type": "string",
            "description": "File path in repository"
          }
        },
        "required": ["owner", "repo", "path"]
      }
    },
    {
      "name": "list_repositories",
      "description": "List repositories for a user or organization",
      "input_schema": {
        "type": "object",
        "properties": {
          "owner": {
            "type": "string",
            "description": "User or organization name"
          }
        },
        "required": ["owner"]
      }
    }
  ],
  "resources": [],
  "prompts": []
}
EOF

echo "Testing Smart Agent scan with GitHub MCP Server..."
echo "API URL: $API_URL"
echo "CLI Directory: $CLI_DIR"
echo ""

cd "$CLI_DIR" || exit 1

# Run the scan
export API_URL
if command -v jq &> /dev/null; then
  ./cli agent scan -i "$TEMP_DIR/github-agent.json" --token="$TOKEN" --json | jq '.'
else
  ./cli agent scan -i "$TEMP_DIR/github-agent.json" --token="$TOKEN" --json
fi

echo ""
echo "Expected: Risk assessment for repository operations, privilege escalation paths"

