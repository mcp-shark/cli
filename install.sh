#!/bin/bash

# Install script for @mcp-shark/cli
# Downloads and installs the CLI from GitHub releases

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REPO="mcp-shark-org/cli"
VERSION="${VERSION:-latest}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
BINARY_NAME="mcp-shark-cli"

echo -e "${BLUE}Installing @mcp-shark/cli...${NC}"

# Detect OS and architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

# Map architecture
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Create install directory
mkdir -p "$INSTALL_DIR"

# Determine download URL
if [ "$VERSION" = "latest" ]; then
  # Get latest release
  LATEST_TAG=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
  VERSION="$LATEST_TAG"
fi

echo -e "${YELLOW}Installing version: $VERSION${NC}"

# Download from GitHub
GITHUB_URL="https://github.com/$REPO/archive/refs/tags/$VERSION.tar.gz"

# Create temporary directory
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo -e "${BLUE}Downloading from GitHub...${NC}"
curl -L "$GITHUB_URL" -o "$TMP_DIR/cli.tar.gz"

# Extract
echo -e "${BLUE}Extracting...${NC}"
cd "$TMP_DIR"
tar -xzf cli.tar.gz
CLI_DIR=$(find . -maxdepth 1 -type d -name "cli-*" | head -1)

if [ -z "$CLI_DIR" ]; then
  echo "Error: Could not find CLI directory in archive"
  exit 1
fi

# Install dependencies and create executable
cd "$CLI_DIR"
echo -e "${BLUE}Installing dependencies...${NC}"
npm install --production

# Create wrapper script
cat > "$INSTALL_DIR/$BINARY_NAME" << 'WRAPPER_EOF'
#!/bin/bash
# Wrapper script for @mcp-shark/cli
CLI_DIR="${MCP_SHARK_CLI_DIR:-$HOME/.local/lib/mcp-shark-cli}"
exec node "$CLI_DIR/cli.js" "$@"
WRAPPER_EOF

chmod +x "$INSTALL_DIR/$BINARY_NAME"

# Copy CLI to lib directory
LIB_DIR="$HOME/.local/lib/mcp-shark-cli"
mkdir -p "$LIB_DIR"
cp -r . "$LIB_DIR/"

# Set environment variable for wrapper
export MCP_SHARK_CLI_DIR="$LIB_DIR"

echo -e "${GREEN}✓ Installation complete!${NC}"
echo ""
echo "The CLI has been installed to: $INSTALL_DIR/$BINARY_NAME"
echo ""
echo "To use it, add to your PATH:"
echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
echo ""
echo "Or run directly:"
echo "  $INSTALL_DIR/$BINARY_NAME --help"

