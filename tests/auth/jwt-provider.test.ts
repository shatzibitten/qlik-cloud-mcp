import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JWTProvider } from '../../src/auth/jwt-provider';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('JWTProvider', () => {
  let provider: JWTProvider;
  const config = {
    key: 'test-jwt-key',
    algorithm: 'HS256',
    issuer: 'test-issuer',
    expiresIn: 3600
  };

  beforeEach(() => {
    provider = new JWTProvider(config);
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should successfully create a JWT token', async () => {
      // Mock successful token signing
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      mockedJwt.sign.mockReturnValueOnce(mockToken);

      // Call authenticate
      const token = await provider.authenticate({
        subject: 'test-user',
        claims: {
          name: 'Test User'
        }
      });

      // Verify jwt.sign was called correctly
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'test-user',
          name: 'Test User'
        }),
        config.key,
        expect.objectContaining({
          algorithm: config.algorithm,
          issuer: config.issuer,
          expiresIn: config.expiresIn
        })
      );

      // Verify token structure
      expect(token).toEqual({
        accessToken: mockToken,
        expiresAt: expect.any(Number),
        tokenType: 'Bearer'
      });
    });

    it('should handle JWT signing errors', async () => {
      // Mock error during signing
      mockedJwt.sign.mockImplementationOnce(() => {
        throw new Error('JWT signing error');
      });

      // Call authenticate and expect it to throw
      await expect(provider.authenticate({
        subject: 'test-user',
        claims: {
          name: 'Test User'
        }
      })).rejects.toThrow('Authentication failed: JWT signing error');
    });
  });

  describe('refreshToken', () => {
    it('should throw an error as JWT tokens cannot be refreshed', async () => {
      // Create a token
      const token = {
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer'
      };

      // Call refreshToken and expect it to throw
      await expect(provider.refreshToken(token))
        .rejects.toThrow('JWT tokens cannot be refreshed');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for a valid token', () => {
      // Create a valid token (expires in the future)
      const token = {
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000, // 1 hour in the future
        tokenType: 'Bearer'
      };

      // Check if token is valid
      expect(provider.isTokenValid(token)).toBe(true);
    });

    it('should return false for an expired token', () => {
      // Create an expired token
      const token = {
        accessToken: 'test-access-token',
        expiresAt: Date.now() - 3600000, // 1 hour in the past
        tokenType: 'Bearer'
      };

      // Check if token is valid
      expect(provider.isTokenValid(token)).toBe(false);
    });

    it('should return false for a token that expires soon', () => {
      // Create a token that expires soon
      const token = {
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 30000, // 30 seconds in the future
        tokenType: 'Bearer'
      };

      // Check if token is valid (should be false because it's within the buffer time)
      expect(provider.isTokenValid(token)).toBe(false);
    });
  });
});
