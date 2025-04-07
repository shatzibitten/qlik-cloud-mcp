#!/bin/bash
# Run tests for the Qlik Cloud MCP server

# Check if .env.test file exists
if [ ! -f .env.test ]; then
  echo "Error: .env.test file not found. Please run 'npm run test:setup' first."
  exit 1
fi

# Load test environment variables
export $(grep -v '^#' .env.test | xargs)

# Run the tests
echo "Running Qlik Cloud MCP server tests..."
node test/test-server.js
