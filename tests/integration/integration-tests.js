const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
  token: process.env.TOKEN || '',
  outputDir: path.join(__dirname, '../../test-results/integration')
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Logger
const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
    fs.appendFileSync(path.join(config.outputDir, 'test.log'), `[INFO] ${message}\n`);
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
    fs.appendFileSync(path.join(config.outputDir, 'test.log'), `[ERROR] ${message} ${error}\n`);
  },
  success: (message) => {
    console.log(`[SUCCESS] ${message}`);
    fs.appendFileSync(path.join(config.outputDir, 'test.log'), `[SUCCESS] ${message}\n`);
  }
};

// API client
const api = {
  async request(method, endpoint, data = null) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token}`;
      }
      
      const response = await axios({
        method,
        url: `${config.serverUrl}${endpoint}`,
        headers,
        data
      });
      
      return response.data;
    } catch (error) {
      logger.error(`API request failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  },
  
  async getHealth() {
    return this.request('get', '/health');
  },
  
  async listContexts() {
    return this.request('get', '/api/v1/model/contexts');
  },
  
  async createContext(context) {
    return this.request('post', '/api/v1/model/contexts', context);
  },
  
  async getContext(contextId) {
    return this.request('get', `/api/v1/model/contexts/${contextId}`);
  },
  
  async deleteContext(contextId) {
    return this.request('delete', `/api/v1/model/contexts/${contextId}`);
  },
  
  async connectContext(contextId) {
    return this.request('post', `/api/v1/model/contexts/${contextId}/connect`);
  },
  
  async disconnectContext(contextId) {
    return this.request('post', `/api/v1/model/contexts/${contextId}/disconnect`);
  },
  
  async saveState(contextId, state) {
    return this.request('post', `/api/v1/model/contexts/${contextId}/state`, state);
  },
  
  async listStates(contextId) {
    return this.request('get', `/api/v1/model/contexts/${contextId}/state`);
  },
  
  async getState(contextId, stateId) {
    return this.request('get', `/api/v1/model/contexts/${contextId}/state/${stateId}`);
  },
  
  async restoreState(contextId, stateId) {
    return this.request('put', `/api/v1/model/contexts/${contextId}/state/${stateId}`);
  },
  
  async createObject(contextId, object) {
    return this.request('post', `/api/v1/model/contexts/${contextId}/objects`, object);
  },
  
  async listObjects(contextId) {
    return this.request('get', `/api/v1/model/contexts/${contextId}/objects`);
  },
  
  async getObject(contextId, objectHandle) {
    return this.request('get', `/api/v1/model/contexts/${contextId}/objects/${objectHandle}`);
  },
  
  async deleteObject(contextId, objectHandle) {
    return this.request('delete', `/api/v1/model/contexts/${contextId}/objects/${objectHandle}`);
  },
  
  async executeMethod(contextId, objectHandle, method, params = []) {
    return this.request('post', `/api/v1/model/contexts/${contextId}/objects/${objectHandle}/method`, {
      method,
      params
    });
  }
};

// WebSocket client
class WebSocketClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.messageHandlers = [];
    this.connected = false;
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.url}?token=${this.token}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        logger.info('WebSocket connected');
        this.connected = true;
        resolve();
      });
      
      this.ws.on('message', (data) => {
        const message = JSON.parse(data);
        logger.info(`WebSocket message received: ${JSON.stringify(message)}`);
        
        this.messageHandlers.forEach(handler => {
          if (handler.type === message.type) {
            handler.callback(message);
          }
        });
      });
      
      this.ws.on('error', (error) => {
        logger.error('WebSocket error', error);
        reject(error);
      });
      
      this.ws.on('close', () => {
        logger.info('WebSocket closed');
        this.connected = false;
      });
    });
  }
  
  send(message) {
    if (!this.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(JSON.stringify(message));
  }
  
  onMessage(type, callback) {
    this.messageHandlers.push({ type, callback });
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Test runner
async function runTests() {
  let contextId = null;
  let stateId = null;
  let objectHandle = null;
  
  try {
    // Test 1: Check server health
    logger.info('Test 1: Checking server health');
    const health = await api.getHealth();
    logger.success('Server health check passed');
    fs.writeFileSync(path.join(config.outputDir, 'health.json'), JSON.stringify(health, null, 2));
    
    // Skip remaining tests if no token is provided
    if (!config.token) {
      logger.info('Skipping remaining tests because no token is provided');
      return;
    }
    
    // Test 2: Create context
    logger.info('Test 2: Creating model context');
    const contextData = {
      name: 'Integration Test Context',
      description: 'Context created for integration testing',
      appId: 'test-app-id',
      engineUrl: 'wss://your-tenant.us.qlikcloud.com/app/test-app-id'
    };
    
    const createContextResponse = await api.createContext(contextData);
    contextId = createContextResponse.data.id;
    logger.success(`Context created with ID: ${contextId}`);
    fs.writeFileSync(path.join(config.outputDir, 'create-context.json'), JSON.stringify(createContextResponse, null, 2));
    
    // Test 3: Get context
    logger.info('Test 3: Getting model context');
    const getContextResponse = await api.getContext(contextId);
    logger.success('Context retrieved successfully');
    fs.writeFileSync(path.join(config.outputDir, 'get-context.json'), JSON.stringify(getContextResponse, null, 2));
    
    // Test 4: Connect to engine
    logger.info('Test 4: Connecting to engine');
    const connectResponse = await api.connectContext(contextId);
    logger.success('Connected to engine successfully');
    fs.writeFileSync(path.join(config.outputDir, 'connect.json'), JSON.stringify(connectResponse, null, 2));
    
    // Test 5: Save state
    logger.info('Test 5: Saving state');
    const stateData = {
      name: 'Integration Test State',
      description: 'State created for integration testing'
    };
    
    const saveStateResponse = await api.saveState(contextId, stateData);
    stateId = saveStateResponse.data.id;
    logger.success(`State saved with ID: ${stateId}`);
    fs.writeFileSync(path.join(config.outputDir, 'save-state.json'), JSON.stringify(saveStateResponse, null, 2));
    
    // Test 6: List states
    logger.info('Test 6: Listing states');
    const listStatesResponse = await api.listStates(contextId);
    logger.success(`Found ${listStatesResponse.data.states.length} states`);
    fs.writeFileSync(path.join(config.outputDir, 'list-states.json'), JSON.stringify(listStatesResponse, null, 2));
    
    // Test 7: Get state
    logger.info('Test 7: Getting state');
    const getStateResponse = await api.getState(contextId, stateId);
    logger.success('State retrieved successfully');
    fs.writeFileSync(path.join(config.outputDir, 'get-state.json'), JSON.stringify(getStateResponse, null, 2));
    
    // Test 8: Create object
    logger.info('Test 8: Creating object');
    const objectData = {
      objectType: 'GenericObject',
      properties: {
        qInfo: {
          qType: 'test-object'
        },
        testProperty: 'test-value'
      }
    };
    
    const createObjectResponse = await api.createObject(contextId, objectData);
    objectHandle = createObjectResponse.data.handle;
    logger.success(`Object created with handle: ${objectHandle}`);
    fs.writeFileSync(path.join(config.outputDir, 'create-object.json'), JSON.stringify(createObjectResponse, null, 2));
    
    // Test 9: List objects
    logger.info('Test 9: Listing objects');
    const listObjectsResponse = await api.listObjects(contextId);
    logger.success(`Found ${listObjectsResponse.data.objects.length} objects`);
    fs.writeFileSync(path.join(config.outputDir, 'list-objects.json'), JSON.stringify(listObjectsResponse, null, 2));
    
    // Test 10: Get object
    logger.info('Test 10: Getting object');
    const getObjectResponse = await api.getObject(contextId, objectHandle);
    logger.success('Object retrieved successfully');
    fs.writeFileSync(path.join(config.outputDir, 'get-object.json'), JSON.stringify(getObjectResponse, null, 2));
    
    // Test 11: Execute method
    logger.info('Test 11: Executing method');
    const executeMethodResponse = await api.executeMethod(contextId, objectHandle, 'getProperties');
    logger.success('Method executed successfully');
    fs.writeFileSync(path.join(config.outputDir, 'execute-method.json'), JSON.stringify(executeMethodResponse, null, 2));
    
    // Test 12: Restore state
    logger.info('Test 12: Restoring state');
    const restoreStateResponse = await api.restoreState(contextId, stateId);
    logger.success('State restored successfully');
    fs.writeFileSync(path.join(config.outputDir, 'restore-state.json'), JSON.stringify(restoreStateResponse, null, 2));
    
    // Test 13: WebSocket communication
    logger.info('Test 13: Testing WebSocket communication');
    const wsUrl = `ws://${config.serverUrl.replace(/^https?:\/\//, '')}/api/v1/model/ws`;
    const wsClient = new WebSocketClient(wsUrl, config.token);
    
    await wsClient.connect();
    
    // Subscribe to context events
    wsClient.send({
      type: 'subscribe',
      contextId
    });
    
    // Wait for subscription confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create object via WebSocket
    const wsObjectData = {
      type: 'create-object',
      contextId,
      objectType: 'GenericObject',
      properties: {
        qInfo: {
          qType: 'ws-test-object'
        },
        testProperty: 'ws-test-value'
      }
    };
    
    let wsObjectHandle = null;
    
    wsClient.onMessage('object-created', (message) => {
      wsObjectHandle = message.objectHandle;
      logger.success(`Object created via WebSocket with handle: ${wsObjectHandle}`);
      fs.writeFileSync(path.join(config.outputDir, 'ws-object-created.json'), JSON.stringify(message, null, 2));
    });
    
    wsClient.send(wsObjectData);
    
    // Wait for object creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Close WebSocket
    wsClient.close();
    logger.success('WebSocket communication test completed');
    
    // Test 14: Disconnect from engine
    logger.info('Test 14: Disconnecting from engine');
    const disconnectResponse = await api.disconnectContext(contextId);
    logger.success('Disconnected from engine successfully');
    fs.writeFileSync(path.join(config.outputDir, 'disconnect.json'), JSON.stringify(disconnectResponse, null, 2));
    
    // Test 15: Delete context
    logger.info('Test 15: Deleting context');
    const deleteContextResponse = await api.deleteContext(contextId);
    logger.success('Context deleted successfully');
    fs.writeFileSync(path.join(config.outputDir, 'delete-context.json'), JSON.stringify(deleteContextResponse, null, 2));
    
    logger.success('All integration tests passed!');
  } catch (error) {
    logger.error('Test failed', error);
    
    // Cleanup if error occurs
    try {
      if (contextId) {
        await api.deleteContext(contextId);
        logger.info('Cleaned up context after error');
      }
    } catch (cleanupError) {
      logger.error('Failed to clean up after error', cleanupError);
    }
    
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logger.error('Unhandled error', error);
  process.exit(1);
});
