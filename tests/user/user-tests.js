import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  baseUrl: process.env.TEST_SERVER_URL || 'http://localhost:3000',
  auth: {
    oauth2: {
      clientId: process.env.TEST_CLIENT_ID,
      clientSecret: process.env.TEST_CLIENT_SECRET,
      tokenUrl: process.env.TEST_TOKEN_URL
    }
  },
  webhook: {
    secret: process.env.TEST_WEBHOOK_SECRET || 'test-webhook-secret'
  }
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Test scenarios
const scenarios = [
  {
    name: 'Authentication Flow',
    tests: [
      { name: 'Get OAuth2 token', fn: testGetOAuth2Token },
      { name: 'Refresh OAuth2 token', fn: testRefreshOAuth2Token },
      { name: 'Revoke OAuth2 token', fn: testRevokeOAuth2Token }
    ]
  },
  {
    name: 'API Proxy Flow',
    tests: [
      { name: 'Get current user', fn: testGetCurrentUser },
      { name: 'List apps', fn: testListApps },
      { name: 'Get app details', fn: testGetAppDetails }
    ]
  },
  {
    name: 'Webhook Flow',
    tests: [
      { name: 'Send app reload event', fn: testSendAppReloadEvent },
      { name: 'Send user login event', fn: testSendUserLoginEvent },
      { name: 'Send system alert event', fn: testSendSystemAlertEvent }
    ]
  }
];

// Test state
const state = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  appId: null
};

// Main function
async function runTests() {
  console.log('Starting Qlik Cloud MCP User Tests');
  console.log('==================================');
  console.log(`Server URL: ${config.baseUrl}`);
  console.log('');

  // Run all scenarios
  for (const scenario of scenarios) {
    console.log(`Scenario: ${scenario.name}`);
    console.log('-'.repeat(scenario.name.length + 10));

    for (const test of scenario.tests) {
      await runTest(test.name, test.fn);
    }

    console.log('');
  }

  // Print summary
  console.log('Test Summary');
  console.log('===========');
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log('');

  if (results.failed > 0) {
    console.log('❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Test runner
async function runTest(name, testFn) {
  results.total++;
  
  try {
    console.log(`Running test: ${name}`);
    const result = await testFn();
    
    if (result === 'skip') {
      console.log(`⚠️ Skipped: ${name}`);
      results.skipped++;
    } else {
      console.log(`✅ Passed: ${name}`);
      results.passed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${name}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    results.failed++;
  }
}

// Authentication tests
async function testGetOAuth2Token() {
  // Skip if no credentials
  if (!config.auth.oauth2.clientId || !config.auth.oauth2.clientSecret) {
    return 'skip';
  }

  const response = await axios.post(`${config.baseUrl}/auth/token`, {
    type: 'oauth2',
    grantType: 'client_credentials'
  });

  // Validate response
  if (!response.data.accessToken) {
    throw new Error('No access token in response');
  }

  // Save tokens for later tests
  state.accessToken = response.data.accessToken;
  state.refreshToken = response.data.refreshToken;

  return true;
}

async function testRefreshOAuth2Token() {
  // Skip if no refresh token
  if (!state.refreshToken) {
    return 'skip';
  }

  // Wait a bit to ensure the token is different
  await new Promise(resolve => setTimeout(resolve, 1000));

  const response = await axios.post(`${config.baseUrl}/auth/refresh`, {
    type: 'oauth2',
    refreshToken: state.refreshToken
  });

  // Validate response
  if (!response.data.accessToken) {
    throw new Error('No access token in response');
  }

  // Verify token is different
  if (response.data.accessToken === state.accessToken) {
    throw new Error('Refreshed token is the same as the original token');
  }

  // Update tokens
  state.accessToken = response.data.accessToken;
  state.refreshToken = response.data.refreshToken;

  return true;
}

async function testRevokeOAuth2Token() {
  // Skip if no access token
  if (!state.accessToken) {
    return 'skip';
  }

  const response = await axios.post(`${config.baseUrl}/auth/revoke`, {
    type: 'oauth2'
  }, {
    headers: {
      'Authorization': `Bearer ${state.accessToken}`
    }
  });

  // Validate response
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  // Clear tokens
  state.accessToken = null;
  state.refreshToken = null;

  return true;
}

// API proxy tests
async function testGetCurrentUser() {
  // Get a new token if needed
  if (!state.accessToken) {
    await testGetOAuth2Token();
    if (!state.accessToken) {
      return 'skip';
    }
  }

  const response = await axios.get(`${config.baseUrl}/api/v1/users/me`, {
    headers: {
      'Authorization': `Bearer ${state.accessToken}`
    }
  });

  // Validate response
  if (!response.data.id) {
    throw new Error('No user ID in response');
  }

  // Save user ID for later tests
  state.userId = response.data.id;

  return true;
}

async function testListApps() {
  // Get a new token if needed
  if (!state.accessToken) {
    await testGetOAuth2Token();
    if (!state.accessToken) {
      return 'skip';
    }
  }

  const response = await axios.get(`${config.baseUrl}/api/v1/apps`, {
    headers: {
      'Authorization': `Bearer ${state.accessToken}`
    },
    params: {
      limit: 10
    }
  });

  // Validate response
  if (!Array.isArray(response.data)) {
    throw new Error('Response is not an array');
  }

  // Save first app ID for later tests if available
  if (response.data.length > 0) {
    state.appId = response.data[0].id;
  }

  return true;
}

async function testGetAppDetails() {
  // Skip if no app ID
  if (!state.appId) {
    return 'skip';
  }

  // Get a new token if needed
  if (!state.accessToken) {
    await testGetOAuth2Token();
    if (!state.accessToken) {
      return 'skip';
    }
  }

  const response = await axios.get(`${config.baseUrl}/api/v1/apps/${state.appId}`, {
    headers: {
      'Authorization': `Bearer ${state.accessToken}`
    }
  });

  // Validate response
  if (response.data.id !== state.appId) {
    throw new Error(`Expected app ID ${state.appId}, got ${response.data.id}`);
  }

  return true;
}

// Webhook tests
async function testSendAppReloadEvent() {
  // Skip if no webhook secret
  if (!config.webhook.secret) {
    return 'skip';
  }

  // Create event payload
  const event = {
    id: `test-${Date.now()}`,
    type: 'app.reload.success',
    timestamp: new Date().toISOString(),
    source: 'test',
    subject: 'App Reload',
    data: {
      appId: state.appId || 'test-app-id'
    }
  };

  const payload = JSON.stringify(event);

  // Calculate signature
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', config.webhook.secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  // Send webhook event
  const response = await axios.post(`${config.baseUrl}/webhooks/qlik`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Qlik-Signature': signature
    }
  });

  // Validate response
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  return true;
}

async function testSendUserLoginEvent() {
  // Skip if no webhook secret
  if (!config.webhook.secret) {
    return 'skip';
  }

  // Create event payload
  const event = {
    id: `test-${Date.now()}`,
    type: 'user.login',
    timestamp: new Date().toISOString(),
    source: 'test',
    subject: 'User Login',
    data: {
      userId: state.userId || 'test-user-id',
      ipAddress: '192.168.1.1'
    }
  };

  const payload = JSON.stringify(event);

  // Calculate signature
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', config.webhook.secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  // Send webhook event
  const response = await axios.post(`${config.baseUrl}/webhooks/qlik`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Qlik-Signature': signature
    }
  });

  // Validate response
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  return true;
}

async function testSendSystemAlertEvent() {
  // Skip if no webhook secret
  if (!config.webhook.secret) {
    return 'skip';
  }

  // Create event payload
  const event = {
    id: `test-${Date.now()}`,
    type: 'system.alert',
    timestamp: new Date().toISOString(),
    source: 'test',
    subject: 'System Alert',
    data: {
      alertId: `alert-${Date.now()}`,
      severity: 'high',
      message: 'Test system alert'
    }
  };

  const payload = JSON.stringify(event);

  // Calculate signature
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', config.webhook.secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  // Send webhook event
  const response = await axios.post(`${config.baseUrl}/webhooks/qlik`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Qlik-Signature': signature
    }
  });

  // Validate response
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  return true;
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
