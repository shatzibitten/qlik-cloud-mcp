#!/bin/bash
# Run user tests for the Qlik Cloud MCP server

# Check if .env.test file exists
if [ ! -f .env.test ]; then
  echo "Error: .env.test file not found. Please create one based on .env.example"
  echo "Creating .env.test from .env.example..."
  cp .env.example .env.test
  echo "Please edit .env.test with your test credentials and run this script again."
  exit 1
fi

# Load test environment variables
export $(grep -v '^#' .env.test | xargs)

# Run the tests
echo "Running Qlik Cloud MCP server user tests..."
node user-tests.js
