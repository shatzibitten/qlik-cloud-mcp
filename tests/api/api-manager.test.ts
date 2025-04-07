import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APIManager } from '../../src/api/api-manager';
import { APIClient } from '../../src/api/api-client';
import { ResourceClient } from '../../src/api/resource-client';
import { AuthManager } from '../../src/auth/auth-manager';

// Mock dependencies
jest.mock('../../src/api/api-client');
jest.mock('../../src/api/resource-client');
jest.mock('../../src/auth/auth-manager');

const MockedAPIClient = APIClient as jest.MockedClass<typeof APIClient>;
const MockedResourceClient = ResourceClient as jest.MockedClass<typeof ResourceClient>;
const MockedAuthManager = AuthManager as jest.MockedClass<typeof AuthManager>;

describe('APIManager', () => {
  let apiManager: APIManager;
  let mockAuthManager: jest.Mocked<AuthManager>;
  let mockAPIClient: jest.Mocked<APIClient>;
  
  const config = {
    baseUrl: 'https://test-tenant.us.qlikcloud.com',
    timeout: 30000,
    retry: {
      maxRetries: 3,
      backoffFactor: 2,
      initialDelay: 100
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock dependencies
    mockAuthManager = new MockedAuthManager({} as any) as jest.Mocked<AuthManager>;
    mockAPIClient = new MockedAPIClient({} as any) as jest.Mocked<APIClient>;
    
    // Mock APIClient constructor
    MockedAPIClient.mockImplementation(() => mockAPIClient);
    
    // Create API manager
    apiManager = new APIManager({
      config,
      authManager: mockAuthManager
    });
  });

  describe('constructor', () => {
    it('should create an API client with the provided config', () => {
      // Verify APIClient was constructed correctly
      expect(MockedAPIClient).toHaveBeenCalledWith(config);
    });
  });

  describe('createResourceClient', () => {
    it('should create a resource client with the correct parameters', () => {
      // Mock ResourceClient constructor
      const mockResourceClient = new MockedResourceClient({} as any) as jest.Mocked<ResourceClient>;
      MockedResourceClient.mockImplementation(() => mockResourceClient);
      
      // Call createResourceClient
      const resourcePath = '/v1/test-resources';
      const authType = 'oauth2';
      const result = apiManager.createResourceClient(resourcePath, authType);
      
      // Verify ResourceClient was constructed correctly
      expect(MockedResourceClient).toHaveBeenCalledWith({
        apiClient: mockAPIClient,
        resourcePath,
        authType
      });
      
      // Verify result
      expect(result).toBe(mockResourceClient);
    });
  });

  describe('getAPIClient', () => {
    it('should return the API client', () => {
      // Call getAPIClient
      const result = apiManager.getAPIClient();
      
      // Verify result
      expect(result).toBe(mockAPIClient);
    });
  });

  describe('request', () => {
    it('should make a request using the API client', async () => {
      // Mock response
      const mockResponse = {
        body: { id: 'test-id', name: 'Test Resource' },
        status: 200,
        headers: { 'content-type': 'application/json' }
      };
      mockAPIClient.request.mockResolvedValueOnce(mockResponse);
      
      // Request options
      const options = {
        method: 'GET',
        path: '/v1/resources/test-id',
        authType: 'oauth2'
      };
      
      // Call request
      const result = await apiManager.request(options);
      
      // Verify API client was called correctly
      expect(mockAPIClient.request).toHaveBeenCalledWith(options);
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
  });
});
