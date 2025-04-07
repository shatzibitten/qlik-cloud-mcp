import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserEventHandler } from '../../src/events/user-event-handler';
import { WebhookEvent } from '../../src/events/types';
import { APIManager } from '../../src/api/api-manager';
import { ResourceClient } from '../../src/api/resource-client';

// Mock dependencies
jest.mock('../../src/api/api-manager');
jest.mock('../../src/api/resource-client');

const MockedAPIManager = APIManager as jest.MockedClass<typeof APIManager>;
const MockedResourceClient = ResourceClient as jest.MockedClass<typeof ResourceClient>;

describe('UserEventHandler', () => {
  let userEventHandler: UserEventHandler;
  let mockAPIManager: jest.Mocked<APIManager>;
  let mockUsersClient: jest.Mocked<ResourceClient>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock API manager and resource client
    mockAPIManager = new MockedAPIManager({} as any) as jest.Mocked<APIManager>;
    mockUsersClient = new MockedResourceClient({} as any) as jest.Mocked<ResourceClient>;
    
    // Setup mock API manager to return mock users client
    mockAPIManager.createResourceClient.mockReturnValue(mockUsersClient);
    
    // Create user event handler
    userEventHandler = new UserEventHandler({
      apiManager: mockAPIManager
    });
  });

  describe('canHandle', () => {
    it('should return true for user events', () => {
      // Create user event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'user.created',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'User Created',
        data: { userId: 'test-user-id' }
      };
      
      // Check if handler can handle event
      const result = userEventHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(true);
    });
    
    it('should return false for non-user events', () => {
      // Create non-user event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.reload.success',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Reload',
        data: { appId: 'test-app-id' }
      };
      
      // Check if handler can handle event
      const result = userEventHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle user created events', async () => {
      // Mock user data
      const userData = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };
      
      // Setup mock users client
      mockUsersClient.get.mockResolvedValueOnce(userData);
      
      // Create user created event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'user.created',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'User Created',
        data: { userId: 'test-user-id' }
      };
      
      // Handle event
      await userEventHandler.handle(event);
      
      // Verify users client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/users',
        'oauth2'
      );
      
      // Verify user data was retrieved
      expect(mockUsersClient.get).toHaveBeenCalledWith('test-user-id');
    });
    
    it('should handle user updated events', async () => {
      // Mock user data
      const userData = {
        id: 'test-user-id',
        name: 'Updated User',
        email: 'test@example.com',
        status: 'active'
      };
      
      // Setup mock users client
      mockUsersClient.get.mockResolvedValueOnce(userData);
      
      // Create user updated event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'user.updated',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'User Updated',
        data: { userId: 'test-user-id' }
      };
      
      // Handle event
      await userEventHandler.handle(event);
      
      // Verify users client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/users',
        'oauth2'
      );
      
      // Verify user data was retrieved
      expect(mockUsersClient.get).toHaveBeenCalledWith('test-user-id');
    });
    
    it('should handle user deleted events', async () => {
      // Create user deleted event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'user.deleted',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'User Deleted',
        data: { userId: 'test-user-id' }
      };
      
      // Handle event
      await userEventHandler.handle(event);
      
      // Verify users client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/users',
        'oauth2'
      );
      
      // For delete events, we don't try to get the user since it's deleted
      expect(mockUsersClient.get).not.toHaveBeenCalled();
    });
    
    it('should handle user login events', async () => {
      // Mock user data
      const userData = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };
      
      // Setup mock users client
      mockUsersClient.get.mockResolvedValueOnce(userData);
      
      // Create user login event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'user.login',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'User Login',
        data: { 
          userId: 'test-user-id',
          ipAddress: '192.168.1.1'
        }
      };
      
      // Handle event
      await userEventHandler.handle(event);
      
      // Verify users client was created correctly
      expect(mockAPIManager.createResourceClient).toHaveBeenCalledWith(
        '/v1/users',
        'oauth2'
      );
      
      // Verify user data was retrieved
      expect(mockUsersClient.get).toHaveBeenCalledWith('test-user-id');
    });
  });
});
