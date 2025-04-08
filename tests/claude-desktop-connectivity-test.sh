#!/bin/bash

# Test script for Claude Desktop connectivity
# This script tests the Claude Desktop connector by simulating Claude Desktop's interaction with the MCP server

echo "Starting Claude Desktop connectivity test..."

# Set up test environment
TEST_PORT=3001
TEST_CONFIG_PATH="./claude_desktop_test_config.json"

# Start the MCP server
echo "Starting MCP server on port $TEST_PORT..."
node -e "
const { Server } = require('../src/server/server');
const { ModelContextManager } = require('../src/model/model-context-manager');
const { AuthManager } = require('../src/auth/auth-manager');
const { LogManager } = require('../src/utils/log-manager');
const { ConfigManager } = require('../src/config/config-manager');
const { QlikCloudModelContextIntegration } = require('../src/api/qlik-cloud-integration');
const { ClaudeDesktopConnector } = require('../src/integrations/claude-desktop-connector');

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
    })
  }),
  getContext: () => ({
    id: 'test-context-id',
    getMetadata: () => ({
      id: 'test-context-id',
      name: 'Test Context'
    })
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
  // Create Claude Desktop connector
  const claudeDesktopConnector = new ClaudeDesktopConnector(
    server,
    contextManager,
    authManager,
    logger,
    config,
    qlikCloudIntegration,
    {
      serverName: 'qlik-cloud-mcp-test',
      port: $TEST_PORT,
      qlikCloudBaseUrl: 'https://test-tenant.us.qlikcloud.com',
      qlikCloudTenantId: 'test-tenant',
      authType: 'oauth2'
    }
  );
  
  // Update test config
  claudeDesktopConnector.updateClaudeDesktopConfig('$TEST_CONFIG_PATH');
  
  console.log('MCP server started and Claude Desktop connector initialized');
  console.log('Server is running on http://localhost:$TEST_PORT');
  console.log('Press Ctrl+C to stop the server');
});
" &

# Store the server process ID
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Test MCP manifest endpoint
echo "Testing MCP manifest endpoint..."
MANIFEST_RESPONSE=$(curl -s http://localhost:$TEST_PORT/mcp-manifest.json)

if [[ $MANIFEST_RESPONSE == *"qlik-cloud-mcp-test"* ]]; then
  echo "✅ MCP manifest endpoint test passed"
else
  echo "❌ MCP manifest endpoint test failed"
  echo "Response: $MANIFEST_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:$TEST_PORT/health)

if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
  echo "✅ Health endpoint test passed"
else
  echo "❌ Health endpoint test failed"
  echo "Response: $HEALTH_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Simulate Claude Desktop tool calls
echo "Testing Claude Desktop tool calls..."

# Test qlik_list_apps tool
echo "Testing qlik_list_apps tool..."
LIST_APPS_RESPONSE=$(curl -s -X POST http://localhost:$TEST_PORT/api/tools/qlik_list_apps \
  -H "Content-Type: application/json" \
  -d '{}')

if [[ $LIST_APPS_RESPONSE == *"test-app-id"* ]]; then
  echo "✅ qlik_list_apps tool test passed"
else
  echo "❌ qlik_list_apps tool test failed"
  echo "Response: $LIST_APPS_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test qlik_get_app tool
echo "Testing qlik_get_app tool..."
GET_APP_RESPONSE=$(curl -s -X POST http://localhost:$TEST_PORT/api/tools/qlik_get_app \
  -H "Content-Type: application/json" \
  -d '{"appId": "test-app-id"}')

if [[ $GET_APP_RESPONSE == *"test-app-id"* ]]; then
  echo "✅ qlik_get_app tool test passed"
else
  echo "❌ qlik_get_app tool test failed"
  echo "Response: $GET_APP_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Test qlik_create_model_context tool
echo "Testing qlik_create_model_context tool..."
CREATE_CONTEXT_RESPONSE=$(curl -s -X POST http://localhost:$TEST_PORT/api/tools/qlik_create_model_context \
  -H "Content-Type: application/json" \
  -d '{"appId": "test-app-id", "name": "Test Context"}')

if [[ $CREATE_CONTEXT_RESPONSE == *"test-context-id"* ]]; then
  echo "✅ qlik_create_model_context tool test passed"
else
  echo "❌ qlik_create_model_context tool test failed"
  echo "Response: $CREATE_CONTEXT_RESPONSE"
  kill $SERVER_PID
  exit 1
fi

# Check if the config file was created
echo "Checking Claude Desktop config file..."
if [[ -f "$TEST_CONFIG_PATH" ]]; then
  echo "✅ Claude Desktop config file created successfully"
  cat "$TEST_CONFIG_PATH"
else
  echo "❌ Claude Desktop config file not created"
  kill $SERVER_PID
  exit 1
fi

# Clean up
echo "Cleaning up..."
kill $SERVER_PID
rm -f "$TEST_CONFIG_PATH"

echo "All Claude Desktop connectivity tests passed!"
exit 0
