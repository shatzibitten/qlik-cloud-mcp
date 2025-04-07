import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SystemEventHandler } from '../../src/events/system-event-handler';
import { WebhookEvent } from '../../src/events/types';
import { APIManager } from '../../src/api/api-manager';
import { ResourceClient } from '../../src/api/resource-client';

// Mock dependencies
jest.mock('../../src/api/api-manager');
jest.mock('../../src/api/resource-client');

const MockedAPIManager = APIManager as jest.MockedClass<typeof APIManager>;
const MockedResourceClient = ResourceClient as jest.MockedClass<typeof ResourceClient>;

describe('SystemEventHandler', () => {
  let systemEventHandler: SystemEventHandler;
  let mockAPIManager: jest.Mocked<APIManager>;
  let mockSystemClient: jest.Mocked<ResourceClient>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock API manager and resource client
    mockAPIManager = new MockedAPIManager({} as any) as jest.Mocked<APIManager>;
    mockSystemClient = new MockedResourceClient({} as any) as jest.Mocked<ResourceClient>;
    
    // Setup mock API manager to return mock system client
    mockAPIManager.createResourceClient.mockReturnValue(mockSystemClient);
    
    // Create system event handler
    systemEventHandler = new SystemEventHandler({
      apiManager: mockAPIManager
    });
  });

  describe('canHandle', () => {
    it('should return true for system events', () => {
      // Create system event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'system.maintenance.scheduled',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'System Maintenance',
        data: { 
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          description: 'Scheduled maintenance'
        }
      };
      
      // Check if handler can handle event
      const result = systemEventHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(true);
    });
    
    it('should return false for non-system events', () => {
      // Create non-system event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.reload.success',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Reload',
        data: { appId: 'test-app-id' }
      };
      
      // Check if handler can handle event
      const result = systemEventHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle system maintenance scheduled events', async () => {
      // Create system maintenance scheduled event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'system.maintenance.scheduled',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'System Maintenance',
        data: { 
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          description: 'Scheduled maintenance'
        }
      };
      
      // Handle event
      await systemEventHandler.handle(event);
      
      // Verify system client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/system',
        'oauth2'
      );
    });
    
    it('should handle system maintenance started events', async () => {
      // Create system maintenance started event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'system.maintenance.started',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'System Maintenance Started',
        data: { 
          maintenanceId: 'test-maintenance-id',
          expectedEndTime: new Date(Date.now() + 3600000).toISOString()
        }
      };
      
      // Handle event
      await systemEventHandler.handle(event);
      
      // Verify system client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/system',
        'oauth2'
      );
    });
    
    it('should handle system maintenance completed events', async () => {
      // Create system maintenance completed event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'system.maintenance.completed',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'System Maintenance Completed',
        data: { 
          maintenanceId: 'test-maintenance-id',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date().toISOString()
        }
      };
      
      // Handle event
      await systemEventHandler.handle(event);
      
      // Verify system client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/system',
        'oauth2'
      );
    });
    
    it('should handle system alert events', async () => {
      // Create system alert event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'system.alert',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'System Alert',
        data: { 
          alertId: 'test-alert-id',
          severity: 'high',
          message: 'High CPU usage detected'
        }
      };
      
      // Handle event
      await systemEventHandler.handle(event);
      
      // Verify system client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/system',
        'oauth2'
      );
    });
  });
});
