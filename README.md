# Smart Scan CLI Tool

A command-line interface tool for performing security scans on Model Context Protocol (MCP) servers. The CLI automatically discovers MCP server capabilities (tools, resources, and prompts) and submits them to the Smart Scan API for security analysis.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Local Development](#local-development)
  - [Using the CLI](#using-the-cli)
- [Getting Your API Token](#getting-your-api-token)
- [Usage](#usage)
  - [Scan Command](#scan-command)
  - [Check Command](#check-command)
- [Output Formats](#output-formats)
  - [Table Format (Default)](#table-format-default)
  - [JSON Format](#json-format)
- [CI/CD Integration](#cicd-integration)
  - [Exit Codes](#exit-codes)
  - [Default Behavior](#default-behavior)
  - [Customizing Failure Conditions](#customizing-failure-conditions)
  - [GitHub Actions Example](#github-actions-example)
  - [Using with jq](#using-with-jq)
- [Configuration File Format](#configuration-file-format)
  - [Transport Types](#transport-types)
  - [Configuration Merging](#configuration-merging)
- [API Integration](#api-integration)
  - [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Rate Limits](#rate-limits)
  - [Response Format](#response-format)
- [Examples](#examples)
  - [Complete Workflow Example](#complete-workflow-example)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Scripts](#scripts)
  - [Code Quality](#code-quality)
  - [Commit Messages](#commit-messages)
- [Dependencies](#dependencies)
  - [Runtime Dependencies](#runtime-dependencies)
  - [Development Dependencies](#development-dependencies)
- [Error Handling](#error-handling)
- [Testing Phase Notice](#testing-phase-notice)
- [Contributing](#contributing)
  - [Reporting Bugs](#reporting-bugs)
  - [Feature Requests](#feature-requests)
  - [Pull Requests](#pull-requests)
  - [Code Style](#code-style)
  - [Development Setup](#development-setup)
- [License](#license)
- [Support](#support)

## Features

- **Multiple Transport Support**: Connect to MCP servers via stdio, HTTP/SSE, or WebSocket
- **MCP Config Parsing**: Automatic parsing and normalization of MCP configuration files
- **Capability Discovery**: Automatically discovers tools, resources, and prompts from MCP servers
- **API Integration**: Submits scan results to the Smart Scan security analysis API
- **Tabular & JSON Output**: Human-readable table format or JSON for CI/CD pipelines
- **Verbose Logging**: Detailed debug output with `consola` logger
- **Error Handling**: Comprehensive error handling with custom error types
- **Exit Codes**: Proper exit codes for CI/CD integration (fail on high/medium/low risk)
- **Scan Status Checking**: Check the status and results of previously performed scans

## Installation

### npm (Recommended)

```bash
# Global installation
npm install -g @mcp-shark/cli

# Use it
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

### Using npx (No Installation)

If you have npm but don't want to install globally:

```bash
npx -y @mcp-shark/cli scan -c config.json --token=your_token
```

For more installation options, see [INSTALL.md](./INSTALL.md).

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd cli

# Install dependencies
npm install
```

### Using the CLI

You can run the CLI in several ways:

```bash
# Direct execution (after making executable)
./cli scan -c temp/mcps.json --token=your-token

# Using npx (from the project directory)
npx . scan -c temp/mcps.json --token=your-token

# Using node directly
node cli.js scan -c temp/mcps.json --token=your-token
```

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
./cli scan -c temp/mcps.json --token=your-token

# Using environment variable for token
export APP_TOKEN=your-token
./cli scan -c temp/mcps.json

# With verbose output
./cli scan -c temp/mcps.json --token=your-token --verbose

# JSON output (for CI/CD pipelines)
./cli scan -c temp/mcps.json --token=your-token --json

# Fail on medium risk as well (default: only fails on high/critical)
./cli scan -c temp/mcps.json --token=your-token --fail-on-medium
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
./cli check --scan-id=scan123 --token=your-token

# With verbose output
./cli check --scan-id=scan123 --token=your-token --verbose

# JSON output
./cli check --scan-id=scan123 --token=your-token --json

# Using environment variable for token
export APP_TOKEN=your-token
./cli check --scan-id=scan123
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
./cli scan -c temp/mcps.json --token=your-token --json
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
./cli scan -c temp/mcps.json --token=your-token --fail-on-medium

# Fail on low risk too
./cli scan -c temp/mcps.json --token=your-token --fail-on-low

# Don't fail on high risk (not recommended)
./cli scan -c temp/mcps.json --token=your-token --no-fail-on-high
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

      - name: Install dependencies
        run: |
          cd cli
          npm install

      - name: Run security scan
        env:
          APP_TOKEN: ${{ secrets.SMART_SCAN_TOKEN }}
        run: |
          cd cli
          ./cli scan -c temp/mcps.json --json > scan-result.json

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
./cli scan -c temp/mcps.json --token=your-token --json | jq -r '.overall_risk_level'

# Get scan ID
./cli scan -c temp/mcps.json --token=your-token --json | jq -r '.id'

# Check if scan was successful
./cli scan -c temp/mcps.json --token=your-token --json | jq -r '.status'

# Get rate limit info
./cli scan -c temp/mcps.json --token=your-token --json | jq '.rate_limit'
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
./cli scan -c mcps.json --verbose
```

**Step 3: Check scan results (if needed):**

```bash
./cli check --scan-id=scan-abc123
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

## Project Structure

```
cli/
├── cli.js              # Main CLI entry point
├── cli                 # Symlink to cli.js for ./cli execution
├── lib/
│   ├── api.js          # API client for Smart Scan service
│   ├── banner.js       # Testing phase banner display
│   ├── check.js        # Scan status checking logic
│   ├── client.js       # MCP client creation and management
│   ├── config.js       # Configuration parsing and normalization
│   ├── error.js        # Error handling utilities
│   ├── formatter.js    # Output formatting (table/JSON)
│   ├── request.js      # MCP request handlers
│   ├── run.js          # MCP server execution logic
│   ├── schedule.js     # Scan submission logic
│   └── transport.js    # Transport factory
├── temp/               # Example configurations and test scripts
└── package.json
```

## Development

### Scripts

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run both lint:fix and format
npm run fix
```

### Code Quality

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **lint-staged** for pre-commit checks
- **commitlint** for commit message validation

### Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Dependencies

### Runtime Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for client/server communication
- `axios`: HTTP client for API requests
- `cli-boxes`: Terminal box drawing for banners
- `commander`: CLI argument parsing
- `consola`: Beautiful console logging

### Development Dependencies

- `eslint`: Code linting
- `prettier`: Code formatting
- `husky`: Git hooks
- `lint-staged`: Pre-commit linting
- `@commitlint/cli`: Commit message linting

## Error Handling

The CLI uses a custom error handling system:

- `MCPError`: Base error class for all MCP-related errors
- `ConfigError`: Configuration parsing errors
- `TransportError`: Transport creation errors
- `RunError`: Server execution errors
- `ApiError`: API client and request errors

Errors are logged using `consola` with appropriate severity levels. API errors include error codes and messages from the API response.

## Testing Phase Notice

**This tool is currently in testing phase**. During this period:

- Rate limit is set to **3 scans per day** per account
- Features may change
- We appreciate your patience and understanding

The banner will be displayed when running scan commands to remind users of this limitation.

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs

If you find a bug, please open an issue on GitHub with:

1. **Clear description** of the bug
2. **Steps to reproduce** the issue
3. **Expected behavior** vs **actual behavior**
4. **Environment details**:
   - Node.js version
   - Operating system
   - CLI version
5. **Error messages** or logs (if applicable)
6. **Minimal example** that reproduces the issue (if possible)

### Feature Requests

For feature requests:

1. Open an issue describing the feature
2. Explain the use case and why it would be valuable
3. Discuss implementation approach if you have ideas

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the code style guidelines
4. **Test your changes** thoroughly
5. **Ensure all checks pass**:
   ```bash
   npm run lint:fix
   npm run format
   ```
6. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** with:
   - Clear description of changes
   - Reference to related issues (if any)
   - Screenshots or examples (if applicable)

### Code Style

- Follow the existing code style
- Run `npm run lint:fix` and `npm run format` before committing
- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions focused and small

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Make changes in your feature branch
4. Test locally with: `./cli scan -c temp/mcps.json --token=your-token`
5. Run linting and formatting before committing

## License

ISC

## Support

- **Documentation**: See [Smart Scan API Usage Guide](../smart-scan-web-app/docs/API-USAGE.md)
- **Issues**: Report bugs or request features on GitHub
- **Web Application**: [https://smart.mcpshark.sh](https://smart.mcpshark.sh)
