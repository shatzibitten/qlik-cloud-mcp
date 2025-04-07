#!/usr/bin/env node

/**
 * Test script for the Qlik Cloud MCP server
 * This script tests the basic functionality of the MCP server
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  server: {
    host: process.env.TEST_SERVER_HOST || 'localhost',
    port: process.env.TEST_SERVER_PORT || 3000,
  },
  auth: {
    clientId: process.env.TEST_CLIENT_ID,
    clientSecret: process.env.TEST_CLIENT_SECRET,
    tokenUrl: process.env.TEST_TOKEN_URL,
  },
  api: {
    baseUrl: process.env.TEST_API_BASE_URL,
  },
  webhook: {
    secret: process.env.TEST_WEBHOOK_SECRET || 'test-webhook-secret',
  },
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Test functions
async function runTests() {
  console.log('Starting Qlik Cloud MCP server tests...');
  
  // Test server health
  await test('Server Health Check', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/health',
    });
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected status code 200, got ${response.statusCode}`);
    }
    
    const data = JSON.parse(response.body);
    if (data.status !== 'ok') {
      throw new Error(`Expected status "ok", got "${data.status}"`);
    }
    
    return true;
  });
  
  // Test authentication - skip if no credentials
  if (config.auth.clientId && config.auth.clientSecret && config.auth.tokenUrl) {
    await test('OAuth2 Authentication', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: '/auth/token',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'oauth2',
          grantType: 'client_credentials',
        }),
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected status code 200, got ${response.statusCode}`);
      }
      
      const data = JSON.parse(response.body);
      if (!data.accessToken) {
        throw new Error('No access token returned');
      }
      
      // Store token for later tests
      config.auth.token = data.accessToken;
      
      return true;
    });
    
    // Test API proxy - skip if no token
    if (config.auth.token && config.api.baseUrl) {
      await test('API Proxy - Current User', async () => {
        const response = await httpRequest({
          method: 'GET',
          path: '/api/v1/users/me',
          headers: {
            'X-Auth-Type': 'oauth2',
          },
        });
        
        if (response.statusCode !== 200) {
          throw new Error(`Expected status code 200, got ${response.statusCode}`);
        }
        
        const data = JSON.parse(response.body);
        if (!data.id) {
          throw new Error('No user ID returned');
        }
        
        return true;
      });
    } else {
      console.log('Skipping API proxy tests (no token or API base URL)');
      results.skipped++;
    }
  } else {
    console.log('Skipping authentication tests (no credentials)');
    results.skipped++;
  }
  
  // Test webhook endpoint
  await test('Webhook Endpoint', async () => {
    const eventId = `test-${Date.now()}`;
    const eventBody = JSON.stringify({
      id: eventId,
      type: 'test.event',
      timestamp: new Date().toISOString(),
      source: 'test',
      subject: 'test',
      data: {},
    });
    
    // Calculate signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', config.webhook.secret);
    hmac.update(eventBody);
    const signature = hmac.digest('hex');
    
    const response = await httpRequest({
      method: 'POST',
      path: '/webhooks/qlik',
      headers: {
        'Content-Type': 'application/json',
        'X-Qlik-Signature': signature,
      },
      body: eventBody,
    });
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected status code 200, got ${response.statusCode}`);
    }
    
    return true;
  });
  
  // Print test summary
  console.log('\nTest Summary:');
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  
  if (results.failed > 0) {
    console.log('\nSome tests failed!');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
    process.exit(0);
  }
}

// Test helper function
async function test(name, fn) {
  results.total++;
  console.log(`\nTest: ${name}`);
  
  try {
    const result = await fn();
    if (result) {
      console.log(`✅ Passed: ${name}`);
      results.passed++;
    } else {
      console.log(`❌ Failed: ${name} (returned false)`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
  }
}

// HTTP request helper function
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: config.server.host,
      port: config.server.port,
      method: options.method || 'GET',
      path: options.path,
      headers: options.headers || {},
    };
    
    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Run the tests
runTests().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
