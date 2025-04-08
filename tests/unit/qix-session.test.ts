import { QixSession } from '../../src/engine/qix-session';
import { WebSocketConnection } from '../../src/engine/websocket-connection';

// Mock dependencies
jest.mock('../../src/engine/websocket-connection');

describe('QixSession', () => {
  let qixSession;
  let mockWebSocketConnection;
  
  const sessionConfig = {
    engineUrl: 'wss://test-tenant.us.qlikcloud.com/app/test-app-id',
    appId: 'test-app-id',
    authToken: 'test-auth-token'
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockWebSocketConnection = new WebSocketConnection();
    
    // Setup mock implementations
    WebSocketConnection.mockImplementation(() => mockWebSocketConnection);
    
    // Mock methods
    mockWebSocketConnection.connect = jest.fn().mockResolvedValue(true);
    mockWebSocketConnection.disconnect = jest.fn().mockResolvedValue(true);
    mockWebSocketConnection.isConnected = jest.fn().mockReturnValue(false);
    mockWebSocketConnection.send = jest.fn().mockImplementation((message) => {
      // Simulate response based on message
      if (message.method === 'CreateSessionObject') {
        return Promise.resolve({ result: { qReturn: { qHandle: 'test-object-handle' } } });
      } else if (message.method === 'GetLayout') {
        return Promise.resolve({ result: { qLayout: { qInfo: { qId: 'test-object-id' } } } });
      } else {
        return Promise.resolve({ result: 'test-result' });
      }
    });
    
    // Create QixSession instance
    qixSession = new QixSession(sessionConfig);
  });
  
  describe('constructor', () => {
    it('should initialize with the provided configuration', () => {
      expect(qixSession.engineUrl).toBe(sessionConfig.engineUrl);
      expect(qixSession.appId).toBe(sessionConfig.appId);
      expect(qixSession.authToken).toBe(sessionConfig.authToken);
    });
    
    it('should create a WebSocketConnection instance', () => {
      expect(WebSocketConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          url: sessionConfig.engineUrl,
          authToken: sessionConfig.authToken
        })
      );
    });
  });
  
  describe('connect', () => {
    it('should connect to the Qlik Associative Engine', async () => {
      await qixSession.connect();
      expect(mockWebSocketConnection.connect).toHaveBeenCalled();
    });
    
    it('should not connect if already connected', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(true);
      await qixSession.connect();
      expect(mockWebSocketConnection.connect).not.toHaveBeenCalled();
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from the Qlik Associative Engine', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(true);
      await qixSession.disconnect();
      expect(mockWebSocketConnection.disconnect).toHaveBeenCalled();
    });
    
    it('should not disconnect if not connected', async () => {
      await qixSession.disconnect();
      expect(mockWebSocketConnection.disconnect).not.toHaveBeenCalled();
    });
  });
  
  describe('isConnected', () => {
    it('should return the connection status', () => {
      mockWebSocketConnection.isConnected.mockReturnValue(true);
      expect(qixSession.isConnected()).toBe(true);
      
      mockWebSocketConnection.isConnected.mockReturnValue(false);
      expect(qixSession.isConnected()).toBe(false);
    });
  });
  
  describe('createObject', () => {
    it('should create a new object', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(true);
      
      const properties = { qInfo: { qType: 'test-object' } };
      const result = await qixSession.createObject(properties);
      
      expect(mockWebSocketConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'CreateSessionObject',
          params: [properties]
        })
      );
      
      expect(result).toEqual({ handle: 'test-object-handle' });
    });
    
    it('should throw an error if not connected', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(false);
      
      await expect(
        qixSession.createObject({ qInfo: { qType: 'test-object' } })
      ).rejects.toThrow();
    });
  });
  
  describe('executeMethod', () => {
    it('should execute a method on an object', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(true);
      
      const handle = 'test-object-handle';
      const method = 'GetLayout';
      const params = [];
      
      const result = await qixSession.executeMethod(handle, method, params);
      
      expect(mockWebSocketConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          method,
          handle,
          params
        })
      );
      
      expect(result).toEqual({ result: { qLayout: { qInfo: { qId: 'test-object-id' } } } });
    });
    
    it('should throw an error if not connected', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(false);
      
      await expect(
        qixSession.executeMethod('test-object-handle', 'GetLayout')
      ).rejects.toThrow();
    });
  });
  
  describe('getGlobalHandle', () => {
    it('should return the global handle', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(true);
      
      // Mock the send method to return a global handle
      mockWebSocketConnection.send.mockResolvedValueOnce({
        result: { qReturn: { qHandle: 'global-handle' } }
      });
      
      const result = await qixSession.getGlobalHandle();
      
      expect(mockWebSocketConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'OpenDoc',
          params: [sessionConfig.appId]
        })
      );
      
      expect(result).toBe('global-handle');
    });
    
    it('should throw an error if not connected', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(false);
      
      await expect(qixSession.getGlobalHandle()).rejects.toThrow();
    });
  });
  
  describe('getAppHandle', () => {
    it('should return the app handle', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(true);
      
      // Mock the send method to return an app handle
      mockWebSocketConnection.send.mockResolvedValueOnce({
        result: { qReturn: { qHandle: 'app-handle' } }
      });
      
      const result = await qixSession.getAppHandle();
      
      expect(mockWebSocketConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'OpenDoc',
          params: [sessionConfig.appId]
        })
      );
      
      expect(result).toBe('app-handle');
    });
    
    it('should throw an error if not connected', async () => {
      mockWebSocketConnection.isConnected.mockReturnValue(false);
      
      await expect(qixSession.getAppHandle()).rejects.toThrow();
    });
  });
});
