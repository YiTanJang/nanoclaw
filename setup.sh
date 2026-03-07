#!/bin/bash
set -euo pipefail

# setup.sh — Bootstrap script for NanoClaw
# Handles Node.js/npm setup, then points to the Kubernetes setup tool.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/setup.log"

mkdir -p "$PROJECT_ROOT/logs"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [bootstrap] $*" >> "$LOG_FILE"; }

echo "=== NanoClaw Bootstrap ==="

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "  ✗ Node.js is not installed. Please install Node.js 20+."
  exit 1
fi

NODE_VERSION=$(node --version | sed 's/^v//')
MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$MAJOR_VERSION" -lt 20 ]; then
  echo "  ✗ Node.js version $NODE_VERSION found. NanoClaw requires version 20 or higher."
  exit 1
fi
echo "  ✓ Node.js $NODE_VERSION found"

# 2. Install Dependencies
echo "  Installing dependencies..."
npm install >> "$LOG_FILE" 2>&1
echo "  ✓ Dependencies installed"

# 3. Next Steps
echo ""
echo "Bootstrap complete!"
echo "To configure your Kubernetes deployment, run:"
echo ""
echo "  npm run setup"
echo ""
