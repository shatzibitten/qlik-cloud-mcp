import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APIKeyProvider } from '../../src/auth/api-key-provider';

describe('APIKeyProvider', () => {
  let provider: APIKeyProvider;
  const config = {
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    provider = new APIKeyProvider(config);
  });

  describe('authenticate', () => {
    it('should successfully return an API key token', async () => {
      // Call authenticate
      const token = await provider.authenticate({});

      // Verify token structure
      expect(token).toEqual({
        accessToken: 'test-api-key',
        expiresAt: expect.any(Number), // Should be far in the future
        tokenType: 'Bearer'
      });

      // Verify the expiration is far in the future (at least 1 year)
      const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
      expect(token.expiresAt).toBeGreaterThan(oneYearFromNow);
    });
  });

  describe('refreshToken', () => {
    it('should throw an error as API key tokens cannot be refreshed', async () => {
      // Create a token
      const token = {
        accessToken: 'test-api-key',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer'
      };

      // Call refreshToken and expect it to throw
      await expect(provider.refreshToken(token))
        .rejects.toThrow('API key tokens cannot be refreshed');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for a valid token', () => {
      // Create a valid token (expires in the future)
      const token = {
        accessToken: 'test-api-key',
        expiresAt: Date.now() + 3600000, // 1 hour in the future
        tokenType: 'Bearer'
      };

      // Check if token is valid
      expect(provider.isTokenValid(token)).toBe(true);
    });

    it('should return false for an expired token', () => {
      // Create an expired token
      const token = {
        accessToken: 'test-api-key',
        expiresAt: Date.now() - 3600000, // 1 hour in the past
        tokenType: 'Bearer'
      };

      // Check if token is valid
      expect(provider.isTokenValid(token)).toBe(false);
    });

    it('should return false for a token that expires soon', () => {
      // Create a token that expires soon
      const token = {
        accessToken: 'test-api-key',
        expiresAt: Date.now() + 30000, // 30 seconds in the future
        tokenType: 'Bearer'
      };

      // Check if token is valid (should be false because it's within the buffer time)
      expect(provider.isTokenValid(token)).toBe(false);
    });
  });
});
