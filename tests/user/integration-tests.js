const { describe, it, beforeAll, afterAll } = require('jest');
const axios = require('axios');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Mock server for testing
const mockServer = {
  process: null,
  port: 3001,
  url: 'http://localhost:3001',
  start: function() {
    // Start the server in a separate process
    const serverPath = path.resolve(__dirname, '../../dist/server.js');
    this.process = execSync(`NODE_ENV=test TEST_PORT=${this.port} node ${serverPath} > server.log 2>&1 &`);
    
    // Wait for server to start
    return new Promise(resolve => setTimeout(resolve, 2000));
  },
  stop: function() {
    // Stop the server
    if (this.process) {
      execSync(`pkill -f "node ${path.resolve(__dirname, '../../dist/server.js')}"`);
      this.process = null;
    }
  }
};

describe('Qlik Cloud MCP Server Integration Tests', () => {
  beforeAll(async () => {
    // Start mock server
    await mockServer.start();
    
    // Create test environment file
    const envContent = `
TEST_SERVER_URL=${mockServer.url}
TEST_CLIENT_ID=test-client-id
TEST_CLIENT_SECRET=test-client-secret
TEST_TOKEN_URL=https://test-tenant.us.qlikcloud.com/oauth/token
TEST_API_BASE_URL=https://test-tenant.us.qlikcloud.com
TEST_WEBHOOK_SECRET=test-webhook-secret
    `;
    
    fs.writeFileSync(path.resolve(__dirname, '.env.test'), envContent);
  });
  
  afterAll(() => {
    // Stop mock server
    mockServer.stop();
    
    // Clean up test environment file
    const envFile = path.resolve(__dirname, '.env.test');
    if (fs.existsSync(envFile)) {
      fs.unlinkSync(envFile);
    }
  });
  
  it('should run user tests successfully', async () => {
    // Mock responses for user tests
    jest.spyOn(axios, 'post').mockImplementation((url, data, config) => {
      if (url.includes('/auth/token')) {
        return Promise.resolve({
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
            tokenType: 'Bearer'
          }
        });
      } else if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          data: {
            accessToken: 'mock-refreshed-token',
            refreshToken: 'mock-refreshed-refresh-token',
            expiresAt: Date.now() + 3600000,
            tokenType: 'Bearer'
          }
        });
      } else if (url.includes('/auth/revoke')) {
        return Promise.resolve({ status: 200 });
      } else if (url.includes('/webhooks/qlik')) {
        return Promise.resolve({ status: 200 });
      }
      
      return Promise.reject(new Error(`Unhandled POST request: ${url}`));
    });
    
    jest.spyOn(axios, 'get').mockImplementation((url, config) => {
      if (url.includes('/api/v1/users/me')) {
        return Promise.resolve({
          data: {
            id: 'mock-user-id',
            name: 'Mock User',
            email: 'mock@example.com'
          }
        });
      } else if (url.includes('/api/v1/apps') && !url.includes('/api/v1/apps/')) {
        return Promise.resolve({
          data: [
            {
              id: 'mock-app-id',
              name: 'Mock App',
              owner: 'mock-user-id'
            }
          ]
        });
      } else if (url.includes('/api/v1/apps/mock-app-id')) {
        return Promise.resolve({
          data: {
            id: 'mock-app-id',
            name: 'Mock App',
            owner: 'mock-user-id',
            description: 'A mock app for testing'
          }
        });
      }
      
      return Promise.reject(new Error(`Unhandled GET request: ${url}`));
    });
    
    // Run user tests
    const userTestsPath = path.resolve(__dirname, 'user-tests.js');
    const result = execSync(`node ${userTestsPath}`, { encoding: 'utf8' });
    
    // Verify test results
    expect(result).toContain('All tests passed!');
  });
});
