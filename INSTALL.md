# Installing @mcp-shark/cli

Install `@mcp-shark/cli` via npm.

## Installation

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

## Using npx (No Installation Required)

If you have npm installed but don't want to install globally:

```bash
npx -y @mcp-shark/cli scan -c config.json --token=your_token
```

## Requirements

- **Node.js** (v18 or higher)
- **npm** (for installing dependencies)

## Troubleshooting

### "Command not found"

If you installed globally, make sure npm's global bin directory is in your PATH:

```bash
# Check npm global prefix
npm config get prefix

# Add to PATH (example for ~/.npm-global)
export PATH="$PATH:$(npm config get prefix)/bin"
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent.

### Permission denied

If you get permission errors with global installation, you can:

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
