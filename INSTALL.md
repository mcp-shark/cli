# Installing @mcp-shark/cli

You can install `@mcp-shark/cli` via npm (recommended) or directly from GitHub.

## Method 1: npm (Recommended)

### Global Installation

```bash
npm install -g @mcp-shark/cli
```

After installation, you can use the CLI from anywhere:

```bash
mcp-shark-cli scan -c config.json --token=your_token
```

Or using the package name:

```bash
@mcp-shark/cli scan -c config.json --token=your_token
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

### Updating

```bash
npm update -g @mcp-shark/cli
```

## Method 2: GitHub Installation (No npm required)

### One-Line Installer

```bash
curl -fsSL https://raw.githubusercontent.com/mcp-shark-org/cli/main/install.sh | bash
```

This will:
- Download the latest release from GitHub
- Install dependencies
- Place the CLI in `~/.local/bin/mcp-shark-cli`
- Add it to your PATH (you may need to restart your terminal)

### Direct Execution (No Installation)

Run the CLI directly without installing:

```bash
curl -fsSL https://raw.githubusercontent.com/mcp-shark-org/cli/main/mcp-shark-cli | bash -s -- scan -c config.json --token=your_token
```

Or download the wrapper script:

```bash
curl -fsSL https://raw.githubusercontent.com/mcp-shark-org/cli/main/mcp-shark-cli -o mcp-shark-cli
chmod +x mcp-shark-cli
./mcp-shark-cli scan -c config.json --token=your_token
```

The wrapper will automatically:
- Download the CLI from GitHub
- Cache it locally
- Run it with your arguments

### Manual Installation

1. **Download the release:**
   ```bash
   # Get latest release
   VERSION=$(curl -s https://api.github.com/repos/mcp-shark-org/cli/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
   
   # Download
   curl -L "https://github.com/mcp-shark-org/cli/archive/refs/tags/$VERSION.tar.gz" -o cli.tar.gz
   tar -xzf cli.tar.gz
   cd cli-*
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Make it executable:**
   ```bash
   chmod +x cli.js
   ```

4. **Use it:**
   ```bash
   ./cli.js scan -c config.json --token=your_token
   ```

### Using npx with GitHub (Requires npm, but no installation)

If you have npm installed but don't want to install globally:

```bash
npx -y github:mcp-shark-org/cli scan -c config.json --token=your_token
```

## Environment Variables

- `MCP_SHARK_CLI_VERSION` - Specify a version (default: `latest`)
- `MCP_SHARK_CLI_CACHE` - Cache directory for direct execution (default: `~/.cache/mcp-shark-cli`)
- `MCP_SHARK_CLI_DIR` - Installation directory for wrapper script

## Updating

### npm:
```bash
npm update -g @mcp-shark/cli
```

### GitHub Installer:
```bash
curl -fsSL https://raw.githubusercontent.com/mcp-shark-org/cli/main/install.sh | bash
```

### Direct execution:
The wrapper automatically uses the latest version. To force a specific version:
```bash
MCP_SHARK_CLI_VERSION=v1.0.0 ./mcp-shark-cli scan -c config.json
```

### Manual:
Download the new release and repeat the installation steps.

## Requirements

- Node.js (v18 or higher)
- npm (for installing dependencies)
- curl (for downloading)
- bash (for scripts)

## Troubleshooting

### "Command not found"
Make sure `~/.local/bin` is in your PATH:
```bash
export PATH="$PATH:$HOME/.local/bin"
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent.

### Permission denied
Make sure the script is executable:
```bash
chmod +x mcp-shark-cli
```

### Network issues
If GitHub is blocked, you can:
1. Use a VPN or proxy
2. Download manually and use Method 3
3. Host the files on your own server

## GitHub Releases Setup

To enable GitHub releases:

1. **Create a release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Go to GitHub:**
   - Navigate to your repository
   - Click "Releases" → "Create a new release"
   - Select the tag
   - Add release notes
   - Publish

3. **The installer will automatically use releases:**
   - `latest` tag points to the most recent release
   - Specific versions can be specified

## Alternative: GitHub Actions Auto-Release

Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            cli.js
            lib/**
            package.json
```

This automatically creates releases when you push tags.

