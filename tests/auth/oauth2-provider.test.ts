import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OAuth2Provider } from '../../src/auth/oauth2-provider';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OAuth2Provider', () => {
  let provider: OAuth2Provider;
  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    tokenUrl: 'https://test-tenant.us.qlikcloud.com/oauth/token'
  };

  beforeEach(() => {
    provider = new OAuth2Provider(config);
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should successfully authenticate with client credentials', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'user_default'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Call authenticate
      const token = await provider.authenticate({ grantType: 'client_credentials' });

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        config.tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': expect.stringContaining('Basic ')
          }
        }
      );

      // Verify token structure
      expect(token).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: expect.any(Number),
        tokenType: 'Bearer',
        scope: 'user_default'
      });
    });

    it('should handle authentication errors', async () => {
      // Mock error response
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: 'invalid_client',
            error_description: 'Invalid client credentials'
          }
        }
      });

      // Call authenticate and expect it to throw
      await expect(provider.authenticate({ grantType: 'client_credentials' }))
        .rejects.toThrow('Authentication failed: Invalid client credentials');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh a token', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'user_default'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Create a token to refresh
      const token = {
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Call refreshToken
      const newToken = await provider.refreshToken(token);

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        config.tokenUrl,
        'grant_type=refresh_token&refresh_token=old-refresh-token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': expect.stringContaining('Basic ')
          }
        }
      );

      // Verify token structure
      expect(newToken).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: expect.any(Number),
        tokenType: 'Bearer',
        scope: 'user_default'
      });
    });

    it('should handle refresh errors', async () => {
      // Mock error response
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: 'invalid_grant',
            error_description: 'Invalid refresh token'
          }
        }
      });

      // Create a token to refresh
      const token = {
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Call refreshToken and expect it to throw
      await expect(provider.refreshToken(token))
        .rejects.toThrow('Token refresh failed: Invalid refresh token');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for a valid token', () => {
      // Create a valid token (expires in the future)
      const token = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000, // 1 hour in the future
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Check if token is valid
      expect(provider.isTokenValid(token)).toBe(true);
    });

    it('should return false for an expired token', () => {
      // Create an expired token
      const token = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 3600000, // 1 hour in the past
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Check if token is valid
      expect(provider.isTokenValid(token)).toBe(false);
    });

    it('should return false for a token that expires soon', () => {
      // Create a token that expires soon
      const token = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 30000, // 30 seconds in the future
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Check if token is valid (should be false because it's within the buffer time)
      expect(provider.isTokenValid(token)).toBe(false);
    });
  });
});
