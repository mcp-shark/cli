# Publishing @mcp-shark/cli to npm

This guide explains how to publish the CLI package to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **Organization**: The package is scoped as `@mcp-shark/cli`, so you need to:
   - Create an organization named `mcp-shark` on npm, OR
   - Publish as a personal scoped package (requires npm account setup)

## Manual Publishing

### First Time Setup

1. **Login to npm:**
   ```bash
   npm login
   ```

2. **Verify you're logged in:**
   ```bash
   npm whoami
   ```

3. **Test the package (dry run):**
   ```bash
   npm run publish:dry-run
   ```

4. **Publish:**
   ```bash
   npm run publish:public
   ```

### Updating Version and Publishing

1. **Update version in package.json:**
   ```bash
   npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # for new features (1.0.0 -> 1.1.0)
   npm version major  # for breaking changes (1.0.0 -> 2.0.0)
   ```

2. **Publish:**
   ```bash
   npm run publish:public
   ```

## Automated Publishing (GitHub Actions)

The GitHub Actions workflow automatically publishes to npm when you push a version tag.

### Setup

1. **Create npm token:**
   - Go to [npmjs.com](https://www.npmjs.com) → Account Settings → Access Tokens
   - Create a new "Automation" token
   - Copy the token

2. **Add to GitHub Secrets:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add a new secret named `NPM_TOKEN`
   - Paste your npm token

3. **Create a release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

The workflow will:
- Update package.json version from the tag
- Run linting
- Publish to npm
- Create a GitHub release

## Package Configuration

The package is configured with:

- **Name**: `@mcp-shark/cli`
- **Binaries**: 
  - `cli`
  - `@mcp-shark/cli`
  - `mcp-shark-cli`
- **Files included**: Only necessary files (see `.npmignore`)
- **Node version**: Requires Node.js 18+

## Verification

After publishing, verify the package:

```bash
# Check package info
npm view @mcp-shark/cli

# Test installation
npm install -g @mcp-shark/cli
mcp-shark-cli --version
```

## Troubleshooting

### "You do not have permission to publish"
- Make sure you're logged in: `npm login`
- Verify you have access to the `@mcp-shark` organization
- Check if the package name is already taken

### "Package name already exists"
- The package name might be taken
- You may need to use a different scope or name
- Contact npm support if it's your package but you can't publish

### Version conflicts
- Make sure the version in package.json matches the git tag
- Use `npm version` command to update both

## Unpublishing

If you need to unpublish (use carefully):

```bash
# Unpublish a specific version (within 72 hours)
npm unpublish @mcp-shark/cli@1.0.0

# Unpublish entire package (requires npm support)
# Contact npm support for this
```

**Note**: Unpublishing should be avoided. Use deprecation instead:

```bash
npm deprecate @mcp-shark/cli@1.0.0 "Use version 1.1.0 instead"
```

