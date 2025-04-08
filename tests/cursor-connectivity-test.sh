#!/bin/bash

# Test script for Cursor connectivity
# This script tests the Cursor connector by simulating Cursor's interaction with the MCP server

echo "Starting Cursor connectivity test..."

# Set up test environment
TEST_PORT=3002
TEST_API_KEY="test-cursor-api-key"

# Start the MCP server
echo "Starting MCP server on port $TEST_PORT..."
node -e "
const { Server } = require('../src/server/server');
const { ModelContextManager } = require('../src/model/model-context-manager');
const { AuthManager } = require('../src/auth/auth-manager');
const { LogManager } = require('../src/utils/log-manager');
const { ConfigManager } = require('../src/config/config-manager');
const { QlikCloudModelContextIntegration } = require('../src/api/qlik-cloud-integration');
const { CursorConnector } = require('../src/integrations/cursor-connector');

// Create mock objects
const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.log
};

const config = {
  get: (key, defaultValue) => {
    const configValues = {
      'server.port': $TEST_PORT,
      'server.host': 'localhost',
      'qlikCloud.baseUrl': 'https://test-tenant.us.qlikcloud.com',
      'qlikCloud.tenantId': 'test-tenant',
      'qlikCloud.authType': 'oauth2'
    };
    return configValues[key] || defaultValue;
  }
};

const authManager = {
  getProvider: () => ({
    getToken: async () => 'test-token'
  }),
  on: () => {}
};

const contextManager = {
  createContext: async () => ({
    id: 'test-context-id',
    getMetadata: () => ({
      id: 'test-context-id',
      name: 'Test Context'
    }),
    saveState: async () => ({ id: 'test-state-id' }),
    restoreState: async () => true
  }),
  getContext: () => ({
    id: 'test-context-id',
    getMetadata: () => ({
      id: 'test-context-id',
      name: 'Test Context'
    }),
    saveState: async () => ({ id: 'test-state-id' }),
    restoreState: async () => true
  }),
  listContexts: () => [{
    id: 'test-context-id',
    name: 'Test Context'
  }],
  deleteContext: async () => true,
  on: () => {}
};

const qlikCloudIntegration = {
  clients: {
    appClient: {
      getApps: async () => [{
        id: 'test-app-id',
        name: 'Test App'
      }],
      getApp: async () => ({
        id: 'test-app-id',
        name: 'Test App'
      })
    }
  }
};

// Create server
const server = new Server(logger, config, authManager);

// Initialize server
server.initialize().then(() => {
  // Create Cursor connector
  const cursorConnector = new CursorConnector(
    server,
    contextManager,
    authManager,
    logger,
    config,
    qlikCloudIntegration,
    {
      apiKey: '$TEST_API_KEY',
      anthropicBaseUrl: 'https://api.anthropic.com',
      anthropicApiVersion: '2023-06-01',
      defaultModel: 'claude-3-sonnet-20240229',
      maxTokens: 4096
    }
  );
  
  console.log('MCP server started and Cursor connector initialized');
  console.log('Server is running on http://localhost:$TEST_PORT');
  console.log('Press Ctrl+C to stop the server');
});
" &

# Store the server process ID
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Test Anthropic API models endpoint
echo "Testing Anthropic API models endpoint..."
MODELS_RESPONSE=$(curl -s -H "x-api-key: $TEST_API_KEY" http://localhost:$TEST_PORT/anthropic/v1/models)

if [[ $MODELS_RESPONSE == *"claude-3"* ]]; then
  echo "✅ Anthropic API models endpoint test passed"
else
  echo "❌ Anthropic API models endpoint test failed"
  echo "Response: $MODELS_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test Anthropic API messages endpoint
echo "Testing Anthropic API messages endpoint..."
MESSAGES_RESPONSE=$(curl -s -X POST http://localhost:$TEST_PORT/anthropic/v1/messages \
  -H "x-api-key: $TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [
      {
        "role": "user",
        "content": "Hello, world!"
      }
    ]
  }')

if [[ $MESSAGES_RESPONSE == *"assistant"* ]]; then
  echo "✅ Anthropic API messages endpoint test passed"
else
  echo "❌ Anthropic API messages endpoint test failed"
  echo "Response: $MESSAGES_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test Anthropic API completions endpoint
echo "Testing Anthropic API completions endpoint..."
COMPLETIONS_RESPONSE=$(curl -s -X POST http://localhost:$TEST_PORT/anthropic/v1/complete \
  -H "x-api-key: $TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "prompt": "Human: Hello, world!\n\nAssistant:"
  }')

if [[ $COMPLETIONS_RESPONSE == *"completion"* ]]; then
  echo "✅ Anthropic API completions endpoint test passed"
else
  echo "❌ Anthropic API completions endpoint test failed"
  echo "Response: $COMPLETIONS_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test Qlik tool integration
echo "Testing Qlik tool integration..."
QLIK_TOOL_RESPONSE=$(curl -s -X POST http://localhost:$TEST_PORT/anthropic/v1/messages \
  -H "x-api-key: $TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [
      {
        "role": "user",
        "content": "List all Qlik apps"
      }
    ],
    "tools": [
      {
        "name": "qlik_list_apps"
      }
    ]
  }')

if [[ $QLIK_TOOL_RESPONSE == *"tool_results"* && $QLIK_TOOL_RESPONSE == *"test-app-id"* ]]; then
  echo "✅ Qlik tool integration test passed"
else
  echo "❌ Qlik tool integration test failed"
  echo "Response: $QLIK_TOOL_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test authentication failure
echo "Testing authentication failure..."
AUTH_FAILURE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: invalid-key" http://localhost:$TEST_PORT/anthropic/v1/models)

if [[ $AUTH_FAILURE_RESPONSE == "401" ]]; then
  echo "✅ Authentication failure test passed"
else
  echo "❌ Authentication failure test failed"
  echo "Response code: $AUTH_FAILURE_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test Cursor instructions generation
echo "Testing Cursor instructions generation..."
INSTRUCTIONS=$(node -e "
const { CursorConnector } = require('../src/integrations/cursor-connector');

// Create a minimal connector instance
const cursorConnector = new CursorConnector(
  { app: {}, baseUrl: 'http://localhost:$TEST_PORT', on: () => {} },
  {},
  {},
  { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  {},
  {},
  {
    apiKey: '$TEST_API_KEY',
    anthropicBaseUrl: 'https://api.anthropic.com',
    anthropicApiVersion: '2023-06-01',
    defaultModel: 'claude-3-sonnet-20240229',
    maxTokens: 4096
  }
);

// Generate instructions
const instructions = cursorConnector.generateCursorInstructions();
console.log(instructions);
")

if [[ $INSTRUCTIONS == *"Integrating with Cursor AI"* && $INSTRUCTIONS == *"$TEST_API_KEY"* ]]; then
  echo "✅ Cursor instructions generation test passed"
else
  echo "❌ Cursor instructions generation test failed"
  echo "Instructions: $INSTRUCTIONS"
  kill $SERVER_PID
  exit 1
fi

# Clean up
echo "Cleaning up..."
kill $SERVER_PID

echo "All Cursor connectivity tests passed!"
exit 0
