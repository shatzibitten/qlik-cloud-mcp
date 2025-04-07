import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AppEventHandler } from '../../src/events/app-event-handler';
import { WebhookEvent } from '../../src/events/types';
import { APIManager } from '../../src/api/api-manager';
import { ResourceClient } from '../../src/api/resource-client';

// Mock dependencies
jest.mock('../../src/api/api-manager');
jest.mock('../../src/api/resource-client');

const MockedAPIManager = APIManager as jest.MockedClass<typeof APIManager>;
const MockedResourceClient = ResourceClient as jest.MockedClass<typeof ResourceClient>;

describe('AppEventHandler', () => {
  let appEventHandler: AppEventHandler;
  let mockAPIManager: jest.Mocked<APIManager>;
  let mockAppsClient: jest.Mocked<ResourceClient>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock API manager and resource client
    mockAPIManager = new MockedAPIManager({} as any) as jest.Mocked<APIManager>;
    mockAppsClient = new MockedResourceClient({} as any) as jest.Mocked<ResourceClient>;
    
    // Setup mock API manager to return mock apps client
    mockAPIManager.createResourceClient.mockReturnValue(mockAppsClient);
    
    // Create app event handler
    appEventHandler = new AppEventHandler({
      apiManager: mockAPIManager
    });
  });

  describe('canHandle', () => {
    it('should return true for app events', () => {
      // Create app event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.reload.success',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Reload',
        data: { appId: 'test-app-id' }
      };
      
      // Check if handler can handle event
      const result = appEventHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(true);
    });
    
    it('should return false for non-app events', () => {
      // Create non-app event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'user.created',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'User Created',
        data: { userId: 'test-user-id' }
      };
      
      // Check if handler can handle event
      const result = appEventHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle app reload success events', async () => {
      // Mock app data
      const appData = {
        id: 'test-app-id',
        name: 'Test App',
        owner: 'test-user-id',
        lastReloadTime: new Date().toISOString()
      };
      
      // Setup mock apps client
      mockAppsClient.get.mockResolvedValueOnce(appData);
      
      // Create app reload success event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.reload.success',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Reload',
        data: { appId: 'test-app-id' }
      };
      
      // Handle event
      await appEventHandler.handle(event);
      
      // Verify apps client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/apps',
        'oauth2'
      );
      
      // Verify app data was retrieved
      expect(mockAppsClient.get).toHaveBeenCalledWith('test-app-id');
    });
    
    it('should handle app publish events', async () => {
      // Mock app data
      const appData = {
        id: 'test-app-id',
        name: 'Test App',
        owner: 'test-user-id',
        publishTime: new Date().toISOString()
      };
      
      // Setup mock apps client
      mockAppsClient.get.mockResolvedValueOnce(appData);
      
      // Create app publish event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.publish',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Publish',
        data: { 
          appId: 'test-app-id',
          spaceId: 'test-space-id'
        }
      };
      
      // Handle event
      await appEventHandler.handle(event);
      
      // Verify apps client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/apps',
        'oauth2'
      );
      
      // Verify app data was retrieved
      expect(mockAppsClient.get).toHaveBeenCalledWith('test-app-id');
    });
    
    it('should handle app delete events', async () => {
      // Create app delete event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.delete',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Delete',
        data: { appId: 'test-app-id' }
      };
      
      // Handle event
      await appEventHandler.handle(event);
      
      // Verify apps client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/apps',
        'oauth2'
      );
      
      // For delete events, we don't try to get the app since it's deleted
      expect(mockAppsClient.get).not.toHaveBeenCalled();
    });
    
    it('should handle app reload failure events', async () => {
      // Mock app data
      const appData = {
        id: 'test-app-id',
        name: 'Test App',
        owner: 'test-user-id'
      };
      
      // Setup mock apps client
      mockAppsClient.get.mockResolvedValueOnce(appData);
      
      // Create app reload failure event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.reload.failure',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Reload Failure',
        data: { 
          appId: 'test-app-id',
          error: 'Script error at line 5'
        }
      };
      
      // Handle event
      await appEventHandler.handle(event);
      
      // Verify apps client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/apps',
        'oauth2'
      );
      
      // Verify app data was retrieved
      expect(mockAppsClient.get).toHaveBeenCalledWith('test-app-id');
    });
  });
});
