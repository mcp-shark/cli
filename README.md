# Security Scanning CLI Tool

A command-line interface tool for security scanning that uses Model Context Protocol (MCP) servers to discover capabilities and submit scan results to a security scanning API.

## Features

- 🔌 **Multiple Transport Support**: Connect to MCP servers via stdio, HTTP/SSE, or WebSocket
- ⚙️ **MCP Config Parsing**: Automatic parsing and normalization of MCP configuration files
- 🛠️ **Capability Discovery**: Automatically discovers tools, resources, and prompts from MCP servers
- 📡 **API Integration**: Submits scan results to a security scanning API
- 🔍 **Verbose Logging**: Detailed debug output with `consola` logger
- ✅ **Error Handling**: Comprehensive error handling with custom error types
- 🧪 **Dry-Run Mode**: Test configurations without making changes
- 🔎 **Scan Status Checking**: Check the status of scheduled scans by ID

## Installation

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd cli

# Install dependencies
npm install
```

### Global Installation (via npx)

Once published, you can use the CLI globally:

```bash
npx @your-org/cli schedule --config=/path/to/config.json
```

## Usage

### Schedule Command

Run MCP servers to discover their capabilities (tools, resources, and prompts) and submit the results as a scan to the security scanning API:

```bash
# Basic usage
node cli.js schedule --config=temp/mcps.json

# With verbose output
node cli.js schedule --config=temp/mcps.json --verbose

# With token authentication
node cli.js schedule --config=temp/mcps.json --token=your-token

# Using environment variable for token
APP_TOKEN=your-token node cli.js schedule --config=temp/mcps.json

# With custom API base URL
API_BASE_URL=https://api.example.com APP_TOKEN=your-token node cli.js schedule --config=temp/mcps.json

# Dry-run mode (no actual connections or API calls)
node cli.js schedule --config=temp/mcps.json --dry-run
```

**Options:**

- `-c, --config <path>` (required): Path to MCP configuration file
- `--token <token>`: Authentication token for API (or set `APP_TOKEN` environment variable)
- `-d, --dry-run`: Run in dry-run mode (no changes will be made)
- `--verbose`: Enable verbose output

**Environment Variables:**

- `APP_TOKEN`: Authentication token for the API (required if not provided via `--token`)
- `API_BASE_URL`: Base URL for the security scanning API (required)

**What it does:**

1. Parses the MCP configuration file
2. Connects to each configured MCP server
3. Discovers tools, resources, and prompts from each server
4. Submits the collected data as a scan to the security scanning API
5. Returns a scan ID for tracking the scan status

### Check Command

Check the status and details of a previously scheduled scan:

```bash
# Basic usage
node cli.js check --scan-id=scan123 --token=your-token

# With verbose output
node cli.js check --scan-id=scan123 --token=your-token --verbose

# Using environment variable for token
APP_TOKEN=your-token node cli.js check --scan-id=scan123

# With custom API base URL
API_BASE_URL=https://api.example.com APP_TOKEN=your-token node cli.js check --scan-id=scan123
```

**Options:**

- `-j, --scan-id <scanId>` (required): Scan ID returned from the schedule command
- `--token <token>`: Authentication token for API (or set `APP_TOKEN` environment variable)
- `--verbose`: Enable verbose output

**Environment Variables:**

- `APP_TOKEN`: Authentication token for the API (required if not provided via `--token`)
- `API_BASE_URL`: Base URL for the security scanning API (required)

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

The CLI integrates with a security scanning API to submit scan results. The API expects scan data containing information about MCP servers and their discovered capabilities.

### API Endpoints

- `POST /v1/scans`: Create a new scan with MCP server discovery results
- `GET /v1/scans/:scanId`: Retrieve scan status and details by scan ID

### Authentication

All API requests require authentication using a Bearer token:

- Provide the token via `--token` command-line option, or
- Set the `APP_TOKEN` environment variable

### API Base URL

The API base URL can be configured:

- Set the `API_BASE_URL` environment variable (recommended)
- The API client will use this URL for all requests

Example:

```bash
export API_BASE_URL=https://api.example.com
export APP_TOKEN=your-token-here
node cli.js schedule --config=mcps.json
```

### Scan Data Format

When scheduling a scan, the CLI collects the following information from each MCP server:

- Server name
- Available tools
- Available resources
- Available prompts

This data is formatted and sent to the API as an array of server results.

## Examples

### Complete Workflow Example

**Step 1: Schedule a scan**

Create a configuration file (`mcps.json`):

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
        "X-MCP-Readonly": "true"
      }
    }
  }
}
```

Run the schedule command:

```bash
APP_TOKEN=your-api-token API_BASE_URL=https://api.example.com node cli.js schedule --config=mcps.json --verbose
```

Output:

```
✓ Schedule command executed Scan ID: scan-abc123
```

**Step 2: Check scan status**

Use the scan ID from the previous step:

```bash
APP_TOKEN=your-api-token API_BASE_URL=https://api.example.com node cli.js check --scan-id=scan-abc123 --verbose
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
        "X-MCP-Readonly": "true"
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
├── lib/
│   ├── api.js          # API client for security scanning service
│   ├── check.js        # Scan status checking logic
│   ├── client.js       # MCP client creation and management
│   ├── config.js       # Configuration parsing and normalization
│   ├── error.js        # Error handling utilities
│   ├── request.js      # MCP request handlers
│   ├── run.js          # MCP server execution logic
│   ├── schedule.js     # Scan scheduling logic
│   └── transport.js    # Transport factory
├── temp/               # Example configurations
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
- `TransPortError`: Transport creation errors
- `RunError`: Server execution errors
- `ApiError`: API client and request errors

Errors are logged using `consola` with appropriate severity levels. API errors include error codes and messages from the API response.

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass and linting is clean
5. Submit a pull request with a clear description
