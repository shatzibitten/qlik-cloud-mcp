import { ModelContext } from '../../src/model/model-context';
import { ModelState } from '../../src/model/model-state';
import { ObjectRegistry } from '../../src/model/object-registry';
import { QixSession } from '../../src/engine/qix-session';

// Mock dependencies
jest.mock('../../src/model/model-state');
jest.mock('../../src/model/object-registry');
jest.mock('../../src/engine/qix-session');

describe('ModelContext', () => {
  let modelContext;
  let mockModelState;
  let mockObjectRegistry;
  let mockQixSession;
  
  const contextConfig = {
    id: 'test-context-id',
    name: 'Test Context',
    description: 'Test context for unit testing',
    appId: 'test-app-id',
    engineUrl: 'wss://test-tenant.us.qlikcloud.com/app/test-app-id',
    authType: 'oauth2'
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockModelState = new ModelState();
    mockObjectRegistry = new ObjectRegistry();
    mockQixSession = new QixSession();
    
    // Setup mock implementations
    ModelState.mockImplementation(() => mockModelState);
    ObjectRegistry.mockImplementation(() => mockObjectRegistry);
    QixSession.mockImplementation(() => mockQixSession);
    
    // Mock methods
    mockModelState.saveState = jest.fn().mockResolvedValue({ id: 'test-state-id' });
    mockModelState.restoreState = jest.fn().mockResolvedValue(true);
    mockModelState.listStates = jest.fn().mockResolvedValue([{ id: 'test-state-id' }]);
    
    mockObjectRegistry.registerObject = jest.fn().mockReturnValue('test-object-handle');
    mockObjectRegistry.getObject = jest.fn().mockReturnValue({ handle: 'test-object-handle', type: 'GenericObject' });
    mockObjectRegistry.listObjects = jest.fn().mockReturnValue([{ handle: 'test-object-handle', type: 'GenericObject' }]);
    mockObjectRegistry.unregisterObject = jest.fn().mockReturnValue(true);
    
    mockQixSession.connect = jest.fn().mockResolvedValue(true);
    mockQixSession.disconnect = jest.fn().mockResolvedValue(true);
    mockQixSession.isConnected = jest.fn().mockReturnValue(false);
    mockQixSession.createObject = jest.fn().mockResolvedValue({ handle: 'test-object-handle' });
    mockQixSession.executeMethod = jest.fn().mockResolvedValue({ result: 'test-result' });
    
    // Create ModelContext instance
    modelContext = new ModelContext(contextConfig);
  });
  
  describe('constructor', () => {
    it('should initialize with the provided configuration', () => {
      expect(modelContext.id).toBe(contextConfig.id);
      expect(modelContext.name).toBe(contextConfig.name);
      expect(modelContext.description).toBe(contextConfig.description);
      expect(modelContext.appId).toBe(contextConfig.appId);
      expect(modelContext.engineUrl).toBe(contextConfig.engineUrl);
      expect(modelContext.authType).toBe(contextConfig.authType);
    });
    
    it('should create ModelState, ObjectRegistry, and QixSession instances', () => {
      expect(ModelState).toHaveBeenCalled();
      expect(ObjectRegistry).toHaveBeenCalled();
      expect(QixSession).toHaveBeenCalled();
    });
  });
  
  describe('connect', () => {
    it('should connect to the Qlik Associative Engine', async () => {
      await modelContext.connect();
      expect(mockQixSession.connect).toHaveBeenCalled();
    });
    
    it('should not connect if already connected', async () => {
      mockQixSession.isConnected.mockReturnValue(true);
      await modelContext.connect();
      expect(mockQixSession.connect).not.toHaveBeenCalled();
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from the Qlik Associative Engine', async () => {
      mockQixSession.isConnected.mockReturnValue(true);
      await modelContext.disconnect();
      expect(mockQixSession.disconnect).toHaveBeenCalled();
    });
    
    it('should not disconnect if not connected', async () => {
      await modelContext.disconnect();
      expect(mockQixSession.disconnect).not.toHaveBeenCalled();
    });
  });
  
  describe('isConnected', () => {
    it('should return the connection status', () => {
      mockQixSession.isConnected.mockReturnValue(true);
      expect(modelContext.isConnected()).toBe(true);
      
      mockQixSession.isConnected.mockReturnValue(false);
      expect(modelContext.isConnected()).toBe(false);
    });
  });
  
  describe('saveState', () => {
    it('should save the current state', async () => {
      const stateName = 'Test State';
      const stateDescription = 'Test state description';
      
      await modelContext.saveState(stateName, stateDescription);
      expect(mockModelState.saveState).toHaveBeenCalledWith(
        expect.objectContaining({
          name: stateName,
          description: stateDescription
        })
      );
    });
    
    it('should throw an error if not connected', async () => {
      mockQixSession.isConnected.mockReturnValue(false);
      await expect(modelContext.saveState('Test State')).rejects.toThrow();
    });
  });
  
  describe('restoreState', () => {
    it('should restore a saved state', async () => {
      mockQixSession.isConnected.mockReturnValue(true);
      await modelContext.restoreState('test-state-id');
      expect(mockModelState.restoreState).toHaveBeenCalledWith('test-state-id');
    });
    
    it('should throw an error if not connected', async () => {
      mockQixSession.isConnected.mockReturnValue(false);
      await expect(modelContext.restoreState('test-state-id')).rejects.toThrow();
    });
  });
  
  describe('listStates', () => {
    it('should list all saved states', async () => {
      await modelContext.listStates();
      expect(mockModelState.listStates).toHaveBeenCalled();
    });
  });
  
  describe('createObject', () => {
    it('should create a new object', async () => {
      mockQixSession.isConnected.mockReturnValue(true);
      
      const objectType = 'GenericObject';
      const properties = { qInfo: { qType: 'test-object' } };
      
      await modelContext.createObject(objectType, properties);
      
      expect(mockQixSession.createObject).toHaveBeenCalledWith(properties);
      expect(mockObjectRegistry.registerObject).toHaveBeenCalled();
    });
    
    it('should throw an error if not connected', async () => {
      mockQixSession.isConnected.mockReturnValue(false);
      
      await expect(
        modelContext.createObject('GenericObject', { qInfo: { qType: 'test-object' } })
      ).rejects.toThrow();
    });
  });
  
  describe('getObject', () => {
    it('should get an object by handle', () => {
      const result = modelContext.getObject('test-object-handle');
      expect(mockObjectRegistry.getObject).toHaveBeenCalledWith('test-object-handle');
      expect(result).toEqual({ handle: 'test-object-handle', type: 'GenericObject' });
    });
  });
  
  describe('listObjects', () => {
    it('should list all objects', () => {
      const result = modelContext.listObjects();
      expect(mockObjectRegistry.listObjects).toHaveBeenCalled();
      expect(result).toEqual([{ handle: 'test-object-handle', type: 'GenericObject' }]);
    });
  });
  
  describe('deleteObject', () => {
    it('should delete an object', async () => {
      mockQixSession.isConnected.mockReturnValue(true);
      
      await modelContext.deleteObject('test-object-handle');
      
      expect(mockObjectRegistry.unregisterObject).toHaveBeenCalledWith('test-object-handle');
    });
    
    it('should throw an error if not connected', async () => {
      mockQixSession.isConnected.mockReturnValue(false);
      
      await expect(modelContext.deleteObject('test-object-handle')).rejects.toThrow();
    });
  });
  
  describe('executeMethod', () => {
    it('should execute a method on an object', async () => {
      mockQixSession.isConnected.mockReturnValue(true);
      
      const method = 'getLayout';
      const params = [];
      
      await modelContext.executeMethod('test-object-handle', method, params);
      
      expect(mockQixSession.executeMethod).toHaveBeenCalledWith('test-object-handle', method, params);
    });
    
    it('should throw an error if not connected', async () => {
      mockQixSession.isConnected.mockReturnValue(false);
      
      await expect(modelContext.executeMethod('test-object-handle', 'getLayout')).rejects.toThrow();
    });
  });
  
  describe('getMetadata', () => {
    it('should return metadata for the context', () => {
      const metadata = modelContext.getMetadata();
      expect(metadata).toEqual(expect.objectContaining({
        id: contextConfig.id,
        name: contextConfig.name,
        description: contextConfig.description,
        appId: contextConfig.appId
      }));
    });
  });
  
  describe('setMetadata', () => {
    it('should update metadata for the context', () => {
      const newMetadata = { customField: 'custom-value' };
      modelContext.setMetadata('custom', newMetadata);
      
      const metadata = modelContext.getMetadata();
      expect(metadata.custom).toEqual(newMetadata);
    });
  });
});
