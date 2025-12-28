<div align="center">
  <img src="https://smart.mcpshark.sh/icon_512x512.png" alt="MCP Shark Logo" width="128" height="128">
  <h1>@mcp-shark/cli</h1>
  <p><strong>Security scanning tool for Model Context Protocol (MCP) servers</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/@mcp-shark/cli"><img src="https://img.shields.io/npm/v/@mcp-shark/cli.svg" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@mcp-shark/cli"><img src="https://img.shields.io/npm/dm/@mcp-shark/cli.svg" alt="npm downloads"></a>
    <a href="https://github.com/mcp-shark/cli/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@mcp-shark/cli.svg" alt="License"></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/@mcp-shark/cli.svg" alt="Node.js version"></a>
  </p>
</div>

The official command-line interface for [Smart.mcpshark.sh](https://smart.mcpshark.sh) - a security scanning service for Model Context Protocol (MCP) servers. This CLI automatically discovers MCP server capabilities (tools, resources, and prompts) and submits them to Smart Scan for AI-powered security analysis. Perfect for CI/CD pipelines, automated security audits, and programmatic integration.


## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Getting Your API Token](#getting-your-api-token)
- [Usage](#usage)
  - [Scan Command](#scan-command)
  - [Check Command](#check-command)
  - [Smart Agent Commands](#smart-agent-commands)
- [Programmatic API](#programmatic-api)
- [Output Formats](#output-formats)
- [CI/CD Integration](#cicd-integration)
- [Configuration File Format](#configuration-file-format)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Quick Start

```bash
# Install globally
npm install -g @mcp-shark/cli

# Get your API token from https://smart.mcpshark.sh/tokens

# Run a scan
mcp-shark-cli scan -c mcp-config.json --token=sk_your_token_here
```

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

You can provide the token via:
- `--token` command-line option
- `SMART_SCAN_API_TOKEN` environment variable (recommended for CI/CD)

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
export SMART_SCAN_API_TOKEN=sk_your_token_here
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
- `--token <token>`: Authentication token for API (or set `SMART_SCAN_API_TOKEN` environment variable)
- `--verbose`: Enable verbose output
- `--json`: Output results as JSON (for piping to jq or other tools)
- `--fail-on-high`: Exit with error code if risk level is high or critical (default: enabled)
- `--fail-on-medium`: Exit with error code if risk level is medium (default: disabled)
- `--fail-on-low`: Exit with error code if risk level is low (default: disabled)

**Environment Variables:**

- `SMART_SCAN_API_TOKEN`: Authentication token for the API (required if not provided via `--token`)
- `SMART_SCAN_API_URL`: API base URL (defaults to `https://smart.mcpshark.sh`, set to `http://localhost:3000` for local dev)

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
export SMART_SCAN_API_TOKEN=sk_your_token_here
mcp-shark-cli check --scan-id=scan123
```

**Options:**

- `-j, --scan-id <scanId>` (required): Scan ID returned from the scan command
- `--token <token>`: Authentication token for API (or set `SMART_SCAN_API_TOKEN` environment variable)
- `--verbose`: Enable verbose output
- `--json`: Output results as JSON (for piping to jq or other tools)
- `--fail-on-high`: Exit with error code if risk level is high or critical (default: enabled)
- `--fail-on-medium`: Exit with error code if risk level is medium (default: disabled)
- `--fail-on-low`: Exit with error code if risk level is low (default: disabled)

### Smart Agent Commands

#### Smart Agent Scan

Scan agent cards or MCP server data using Smart Agent analysis. This command detects privilege escalation paths and agent-to-agent vulnerabilities. The output format matches the standard scan command, providing consistent table and JSON formatting.

```bash
# Scan from local file
mcp-shark-cli agent scan -i agent-card.json --token=sk_your_token_here

# Scan from URL (downloads agent card automatically)
mcp-shark-cli agent scan -i https://example.com/.well-known/agent.json --token=sk_your_token_here

# JSON output (same format as normal scan)
mcp-shark-cli agent scan -i agent-card.json --token=sk_your_token_here --json

# Using environment variable for token
export SMART_SCAN_API_TOKEN=sk_your_token_here
mcp-shark-cli agent scan -i agent-card.json
```

**Options:**

- `-i, --input <path>` (required): Path to agent card JSON file or URL to download agent card from
- `--token <token>`: Authentication token for API (or set `SMART_SCAN_API_TOKEN` environment variable)
- `--verbose`: Enable verbose output
- `--json`: Output results as JSON (same format as normal scan, for piping to jq or other tools)
- `--fail-on-high`: Exit with error code if risk level is high or critical (default: enabled)
- `--fail-on-medium`: Exit with error code if risk level is medium (default: disabled)
- `--fail-on-low`: Exit with error code if risk level is low (default: disabled)

**Input Formats:**

The command accepts:
- **Local file path**: Path to a JSON file containing agent card or MCP server data
- **URL**: HTTP/HTTPS URL to download agent card from (e.g., `https://example.com/agent.json`)

#### Smart Agent Analyze

Perform local analysis without API submission (coming soon):

```bash
# Local analysis (not yet implemented)
mcp-shark-cli agent analyze -i agent-card.json -o results.json -f json
```

**Options:**

- `-i, --input <path>` (required): Path to agent card JSON or MCP server data JSON
- `-o, --output <path>`: Output file path (default: stdout)
- `-f, --format <format>`: Output format: sarif or json (default: json)
- `--verbose`: Enable verbose output

**Note**: This command is currently under development. Use `agent scan` for now.

## Programmatic API

The package can also be used as a library in your Node.js applications:

```javascript
import {
  createApiClient,
  createScan,
  getScan,
  runAllServers,
  scheduleScan,
  checkScan,
  ApiError,
  RunError,
} from "@mcp-shark/cli";
import { consola } from "consola";

// Create API client
const apiClient = createApiClient("sk_your_token_here");

// Run all servers from config file
const results = await runAllServers(consola, "./mcp-config.json");

if (results instanceof RunError) {
  console.error("Failed to run servers:", results.message);
  process.exit(1);
}

// Submit scan
const scanData = await scheduleScan(apiClient, results);

if (scanData instanceof ApiError) {
  console.error("API error:", scanData.message);
  process.exit(1);
}

console.log("Scan ID:", scanData.id);

// Check scan status
const scanResult = await checkScan(apiClient, scanData.id);

if (scanResult instanceof ApiError) {
  console.error("Failed to get scan:", scanResult.message);
  process.exit(1);
}

console.log("Risk level:", scanResult.overall_risk_level);
```

### TypeScript Support

Full TypeScript definitions are included:

```typescript
import type {
  ServerConfig,
  MCPConfigFile,
  ServerRunResult,
  ScanData,
  Logger,
} from "@mcp-shark/cli";

const config: MCPConfigFile = {
  mcpServers: {
    "my-server": {
      type: "stdio",
      command: "node",
      args: ["server.js"],
    },
  },
};
```

### API Reference

See [index.d.ts](./index.d.ts) for complete TypeScript definitions and API documentation.

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
│ OWASP Findings │ 4                                         │
│ OWASP Categories │ LLM01 (Prompt Injection) - 3           │
│                  │ LLM02 (Insecure Output Handling) - 1    │
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
  },
  "owasp_summary": {
    "categories": [
      {
        "code": "LLM01",
        "name": "Prompt Injection",
        "link": "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
        "count": 3
      },
      {
        "code": "LLM02",
        "name": "Insecure Output Handling",
        "link": "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
        "count": 1
      }
    ],
    "total": 4
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
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install CLI
        run: npm install -g @mcp-shark/cli

      - name: Run security scan
        env:
          SMART_SCAN_API_TOKEN: ${{ secrets.SMART_SCAN_TOKEN }}
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

### GitLab CI Example

```yaml
security-scan:
  image: node:20
  before_script:
    - npm install -g @mcp-shark/cli
  script:
    - mcp-shark-cli scan -c mcp-config.json --json > scan-result.json
  variables:
    SMART_SCAN_API_TOKEN: $SMART_SCAN_TOKEN
  only:
    - merge_requests
    - main
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
export SMART_SCAN_API_TOKEN=sk_your_token_here
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

### Example: Programmatic Usage

```javascript
import { createApiClient, runAllServers, scheduleScan } from "@mcp-shark/cli";
import { consola } from "consola";

async function performScan() {
  const apiClient = createApiClient(process.env.SMART_SCAN_API_TOKEN);
  const results = await runAllServers(consola, "./mcp-config.json");

  if (results instanceof RunError) {
    console.error("Failed:", results.message);
    return;
  }

  const scan = await scheduleScan(apiClient, results);
  console.log("Scan ID:", scan.id);
}
```

## Troubleshooting

### Command not found

If you installed globally, make sure npm's global bin directory is in your PATH:

```bash
# Check npm global prefix
npm config get prefix

# Add to PATH (example for ~/.npm-global)
export PATH="$PATH:$(npm config get prefix)/bin"
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent.

### Permission denied

If you get permission errors with global installation:

1. **Use a node version manager** (recommended):
   ```bash
   # With nvm
   nvm install node
   nvm use node
   npm install -g @mcp-shark/cli
   ```

2. **Change npm's default directory**:
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   npm install -g @mcp-shark/cli
   ```

3. **Use local installation** instead:
   ```bash
   npm install @mcp-shark/cli
   npx @mcp-shark/cli scan -c config.json --token=your_token
   ```

### Invalid token error

- Verify your token is correct and starts with `sk_`
- Check if the token has expired (create a new one at https://smart.mcpshark.sh/tokens)
- Ensure you're using the correct environment variable name (`SMART_SCAN_API_TOKEN`)

### Rate limit exceeded

- Default rate limit is 3 scans per day per token
- Rate limit resets at midnight UTC
- Check your rate limit status in the scan response
- Contact support if you need a higher rate limit

### Connection errors

- Verify your internet connection
- Check if `https://smart.mcpshark.sh` is accessible
- For local development, set `SMART_SCAN_API_URL=http://localhost:3000`

### Server connection failures

- Verify your MCP configuration file is valid JSON
- Check that server commands are executable
- For HTTP/WebSocket servers, verify URLs are correct
- Use `--verbose` flag for detailed error messages

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/mcp-shark/cli/blob/main/CONTRIBUTING.md) for details.

- **Report bugs**: [Open an issue](https://github.com/mcp-shark/cli/issues)
- **Request features**: [Open an issue](https://github.com/mcp-shark/cli/issues)
- **Submit PRs**: [Fork and contribute](https://github.com/mcp-shark/cli)

## Support

- **Web Application**: [https://smart.mcpshark.sh](https://smart.mcpshark.sh)
- **Documentation**: [Full Documentation](https://github.com/mcp-shark/cli#readme)
- **Issues**: [Report bugs or request features](https://github.com/mcp-shark/cli/issues)
- **Repository**: [GitHub](https://github.com/mcp-shark/cli)

## License

ISC

---

<div align="center">
  <p>Made with ❤️ by the MCP Shark team</p>
  <p>
    <a href="https://smart.mcpshark.sh">Website</a> •
    <a href="https://github.com/mcp-shark/cli">GitHub</a> •
    <a href="https://www.npmjs.com/package/@mcp-shark/cli">npm</a>
  </p>
</div>
