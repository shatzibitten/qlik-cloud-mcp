#!/bin/bash

# Unit test runner for Qlik Cloud Model Context Protocol (MCP) server

# Set default values
TEST_DIR="./tests/unit"
OUTPUT_DIR="./test-results/unit"

# Display banner
echo "=========================================="
echo "  Qlik Cloud Model Context Protocol (MCP)"
echo "  Unit Test Runner"
echo "=========================================="
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if Jest is installed
if ! command -v npx jest &> /dev/null; then
    echo "Installing Jest and dependencies..."
    npm install --save-dev jest @types/jest ts-jest
fi

# Run unit tests
echo "Running unit tests..."
npx jest --config=jest.config.js --coverage --coverageDirectory="$OUTPUT_DIR/coverage"

# Check test result
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  Unit Tests Passed!"
    echo "=========================================="
    echo "Coverage report available at: $OUTPUT_DIR/coverage/lcov-report/index.html"
    exit 0
else
    echo ""
    echo "=========================================="
    echo "  Unit Tests Failed!"
    echo "=========================================="
    echo "Check the test output for details."
    exit 1
fi
