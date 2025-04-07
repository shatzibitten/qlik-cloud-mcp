import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthManager } from '../../src/auth/auth-manager';
import { OAuth2Provider } from '../../src/auth/oauth2-provider';
import { JWTProvider } from '../../src/auth/jwt-provider';
import { APIKeyProvider } from '../../src/auth/api-key-provider';
import { TokenStore } from '../../src/auth/token-store';

// Mock the providers and token store
jest.mock('../../src/auth/oauth2-provider');
jest.mock('../../src/auth/jwt-provider');
jest.mock('../../src/auth/api-key-provider');
jest.mock('../../src/auth/token-store');

describe('AuthManager', () => {
  let authManager: AuthManager;
  let mockOAuth2Provider: jest.Mocked<OAuth2Provider>;
  let mockJWTProvider: jest.Mocked<JWTProvider>;
  let mockAPIKeyProvider: jest.Mocked<APIKeyProvider>;
  let mockTokenStore: jest.Mocked<TokenStore>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockOAuth2Provider = new OAuth2Provider({} as any) as jest.Mocked<OAuth2Provider>;
    mockJWTProvider = new JWTProvider({} as any) as jest.Mocked<JWTProvider>;
    mockAPIKeyProvider = new APIKeyProvider({} as any) as jest.Mocked<APIKeyProvider>;
    mockTokenStore = new TokenStore() as jest.Mocked<TokenStore>;

    // Create auth manager with mocked dependencies
    authManager = new AuthManager({
      oauth2: {
        enabled: true,
        provider: mockOAuth2Provider
      },
      jwt: {
        enabled: true,
        provider: mockJWTProvider
      },
      apiKey: {
        enabled: true,
        provider: mockAPIKeyProvider
      },
      tokenStore: mockTokenStore
    });
  });

  describe('authenticate', () => {
    it('should authenticate with OAuth2 provider', async () => {
      // Mock token
      const mockToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Setup mock
      mockOAuth2Provider.authenticate.mockResolvedValueOnce(mockToken);

      // Call authenticate
      const token = await authManager.authenticate('oauth2', { grantType: 'client_credentials' });

      // Verify provider was called
      expect(mockOAuth2Provider.authenticate).toHaveBeenCalledWith({ grantType: 'client_credentials' });

      // Verify token store was called
      expect(mockTokenStore.storeToken).toHaveBeenCalledWith('oauth2', mockToken);

      // Verify token was returned
      expect(token).toEqual(mockToken);
    });

    it('should authenticate with JWT provider', async () => {
      // Mock token
      const mockToken = {
        accessToken: 'test-jwt-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer'
      };

      // Setup mock
      mockJWTProvider.authenticate.mockResolvedValueOnce(mockToken);

      // Call authenticate
      const token = await authManager.authenticate('jwt', { subject: 'test-user' });

      // Verify provider was called
      expect(mockJWTProvider.authenticate).toHaveBeenCalledWith({ subject: 'test-user' });

      // Verify token store was called
      expect(mockTokenStore.storeToken).toHaveBeenCalledWith('jwt', mockToken);

      // Verify token was returned
      expect(token).toEqual(mockToken);
    });

    it('should authenticate with API key provider', async () => {
      // Mock token
      const mockToken = {
        accessToken: 'test-api-key',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer'
      };

      // Setup mock
      mockAPIKeyProvider.authenticate.mockResolvedValueOnce(mockToken);

      // Call authenticate
      const token = await authManager.authenticate('apiKey', {});

      // Verify provider was called
      expect(mockAPIKeyProvider.authenticate).toHaveBeenCalledWith({});

      // Verify token store was called
      expect(mockTokenStore.storeToken).toHaveBeenCalledWith('apiKey', mockToken);

      // Verify token was returned
      expect(token).toEqual(mockToken);
    });

    it('should throw an error for an unsupported auth type', async () => {
      // Call authenticate with unsupported auth type
      await expect(authManager.authenticate('unsupported' as any, {}))
        .rejects.toThrow('Unsupported authentication type: unsupported');
    });

    it('should throw an error for a disabled auth type', async () => {
      // Create auth manager with disabled OAuth2
      authManager = new AuthManager({
        oauth2: {
          enabled: false,
          provider: mockOAuth2Provider
        },
        jwt: {
          enabled: true,
          provider: mockJWTProvider
        },
        apiKey: {
          enabled: true,
          provider: mockAPIKeyProvider
        },
        tokenStore: mockTokenStore
      });

      // Call authenticate with disabled auth type
      await expect(authManager.authenticate('oauth2', {}))
        .rejects.toThrow('Authentication type is not enabled: oauth2');
    });
  });

  describe('getToken', () => {
    it('should get a token from the token store', () => {
      // Mock token
      const mockToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Setup mock
      mockTokenStore.getToken.mockReturnValueOnce(mockToken);

      // Call getToken
      const token = authManager.getToken('oauth2');

      // Verify token store was called
      expect(mockTokenStore.getToken).toHaveBeenCalledWith('oauth2');

      // Verify token was returned
      expect(token).toEqual(mockToken);
    });

    it('should return undefined if no token exists', () => {
      // Setup mock
      mockTokenStore.getToken.mockReturnValueOnce(undefined);

      // Call getToken
      const token = authManager.getToken('oauth2');

      // Verify token store was called
      expect(mockTokenStore.getToken).toHaveBeenCalledWith('oauth2');

      // Verify undefined was returned
      expect(token).toBeUndefined();
    });
  });

  describe('ensureValidToken', () => {
    it('should return existing token if valid', async () => {
      // Mock token
      const mockToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Setup mocks
      mockTokenStore.getToken.mockReturnValueOnce(mockToken);
      mockOAuth2Provider.isTokenValid.mockReturnValueOnce(true);

      // Call ensureValidToken
      const token = await authManager.ensureValidToken('oauth2');

      // Verify token store was called
      expect(mockTokenStore.getToken).toHaveBeenCalledWith('oauth2');

      // Verify provider was called
      expect(mockOAuth2Provider.isTokenValid).toHaveBeenCalledWith(mockToken);

      // Verify token was returned
      expect(token).toEqual(mockToken);
    });

    it('should refresh token if not valid but refreshable', async () => {
      // Mock tokens
      const oldToken = {
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: Date.now() - 3600000, // Expired
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      const newToken = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Setup mocks
      mockTokenStore.getToken.mockReturnValueOnce(oldToken);
      mockOAuth2Provider.isTokenValid.mockReturnValueOnce(false);
      mockOAuth2Provider.refreshToken.mockResolvedValueOnce(newToken);

      // Call ensureValidToken
      const token = await authManager.ensureValidToken('oauth2');

      // Verify token store was called
      expect(mockTokenStore.getToken).toHaveBeenCalledWith('oauth2');

      // Verify provider was called
      expect(mockOAuth2Provider.isTokenValid).toHaveBeenCalledWith(oldToken);
      expect(mockOAuth2Provider.refreshToken).toHaveBeenCalledWith(oldToken);

      // Verify token store was updated
      expect(mockTokenStore.storeToken).toHaveBeenCalledWith('oauth2', newToken);

      // Verify new token was returned
      expect(token).toEqual(newToken);
    });

    it('should authenticate if no token exists', async () => {
      // Mock token
      const mockToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Setup mocks
      mockTokenStore.getToken.mockReturnValueOnce(undefined);
      mockOAuth2Provider.authenticate.mockResolvedValueOnce(mockToken);

      // Call ensureValidToken
      const token = await authManager.ensureValidToken('oauth2');

      // Verify token store was called
      expect(mockTokenStore.getToken).toHaveBeenCalledWith('oauth2');

      // Verify provider was called
      expect(mockOAuth2Provider.authenticate).toHaveBeenCalledWith({});

      // Verify token store was updated
      expect(mockTokenStore.storeToken).toHaveBeenCalledWith('oauth2', mockToken);

      // Verify token was returned
      expect(token).toEqual(mockToken);
    });

    it('should throw an error for an unsupported auth type', async () => {
      // Call ensureValidToken with unsupported auth type
      await expect(authManager.ensureValidToken('unsupported' as any))
        .rejects.toThrow('Unsupported authentication type: unsupported');
    });

    it('should throw an error for a disabled auth type', async () => {
      // Create auth manager with disabled OAuth2
      authManager = new AuthManager({
        oauth2: {
          enabled: false,
          provider: mockOAuth2Provider
        },
        jwt: {
          enabled: true,
          provider: mockJWTProvider
        },
        apiKey: {
          enabled: true,
          provider: mockAPIKeyProvider
        },
        tokenStore: mockTokenStore
      });

      // Call ensureValidToken with disabled auth type
      await expect(authManager.ensureValidToken('oauth2'))
        .rejects.toThrow('Authentication type is not enabled: oauth2');
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token', async () => {
      // Mock token
      const mockToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'user_default'
      };

      // Setup mocks
      mockTokenStore.getToken.mockReturnValueOnce(mockToken);
      mockOAuth2Provider.revokeToken.mockResolvedValueOnce();

      // Call revokeToken
      await authManager.revokeToken('oauth2');

      // Verify token store was called
      expect(mockTokenStore.getToken).toHaveBeenCalledWith('oauth2');

      // Verify provider was called
      expect(mockOAuth2Provider.revokeToken).toHaveBeenCalledWith(mockToken);

      // Verify token was removed
      expect(mockTokenStore.removeToken).toHaveBeenCalledWith('oauth2');
    });

    it('should not throw if no token exists', async () => {
      // Setup mock
      mockTokenStore.getToken.mockReturnValueOnce(undefined);

      // Call revokeToken
      await expect(authManager.revokeToken('oauth2')).resolves.not.toThrow();

      // Verify token store was called
      expect(mockTokenStore.getToken).toHaveBeenCalledWith('oauth2');

      // Verify provider was not called
      expect(mockOAuth2Provider.revokeToken).not.toHaveBeenCalled();

      // Verify token was not removed
      expect(mockTokenStore.removeToken).not.toHaveBeenCalled();
    });

    it('should throw an error for an unsupported auth type', async () => {
      // Call revokeToken with unsupported auth type
      await expect(authManager.revokeToken('unsupported' as any))
        .rejects.toThrow('Unsupported authentication type: unsupported');
    });

    it('should throw an error for a disabled auth type', async () => {
      // Create auth manager with disabled OAuth2
      authManager = new AuthManager({
        oauth2: {
          enabled: false,
          provider: mockOAuth2Provider
        },
        jwt: {
          enabled: true,
          provider: mockJWTProvider
        },
        apiKey: {
          enabled: true,
          provider: mockAPIKeyProvider
        },
        tokenStore: mockTokenStore
      });

      // Call revokeToken with disabled auth type
      await expect(authManager.revokeToken('oauth2'))
        .rejects.toThrow('Authentication type is not enabled: oauth2');
    });
  });
});
