/**
 * Integration tests for Claude Desktop and Cursor connectors
 * 
 * This file contains tests for verifying the functionality of the
 * Claude Desktop and Cursor connectors for the Qlik Cloud MCP server.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as assert from 'assert';
import { Server } from '../src/server/server';
import { ModelContextManager } from '../src/model/model-context-manager';
import { AuthManager } from '../src/auth/auth-manager';
import { LogManager } from '../src/utils/log-manager';
import { ConfigManager } from '../src/config/config-manager';
import { QlikCloudModelContextIntegration } from '../src/api/qlik-cloud-integration';
import { ClaudeDesktopConnector } from '../src/integrations/claude-desktop-connector';
import { CursorConnector } from '../src/integrations/cursor-connector';

// Mock dependencies
const mockLogger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.log
};

const mockConfig = {
  get: (key: string, defaultValue?: any) => {
    const config: any = {
      'server.port': 3000,
      'server.host': 'localhost',
      'qlikCloud.baseUrl': 'https://test-tenant.us.qlikcloud.com',
      'qlikCloud.tenantId': 'test-tenant',
      'qlikCloud.authType': 'oauth2'
    };
    return config[key] || defaultValue;
  }
};

const mockAuthManager = {
  getProvider: () => ({
    getToken: async () => 'test-token'
  }),
  on: () => {}
};

const mockContextManager = {
  createContext: async () => ({
    id: 'test-context-id',
    name: 'Test Context',
    description: 'Test context for integration testing',
    getMetadata: () => ({
      id: 'test-context-id',
      name: 'Test Context',
      description: 'Test context for integration testing'
    }),
    saveState: async () => ({ id: 'test-state-id' }),
    restoreState: async () => true
  }),
  getContext: () => ({
    id: 'test-context-id',
    name: 'Test Context',
    description: 'Test context for integration testing',
    getMetadata: () => ({
      id: 'test-context-id',
      name: 'Test Context',
      description: 'Test context for integration testing'
    }),
    saveState: async () => ({ id: 'test-state-id' }),
    restoreState: async () => true
  }),
  listContexts: () => [
    {
      id: 'test-context-id',
      name: 'Test Context',
      description: 'Test context for integration testing'
    }
  ],
  deleteContext: async () => true,
  on: () => {}
};

const mockQlikCloudIntegration = {
  clients: {
    appClient: {
      getApps: async () => [
        {
          id: 'test-app-id',
          name: 'Test App',
          description: 'Test app for integration testing'
        }
      ],
      getApp: async () => ({
        id: 'test-app-id',
        name: 'Test App',
        description: 'Test app for integration testing'
      })
    }
  }
};

// Test configuration
const testConfig = {
  claudeDesktop: {
    serverName: 'qlik-cloud-mcp',
    port: 3000,
    qlikCloudBaseUrl: 'https://test-tenant.us.qlikcloud.com',
    qlikCloudTenantId: 'test-tenant',
    authType: 'oauth2'
  },
  cursor: {
    apiKey: 'test-api-key',
    anthropicBaseUrl: 'https://api.anthropic.com',
    anthropicApiVersion: '2023-06-01',
    defaultModel: 'claude-3-sonnet-20240229',
    maxTokens: 4096
  }
};

// Temporary file path for Claude Desktop config
const tempConfigPath = path.join(__dirname, 'temp_claude_desktop_config.json');

/**
 * Run the integration tests
 */
async function runTests() {
  console.log('Starting integration tests for Claude Desktop and Cursor connectors...');
  
  // Create a server instance
  const server = new Server(
    mockLogger as any,
    mockConfig as any,
    mockAuthManager as any
  );
  
  // Initialize the server
  await server.initialize();
  
  try {
    // Test Claude Desktop connector
    await testClaudeDesktopConnector(server);
    
    // Test Cursor connector
    await testCursorConnector(server);
    
    console.log('All integration tests passed!');
  } catch (error) {
    console.error('Integration tests failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await server.stop();
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }
}

/**
 * Test the Claude Desktop connector
 */
async function testClaudeDesktopConnector(server: Server) {
  console.log('Testing Claude Desktop connector...');
  
  // Create a Claude Desktop connector
  const claudeDesktopConnector = new ClaudeDesktopConnector(
    server,
    mockContextManager as any,
    mockAuthManager as any,
    mockLogger as any,
    mockConfig as any,
    mockQlikCloudIntegration as any,
    testConfig.claudeDesktop
  );
  
  // Test generating Claude Desktop config
  const config = claudeDesktopConnector.generateClaudeDesktopConfig();
  assert.strictEqual(typeof config, 'object', 'Config should be an object');
  assert.strictEqual(
    typeof config[testConfig.claudeDesktop.serverName],
    'object',
    'Config should contain server entry'
  );
  
  // Test updating Claude Desktop config
  const updateResult = claudeDesktopConnector.updateClaudeDesktopConfig(tempConfigPath);
  assert.strictEqual(updateResult, true, 'Config update should succeed');
  
  // Verify the config file was created
  assert.strictEqual(
    fs.existsSync(tempConfigPath),
    true,
    'Config file should exist'
  );
  
  // Read the config file and verify its contents
  const configContent = fs.readFileSync(tempConfigPath, 'utf8');
  const parsedConfig = JSON.parse(configContent);
  assert.strictEqual(
    typeof parsedConfig[testConfig.claudeDesktop.serverName],
    'object',
    'Config file should contain server entry'
  );
  
  // Test removing from Claude Desktop config
  const removeResult = claudeDesktopConnector.removeFromClaudeDesktopConfig(tempConfigPath);
  assert.strictEqual(removeResult, true, 'Config removal should succeed');
  
  // Read the config file again and verify the entry was removed
  const updatedConfigContent = fs.readFileSync(tempConfigPath, 'utf8');
  const updatedParsedConfig = JSON.parse(updatedConfigContent);
  assert.strictEqual(
    updatedParsedConfig[testConfig.claudeDesktop.serverName],
    undefined,
    'Server entry should be removed from config'
  );
  
  // Test MCP manifest endpoint
  const manifestResponse = await makeRequest(
    'GET',
    `http://localhost:${server.port}/mcp-manifest.json`
  );
  
  assert.strictEqual(manifestResponse.statusCode, 200, 'Manifest endpoint should return 200');
  
  const manifestBody = JSON.parse(manifestResponse.body);
  assert.strictEqual(
    manifestBody.name,
    testConfig.claudeDesktop.serverName,
    'Manifest should contain correct server name'
  );
  assert.strictEqual(
    Array.isArray(manifestBody.tools),
    true,
    'Manifest should contain tools array'
  );
  
  console.log('Claude Desktop connector tests passed!');
}

/**
 * Test the Cursor connector
 */
async function testCursorConnector(server: Server) {
  console.log('Testing Cursor connector...');
  
  // Create a Cursor connector
  const cursorConnector = new CursorConnector(
    server,
    mockContextManager as any,
    mockAuthManager as any,
    mockLogger as any,
    mockConfig as any,
    mockQlikCloudIntegration as any,
    testConfig.cursor
  );
  
  // Test Anthropic API URL
  const apiUrl = cursorConnector.getAnthropicApiUrl();
  assert.strictEqual(
    typeof apiUrl,
    'string',
    'API URL should be a string'
  );
  assert.strictEqual(
    apiUrl.includes('/anthropic'),
    true,
    'API URL should contain /anthropic'
  );
  
  // Test generating Cursor instructions
  const instructions = cursorConnector.generateCursorInstructions();
  assert.strictEqual(
    typeof instructions,
    'string',
    'Instructions should be a string'
  );
  assert.strictEqual(
    instructions.includes(apiUrl),
    true,
    'Instructions should contain API URL'
  );
  
  // Test models endpoint
  const modelsResponse = await makeRequest(
    'GET',
    `http://localhost:${server.port}/anthropic/v1/models`,
    {
      'x-api-key': testConfig.cursor.apiKey
    }
  );
  
  assert.strictEqual(modelsResponse.statusCode, 200, 'Models endpoint should return 200');
  
  const modelsBody = JSON.parse(modelsResponse.body);
  assert.strictEqual(
    Array.isArray(modelsBody.models),
    true,
    'Response should contain models array'
  );
  
  // Test messages endpoint
  const messagesResponse = await makeRequest(
    'POST',
    `http://localhost:${server.port}/anthropic/v1/messages`,
    {
      'x-api-key': testConfig.cursor.apiKey,
      'Content-Type': 'application/json'
    },
    JSON.stringify({
      model: testConfig.cursor.defaultModel,
      messages: [
        {
          role: 'user',
          content: 'Hello, world!'
        }
      ]
    })
  );
  
  assert.strictEqual(messagesResponse.statusCode, 200, 'Messages endpoint should return 200');
  
  const messagesBody = JSON.parse(messagesResponse.body);
  assert.strictEqual(
    messagesBody.role,
    'assistant',
    'Response should have assistant role'
  );
  
  // Test messages endpoint with Qlik tool
  const qlikToolResponse = await makeRequest(
    'POST',
    `http://localhost:${server.port}/anthropic/v1/messages`,
    {
      'x-api-key': testConfig.cursor.apiKey,
      'Content-Type': 'application/json'
    },
    JSON.stringify({
      model: testConfig.cursor.defaultModel,
      messages: [
        {
          role: 'user',
          content: 'List all Qlik apps'
        }
      ],
      tools: [
        {
          name: 'qlik_list_apps'
        }
      ]
    })
  );
  
  assert.strictEqual(qlikToolResponse.statusCode, 200, 'Qlik tool endpoint should return 200');
  
  const qlikToolBody = JSON.parse(qlikToolResponse.body);
  assert.strictEqual(
    Array.isArray(qlikToolBody.tool_results),
    true,
    'Response should contain tool_results array'
  );
  
  // Test completions endpoint
  const completionsResponse = await makeRequest(
    'POST',
    `http://localhost:${server.port}/anthropic/v1/complete`,
    {
      'x-api-key': testConfig.cursor.apiKey,
      'Content-Type': 'application/json'
    },
    JSON.stringify({
      model: testConfig.cursor.defaultModel,
      prompt: 'Human: Hello, world!\n\nAssistant:'
    })
  );
  
  assert.strictEqual(completionsResponse.statusCode, 200, 'Completions endpoint should return 200');
  
  const completionsBody = JSON.parse(completionsResponse.body);
  assert.strictEqual(
    typeof completionsBody.completion,
    'string',
    'Response should contain completion string'
  );
  
  // Test authentication failure
  const authFailureResponse = await makeRequest(
    'GET',
    `http://localhost:${server.port}/anthropic/v1/models`,
    {
      'x-api-key': 'invalid-api-key'
    }
  );
  
  assert.strictEqual(authFailureResponse.statusCode, 401, 'Invalid API key should return 401');
  
  console.log('Cursor connector tests passed!');
}

/**
 * Make an HTTP request
 */
function makeRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: string
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers
    };
    
    const req = http.request(url, options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          body: responseBody
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Run the tests
runTests().catch(console.error);
