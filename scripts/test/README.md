# CLI Test Scripts

This directory contains shell scripts for testing the CLI tool with real MCP servers and agent cards.

## Prerequisites

- Local development server running on `http://localhost:3000`
- CLI tool installed and available in PATH (or use `./cli` from project root)
- `jq` installed for JSON formatting (optional but recommended)
- Valid API token (set via `APP_TOKEN` environment variable)

## Configuration

All scripts use the following defaults:
- **API URL**: `http://localhost:3000` (set via `API_URL` env var, defaults to production)
- **Token**: Must be set via `APP_TOKEN` environment variable

## Available Test Scripts

### Smart Agent Scan Tests

1. **test-smart-agent-filesystem.sh**
   - Tests Filesystem MCP Server (Anthropic)
   - Tools: read_file, write_file, list_directory, create_directory, delete_file
   - Expected: Privilege escalation paths (read → write → delete)

2. **test-smart-agent-github.sh**
   - Tests GitHub MCP Server (Anthropic)
   - Tools: create_repository, get_file_contents, create_file, delete_file, list_repositories
   - Expected: Risk assessment for repository operations

3. **test-smart-agent-slack.sh**
   - Tests Slack MCP Server (Anthropic)
   - Tools: send_message, list_channels, get_channel_history, upload_file
   - Expected: Data exfiltration risk assessment

4. **test-smart-agent-sqlite.sh**
   - Tests SQLite MCP Server (Anthropic)
   - Tools: execute_query, list_tables, get_schema
   - Expected: SQL injection risk assessment

5. **test-smart-agent-a2a-agent-card.sh**
   - Tests A2A Agent Card format
   - Includes tools and capabilities
   - Expected: Agent capability analysis, privilege escalation paths

6. **test-smart-agent-url.sh**
   - Tests downloading agent card from a URL
   - Demonstrates URL input support
   - Expected: Smart Agent analysis of agent card downloaded from URL

7. **test-smart-agent-comprehensive.sh**
   - Tests comprehensive MCP server with tools, resources, and prompts
   - Includes sensitive resources and command execution
   - Expected: High risk assessment for command execution and sensitive data exposure

### Regular Scan Tests

8. **test-scan-filesystem.sh**
   - Tests regular scan command with filesystem MCP server
   - Uses MCP config file format
   - Expected: Standard security analysis

9. **test-check-scan.sh**
   - Tests the check command to retrieve scan results
   - Requires a scan_id from a previous scan
   - Expected: Scan result details

## Usage

### Quick Start - Run All Tests:

```bash
# Pass URL and token as arguments (recommended)
./scripts/test/run-tests.sh http://localhost:3000 sk_your_token_here

# Or set environment variables first
export API_URL="http://localhost:3000"
export APP_TOKEN="sk_your_actual_token_here"
./scripts/test/run-tests.sh
```

### Run a single test:

```bash
# Set your API token and API URL
export APP_TOKEN="sk_your_actual_token_here"
export API_URL="http://localhost:3000"

# Run a specific test
./scripts/test/test-smart-agent-filesystem.sh
```

### Run all Smart Agent tests only:

```bash
export APP_TOKEN="sk_your_actual_token_here"
export API_URL="http://localhost:3000"
./scripts/test/run-all-tests.sh
```

### Use CLI from project root:

```bash
# If CLI is not in PATH, use relative path
cd /path/to/cli
export APP_TOKEN="sk_your_token"
export API_URL="http://localhost:3000"
./scripts/test/test-smart-agent-filesystem.sh
```

## Expected Output

Each script outputs:
1. Test information (API URL, test type)
2. CLI command being executed
3. JSON response from the API (formatted with `jq` if available)
4. Expected result description

## Response Structure

Successful responses include:
- `success: true`
- `data`: Security analysis results
- `scan_id`: UUID for retrieving detailed results
- `smart-agent`: Smart Agent analysis with:
  - `enabled`: boolean
  - `agents`: Array of discovered agents
  - `tools`: Array of discovered tools
  - `capabilities`: Array of capabilities
  - `vulnerabilities`: Array of security issues
  - `paths`: Array of privilege escalation paths
  - `graph_data`: Graph visualization data
  - `summary`: Summary statistics
- `rate_limit`: Rate limit information

## Troubleshooting

### Issue: Command not found
- **Solution**: Ensure CLI is installed or use `./cli` from project root
- Check: `which mcp-shark-cli` or `which cli`

### Issue: Connection refused
- **Solution**: Ensure the local dev server is running on port 3000
- Check: `npm run dev` in the smart-scan-web-app directory
- Verify: `API_URL` environment variable is set to `http://localhost:3000`

### Issue: 401 Unauthorized
- **Solution**: Verify your API token is correct
- Check: Token format should start with `sk_`
- Verify: `APP_TOKEN` environment variable is set

### Issue: jq not found
- **Solution**: Install jq or remove `| jq '.'` from scripts
- macOS: `brew install jq`
- Linux: `sudo apt-get install jq` or `sudo yum install jq`

### Issue: Permission denied
- **Solution**: Make scripts executable: `chmod +x scripts/test/test-*.sh`

## Related Documentation

- [CLI README](../../README.md) - CLI usage documentation
- [API Documentation](../../../smart-scan-web-app/docs/API-USAGE.md) - General API usage

---

**Last Updated**: 2025-01-27

