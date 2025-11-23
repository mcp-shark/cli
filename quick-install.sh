#!/bin/bash
# One-liner installer - can be run directly from curl

set -e

REPO="mcp-shark-org/cli"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
BINARY_NAME="mcp-shark-cli"

# Get latest release
LATEST_TAG=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' || echo "main")

echo "Installing @mcp-shark/cli ($LATEST_TAG)..."

# Create install directory
mkdir -p "$INSTALL_DIR"

# Download and extract
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

curl -sL "https://github.com/$REPO/archive/refs/tags/$LATEST_TAG.tar.gz" -o "$TMP_DIR/cli.tar.gz"
cd "$TMP_DIR"
tar -xzf cli.tar.gz
CLI_DIR=$(find . -maxdepth 1 -type d -name "cli-*" | head -1)

cd "$CLI_DIR"
npm install --production --silent

# Create wrapper
cat > "$INSTALL_DIR/$BINARY_NAME" << EOF
#!/bin/bash
exec node "$(pwd)/cli.js" "\$@"
EOF

chmod +x "$INSTALL_DIR/$BINARY_NAME"

echo "✓ Installed to $INSTALL_DIR/$BINARY_NAME"
echo ""
echo "Add to PATH:"
echo "  export PATH=\"\$PATH:$INSTALL_DIR\""

