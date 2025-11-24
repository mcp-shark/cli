<div align="center">
  <img src="https://smart.mcpshark.sh/icon_512x512.png" alt="MCP Shark Logo" width="128" height="128">
  <h1>@mcp-shark/cli</h1>
  <p>Security scanning tool for Model Context Protocol (MCP) servers</p>
</div>

A command-line interface tool that automatically discovers MCP server capabilities (tools, resources, and prompts) and performs AI-powered security analysis. Perfect for CI/CD pipelines and automated security audits.

## Quick Start

```bash
# Install globally
npm install -g @mcp-shark/cli

# Get your API token from https://smart.mcpshark.sh/tokens

# Run a scan
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here
```

## Features

- 🔍 **Automatic Discovery**: Automatically discovers tools, resources, and prompts from MCP servers
- 🚀 **Multiple Transports**: Supports stdio, HTTP/SSE, and WebSocket connections
- 📊 **Flexible Output**: Human-readable tables or JSON for CI/CD pipelines
- 🔒 **Security Analysis**: AI-powered analysis of MCP server security risks
- ⚡ **CI/CD Ready**: Proper exit codes and JSON output for automation
- 📝 **Verbose Logging**: Detailed debug output when needed

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Getting Your API Token](#getting-your-api-token)
- [Usage](#usage)
  - [Scan Command](#scan-command)
  - [Check Command](#check-command)
- [Output Formats](#output-formats)
- [CI/CD Integration](#cicd-integration)
- [Configuration File Format](#configuration-file-format)
- [Examples](#examples)
- [Testing Phase Notice](#testing-phase-notice)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation

### Global Installation (Recommended)

```bash
npm install -g @mcp-shark/cli
```

After installation, use the CLI from anywhere:

```bash
mcp-shark-cli scan -c config.json --token=your_token
```

### Local Installation (Project-specific)

```bash
npm install @mcp-shark/cli
```

Then use with npx:

```bash
npx @mcp-shark/cli scan -c config.json --token=your_token
```

Or add to your `package.json` scripts:

```json
{
  "scripts": {
    "scan": "mcp-shark-cli scan -c config.json"
  }
}
```

### Using npx (No Installation)

If you have npm but don't want to install globally:

```bash
npx -y @mcp-shark/cli scan -c config.json --token=your_token
```

### Requirements

- **Node.js** v18 or higher
- **npm** (comes with Node.js)

## Getting Your API Token

1. Sign in to the [Smart Scan web application](https://smart.mcpshark.sh)
2. Navigate to the `/tokens` page
3. Create a new token (or use your existing token)
4. Copy the token (it starts with `sk_`)

**Important**: Save your token securely - it won't be shown again after creation!

## Usage

### Scan Command

Perform a security scan on MCP servers. This command will:

1. Connect to each configured MCP server
2. Discover their capabilities (tools, resources, prompts)
3. Submit the data to the Smart Scan API
4. Display the results in a formatted table or JSON

```bash
# Basic usage
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here

# Using environment variable for token
export APP_TOKEN=sk_your_token_here
mcp-shark-cli scan -c mcp-config.json

# With verbose output
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --verbose

# JSON output (for CI/CD pipelines)
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --json

# Fail on medium risk as well (default: only fails on high/critical)
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --fail-on-medium
```

**Options:**

- `-c, --config <path>` (required): Path to MCP configuration file
- `--token <token>`: Authentication token for API (or set `APP_TOKEN` environment variable)
- `--verbose`: Enable verbose output
- `--json`: Output results as JSON (for piping to jq or other tools)
- `--fail-on-high`: Exit with error code if risk level is high or critical (default: enabled)
- `--fail-on-medium`: Exit with error code if risk level is medium (default: disabled)
- `--fail-on-low`: Exit with error code if risk level is low (default: disabled)

**Environment Variables:**

- `APP_TOKEN`: Authentication token for the API (required if not provided via `--token`)

The CLI connects to `https://smart.mcpshark.sh` automatically.

### Check Command

Check the status and results of a previously performed scan:

```bash
# Basic usage
mcp-shark-cli check --scan-id=scan123 --token=sk_your_token_here

# With verbose output
mcp-shark-cli check --scan-id=scan123 --token=sk_your_token_here --verbose

# JSON output
mcp-shark-cli check --scan-id=scan123 --token=sk_your_token_here --json

# Using environment variable for token
export APP_TOKEN=sk_your_token_here
mcp-shark-cli check --scan-id=scan123
```

**Options:**

- `-j, --scan-id <scanId>` (required): Scan ID returned from the scan command
- `--token <token>`: Authentication token for API (or set `APP_TOKEN` environment variable)
- `--verbose`: Enable verbose output
- `--json`: Output results as JSON (for piping to jq or other tools)
- `--fail-on-high`: Exit with error code if risk level is high or critical (default: enabled)
- `--fail-on-medium`: Exit with error code if risk level is medium (default: disabled)
- `--fail-on-low`: Exit with error code if risk level is low (default: disabled)

## Output Formats

### Table Format (Default)

The default output shows scan results in a formatted table:

```
─────────────────────────────────────────────────────────────
│ Scan ID        │ abc-123-def-456                           │
│ Created At     │ 2024-01-15T10:30:00.000Z                  │
│ Status         │ SUCCESS                                   │
│ Risk Level     │ HIGH                                      │
│ Rate Limit     │ 2/3                                       │
│ Overall Reason │ Multiple high-risk tools detected...      │
│ Tool Findings  │ 5                                         │
│ Resource Findings │ 2                                     │
│ Prompt Findings │ 1                                        │
─────────────────────────────────────────────────────────────
```

### JSON Format

Use `--json` flag for machine-readable output:

```bash
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --json
```

Output:

```json
{
  "id": "abc-123-def-456",
  "created_at": "2024-01-15T10:30:00.000Z",
  "status": "success",
  "overall_risk_level": "high",
  "is_error": false,
  "error_message": null,
  "error_type": null,
  "http_status_code": 200,
  "rate_limit": {
    "limit": 3,
    "remaining": 2
  },
  "analysis_result": {
    "overall_risk_level": "high",
    "overall_reason": "Multiple high-risk tools detected...",
    "tool_findings": [...],
    "resource_findings": [...],
    "prompt_findings": [...]
  }
}
```

## CI/CD Integration

The CLI is designed for CI/CD pipelines with proper exit codes:

### Exit Codes

- `0`: Success (or risk level doesn't trigger failure)
- `1`: Error occurred or risk level triggers failure

### Default Behavior

By default, the CLI exits with code `1` if:

- The scan itself failed (API error, network error, etc.)
- The risk level is `high` or `critical`

### Customizing Failure Conditions

```bash
# Fail on medium risk as well
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --fail-on-medium

# Fail on low risk too
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --fail-on-low

# Don't fail on high risk (not recommended)
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --no-fail-on-high
```

### GitHub Actions Example

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install CLI
        run: npm install -g @mcp-shark/cli

      - name: Run security scan
        env:
          APP_TOKEN: ${{ secrets.SMART_SCAN_TOKEN }}
        run: |
          mcp-shark-cli scan -c mcp-config.json --json > scan-result.json

      - name: Check risk level
        run: |
          RISK_LEVEL=$(cat scan-result.json | jq -r '.overall_risk_level')
          if [ "$RISK_LEVEL" = "high" ] || [ "$RISK_LEVEL" = "critical" ]; then
            echo "High risk detected: $RISK_LEVEL"
            exit 1
          fi
```

### Using with jq

```bash
# Get risk level
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --json | jq -r '.overall_risk_level'

# Get scan ID
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --json | jq -r '.id'

# Check if scan was successful
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --json | jq -r '.status'

# Get rate limit info
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here --json | jq '.rate_limit'
```

## Configuration File Format

The CLI expects an MCP configuration file in JSON format. The file can contain `servers` and/or `mcpServers` properties:

```json
{
  "servers": {
    "server-name": {
      "type": "stdio",
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  },
  "mcpServers": {
    "mcp-server-name": {
      "type": "http",
      "url": "https://api.example.com/mcp/",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

### Transport Types

#### stdio (Default)

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@package/name"],
  "env": {}
}
```

#### HTTP/SSE/Streamable-HTTP

```json
{
  "type": "http",
  "url": "https://api.example.com/mcp/",
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

#### WebSocket

```json
{
  "type": "websocket",
  "url": "wss://api.example.com/mcp/"
}
```

### Configuration Merging

- All servers from both `servers` and `mcpServers` are included
- If a server name exists in both, `mcpServers` takes precedence
- MCP servers without a `type` property default to `stdio`

## API Integration

The CLI integrates with the Smart Scan API at `https://smart.mcpshark.sh`.

### API Endpoints

- `POST /api/scans`: Create a new scan (perform security scan)
- `GET /api/scans/{id}`: Retrieve scan status and details by scan ID

### Authentication

All API requests require authentication using a Bearer token:

- Provide the token via `--token` command-line option, or
- Set the `APP_TOKEN` environment variable

### Rate Limits

- Default rate limit: **3 scans per day per token**
- Rate limit is configurable per token in the database
- Rate limit resets at midnight UTC
- Rate limit information is included in successful responses

### Response Format

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "overall_risk_level": "high",
    "overall_reason": "Multiple high-risk tools detected...",
    "tool_findings": [...],
    "resource_findings": [...],
    "prompt_findings": [...],
    "notable_patterns": [...],
    "recommendations": [...]
  },
  "scan_id": "uuid-here",
  "rate_limit": {
    "limit": 3,
    "remaining": 2
  }
}
```

#### Error Responses

**Rate Limit Exceeded (429):**

```json
{
  "error": "Rate limit exceeded",
  "message": "You have reached your daily limit of 3 scans. Please try again tomorrow.",
  "limit": 3,
  "remaining": 0
}
```

**Invalid Token (401):**

```json
{
  "error": "Invalid or expired token"
}
```

**Bad Request (400):**

```json
{
  "error": "Invalid request body. Expected JSON with MCP server data."
}
```

## Examples

### Complete Workflow Example

**Step 1: Create a configuration file (`mcps.json`):**

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"your-key\""]
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer your-github-token"
      }
    }
  }
}
```

**Step 2: Run a scan:**

```bash
export APP_TOKEN=sk_your_token_here
mcp-shark-cli scan -c mcps.json --verbose
```

**Step 3: Check scan results (if needed):**

```bash
mcp-shark-cli check --scan-id=scan-abc123
```

### Example: stdio Transport

```json
{
  "mcpServers": {
    "local-tool": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"your-key\""]
    }
  }
}
```

### Example: HTTP Transport

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}
```

### Example: WebSocket Transport

```json
{
  "mcpServers": {
    "websocket-server": {
      "type": "websocket",
      "url": "wss://api.example.com/mcp/"
    }
  }
}
```

## Testing Phase Notice

⚠️ **This tool is currently in testing phase**. During this period:

- Rate limit is set to **3 scans per day** per account
- Features may change
- We appreciate your patience and understanding

The banner will be displayed when running scan commands to remind users of this limitation.

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/mcp-shark/cli/blob/main/CONTRIBUTING.md) for details.

- **Report bugs**: [Open an issue](https://github.com/mcp-shark/cli/issues)
- **Request features**: [Open an issue](https://github.com/mcp-shark/cli/issues)
- **Submit PRs**: [Fork and contribute](https://github.com/mcp-shark/cli)

## License

ISC

## Support

- **Web Application**: [https://smart.mcpshark.sh](https://smart.mcpshark.sh)
- **Documentation**: [Full Documentation](https://github.com/mcp-shark/cli#readme)
- **Issues**: [Report bugs or request features](https://github.com/mcp-shark/cli/issues)
- **Repository**: [GitHub](https://github.com/mcp-shark/cli)
