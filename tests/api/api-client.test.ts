import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APIClient } from '../../src/api/api-client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('APIClient', () => {
  let apiClient: APIClient;
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
    apiClient = new APIClient(config);
    jest.clearAllMocks();
  });

  describe('request', () => {
    it('should make a successful request', async () => {
      // Mock successful response
      const mockResponse = {
        data: { id: 'test-id', name: 'Test Resource' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      };
      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      // Make request
      const response = await apiClient.request({
        method: 'GET',
        path: '/v1/resources/test-id',
        authType: 'oauth2'
      });

      // Verify axios was called correctly
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://test-tenant.us.qlikcloud.com/v1/resources/test-id',
        headers: {
          'Authorization': 'Bearer undefined', // No token in test
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        data: undefined
      });

      // Verify response structure
      expect(response).toEqual({
        body: { id: 'test-id', name: 'Test Resource' },
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should include query parameters in the request', async () => {
      // Mock successful response
      const mockResponse = {
        data: [{ id: 'test-id', name: 'Test Resource' }],
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      };
      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      // Make request with query parameters
      const response = await apiClient.request({
        method: 'GET',
        path: '/v1/resources',
        query: { limit: 10, filter: 'name eq "Test"' },
        authType: 'oauth2'
      });

      // Verify axios was called correctly with query parameters
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://test-tenant.us.qlikcloud.com/v1/resources',
        headers: {
          'Authorization': 'Bearer undefined', // No token in test
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        params: { limit: 10, filter: 'name eq "Test"' },
        data: undefined
      });

      // Verify response structure
      expect(response).toEqual({
        body: [{ id: 'test-id', name: 'Test Resource' }],
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should include request body in the request', async () => {
      // Mock successful response
      const mockResponse = {
        data: { id: 'new-id', name: 'New Resource' },
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' }
      };
      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      // Request body
      const body = { name: 'New Resource', description: 'A new resource' };

      // Make request with body
      const response = await apiClient.request({
        method: 'POST',
        path: '/v1/resources',
        body,
        authType: 'oauth2'
      });

      // Verify axios was called correctly with body
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://test-tenant.us.qlikcloud.com/v1/resources',
        headers: {
          'Authorization': 'Bearer undefined', // No token in test
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        data: body
      });

      // Verify response structure
      expect(response).toEqual({
        body: { id: 'new-id', name: 'New Resource' },
        status: 201,
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should handle request errors', async () => {
      // Mock error response
      const errorResponse = {
        response: {
          data: { error: 'Not Found', message: 'Resource not found' },
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' }
        }
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      // Make request and expect it to throw
      await expect(apiClient.request({
        method: 'GET',
        path: '/v1/resources/non-existent',
        authType: 'oauth2'
      })).rejects.toThrow('Resource not found');
    });

    it('should retry on network errors', async () => {
      // Mock network error for first attempt
      const networkError = new Error('Network Error');
      mockedAxios.request.mockRejectedValueOnce(networkError);

      // Mock successful response for second attempt
      const mockResponse = {
        data: { id: 'test-id', name: 'Test Resource' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      };
      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      // Make request
      const response = await apiClient.request({
        method: 'GET',
        path: '/v1/resources/test-id',
        authType: 'oauth2'
      });

      // Verify axios was called twice
      expect(mockedAxios.request).toHaveBeenCalledTimes(2);

      // Verify response structure
      expect(response).toEqual({
        body: { id: 'test-id', name: 'Test Resource' },
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should retry on 429 (rate limit) errors', async () => {
      // Mock rate limit error for first attempt
      const rateLimitError = {
        response: {
          data: { error: 'Too Many Requests', message: 'Rate limit exceeded' },
          status: 429,
          statusText: 'Too Many Requests',
          headers: { 'content-type': 'application/json', 'retry-after': '1' }
        }
      };
      mockedAxios.request.mockRejectedValueOnce(rateLimitError);

      // Mock successful response for second attempt
      const mockResponse = {
        data: { id: 'test-id', name: 'Test Resource' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      };
      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      // Make request
      const response = await apiClient.request({
        method: 'GET',
        path: '/v1/resources/test-id',
        authType: 'oauth2'
      });

      // Verify axios was called twice
      expect(mockedAxios.request).toHaveBeenCalledTimes(2);

      // Verify response structure
      expect(response).toEqual({
        body: { id: 'test-id', name: 'Test Resource' },
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should give up after max retries', async () => {
      // Mock network error for all attempts
      const networkError = new Error('Network Error');
      mockedAxios.request.mockRejectedValue(networkError);

      // Make request and expect it to throw
      await expect(apiClient.request({
        method: 'GET',
        path: '/v1/resources/test-id',
        authType: 'oauth2'
      })).rejects.toThrow('Network Error');

      // Verify axios was called maxRetries + 1 times (initial + retries)
      expect(mockedAxios.request).toHaveBeenCalledTimes(config.retry.maxRetries + 1);
    });
  });
});
