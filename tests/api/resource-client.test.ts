import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ResourceClient } from '../../src/api/resource-client';
import { APIClient } from '../../src/api/api-client';

// Mock APIClient
jest.mock('../../src/api/api-client');
const MockedAPIClient = APIClient as jest.MockedClass<typeof APIClient>;

describe('ResourceClient', () => {
  let resourceClient: ResourceClient;
  let mockApiClient: jest.Mocked<APIClient>;
  
  const resourcePath = '/v1/test-resources';
  const authType = 'oauth2';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock API client
    mockApiClient = new MockedAPIClient({} as any) as jest.Mocked<APIClient>;
    
    // Create resource client
    resourceClient = new ResourceClient({
      apiClient: mockApiClient,
      resourcePath,
      authType
    });
  });

  describe('list', () => {
    it('should list resources', async () => {
      // Mock response
      const mockResponse = {
        body: [
          { id: 'resource-1', name: 'Resource 1' },
          { id: 'resource-2', name: 'Resource 2' }
        ],
        status: 200,
        headers: { 'content-type': 'application/json' }
      };
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      // Call list
      const result = await resourceClient.list();

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: resourcePath,
        authType,
        query: undefined
      });

      // Verify result
      expect(result).toEqual(mockResponse.body);
    });

    it('should list resources with query parameters', async () => {
      // Mock response
      const mockResponse = {
        body: [
          { id: 'resource-1', name: 'Resource 1' }
        ],
        status: 200,
        headers: { 'content-type': 'application/json' }
      };
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      // Query parameters
      const query = { filter: 'name eq "Resource 1"', limit: 10 };

      // Call list with query
      const result = await resourceClient.list(query);

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: resourcePath,
        authType,
        query
      });

      // Verify result
      expect(result).toEqual(mockResponse.body);
    });
  });

  describe('get', () => {
    it('should get a resource by ID', async () => {
      // Mock response
      const mockResponse = {
        body: { id: 'resource-1', name: 'Resource 1' },
        status: 200,
        headers: { 'content-type': 'application/json' }
      };
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      // Call get
      const result = await resourceClient.get('resource-1');

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: `${resourcePath}/resource-1`,
        authType
      });

      // Verify result
      expect(result).toEqual(mockResponse.body);
    });

    it('should handle not found errors', async () => {
      // Mock error response
      mockApiClient.request.mockRejectedValueOnce(new Error('Resource not found'));

      // Call get and expect it to throw
      await expect(resourceClient.get('non-existent'))
        .rejects.toThrow('Resource not found');

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: `${resourcePath}/non-existent`,
        authType
      });
    });
  });

  describe('create', () => {
    it('should create a resource', async () => {
      // Mock response
      const mockResponse = {
        body: { id: 'new-resource', name: 'New Resource' },
        status: 201,
        headers: { 'content-type': 'application/json' }
      };
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      // Resource data
      const data = { name: 'New Resource', description: 'A new resource' };

      // Call create
      const result = await resourceClient.create(data);

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: resourcePath,
        body: data,
        authType
      });

      // Verify result
      expect(result).toEqual(mockResponse.body);
    });
  });

  describe('update', () => {
    it('should update a resource', async () => {
      // Mock response
      const mockResponse = {
        body: { id: 'resource-1', name: 'Updated Resource' },
        status: 200,
        headers: { 'content-type': 'application/json' }
      };
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      // Update data
      const data = { name: 'Updated Resource' };

      // Call update
      const result = await resourceClient.update('resource-1', data);

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: `${resourcePath}/resource-1`,
        body: data,
        authType
      });

      // Verify result
      expect(result).toEqual(mockResponse.body);
    });
  });

  describe('patch', () => {
    it('should patch a resource', async () => {
      // Mock response
      const mockResponse = {
        body: { id: 'resource-1', name: 'Resource 1', description: 'Updated description' },
        status: 200,
        headers: { 'content-type': 'application/json' }
      };
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      // Patch data
      const data = { description: 'Updated description' };

      // Call patch
      const result = await resourceClient.patch('resource-1', data);

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: `${resourcePath}/resource-1`,
        body: data,
        authType
      });

      // Verify result
      expect(result).toEqual(mockResponse.body);
    });
  });

  describe('delete', () => {
    it('should delete a resource', async () => {
      // Mock response
      const mockResponse = {
        body: {},
        status: 204,
        headers: { 'content-type': 'application/json' }
      };
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      // Call delete
      await resourceClient.delete('resource-1');

      // Verify API client was called correctly
      expect(mockApiClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: `${resourcePath}/resource-1`,
        authType
      });
    });
  });
});
