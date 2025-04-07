import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TokenStore } from '../../src/auth/token-store';

describe('TokenStore', () => {
  let tokenStore: TokenStore;

  beforeEach(() => {
    tokenStore = new TokenStore();
  });

  describe('storeToken', () => {
    it('should store a token for a given auth type', () => {
      // Create a token
      const token = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Store the token
      tokenStore.storeToken('oauth2', token);

      // Verify the token was stored
      expect(tokenStore.getToken('oauth2')).toEqual(token);
    });

    it('should overwrite an existing token for the same auth type', () => {
      // Create initial token
      const initialToken = {
        accessToken: 'initial-access-token',
        refreshToken: 'initial-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Store the initial token
      tokenStore.storeToken('oauth2', initialToken);

      // Create new token
      const newToken = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 7200000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Store the new token
      tokenStore.storeToken('oauth2', newToken);

      // Verify the new token overwrote the initial token
      expect(tokenStore.getToken('oauth2')).toEqual(newToken);
    });
  });

  describe('getToken', () => {
    it('should return the stored token for a given auth type', () => {
      // Create a token
      const token = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Store the token
      tokenStore.storeToken('oauth2', token);

      // Get the token
      const retrievedToken = tokenStore.getToken('oauth2');

      // Verify the retrieved token matches the stored token
      expect(retrievedToken).toEqual(token);
    });

    it('should return undefined for an auth type with no stored token', () => {
      // Get a token for an auth type that doesn't have one
      const retrievedToken = tokenStore.getToken('non-existent');

      // Verify undefined is returned
      expect(retrievedToken).toBeUndefined();
    });
  });

  describe('removeToken', () => {
    it('should remove a stored token for a given auth type', () => {
      // Create a token
      const token = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Store the token
      tokenStore.storeToken('oauth2', token);

      // Remove the token
      tokenStore.removeToken('oauth2');

      // Verify the token was removed
      expect(tokenStore.getToken('oauth2')).toBeUndefined();
    });

    it('should not throw an error when removing a non-existent token', () => {
      // Attempt to remove a token for an auth type that doesn't have one
      expect(() => {
        tokenStore.removeToken('non-existent');
      }).not.toThrow();
    });
  });

  describe('hasToken', () => {
    it('should return true if a token exists for the given auth type', () => {
      // Create a token
      const token = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Store the token
      tokenStore.storeToken('oauth2', token);

      // Check if token exists
      expect(tokenStore.hasToken('oauth2')).toBe(true);
    });

    it('should return false if no token exists for the given auth type', () => {
      // Check if token exists for an auth type that doesn't have one
      expect(tokenStore.hasToken('non-existent')).toBe(false);
    });
  });
});
