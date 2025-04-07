import { AuthProvider, AuthToken, APIKeyCredentials, AuthenticationError, TokenRefreshError, TokenRevocationError } from './types';

/**
 * API key configuration interface
 */
export interface APIKeyConfig {
  /**
   * The API key
   */
  apiKey: string;
}

/**
 * API key provider class
 * Implements the AuthProvider interface for API key authentication
 */
export class APIKeyProvider implements AuthProvider {
  private apiKey: string;
  
  /**
   * Constructor
   * @param config API key configuration
   */
  constructor(config: APIKeyConfig) {
    this.apiKey = config.apiKey;
  }
  
  /**
   * Authenticate with Qlik Cloud using API key
   * @param credentials API key credentials (optional, uses configured API key if not provided)
   * @returns Promise resolving to an AuthToken
   */
  async authenticate(credentials?: APIKeyCredentials): Promise<AuthToken> {
    try {
      // Use provided API key or fall back to configured API key
      const apiKey = credentials?.apiKey || this.apiKey;
      
      if (!apiKey) {
        throw new AuthenticationError('API key is required');
      }
      
      // API keys don't expire, but we'll set a long expiration for consistency
      // One year from now
      const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
      
      return {
        accessToken: apiKey,
        expiresAt,
        tokenType: 'Bearer',
      };
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      throw new AuthenticationError(`API key authentication failed: ${error.message}`, {
        code: 'API_KEY_AUTH_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Refresh an API key token
   * @param token The token to refresh
   * @returns Promise resolving to a new AuthToken
   */
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    // API keys don't need to be refreshed, just return the same token
    // with an updated expiration
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    
    return {
      ...token,
      expiresAt,
    };
  }
  
  /**
   * Revoke an API key token
   * @param token The token to revoke
   * @returns Promise resolving when token is revoked
   */
  async revokeToken(token: AuthToken): Promise<void> {
    try {
      // API keys need to be deleted through the Qlik Cloud API
      // This is a placeholder implementation
      console.log(`API key revocation not implemented directly. API keys should be deleted through the Qlik Cloud API.`);
      
      // In a real implementation, you might call the API key deletion endpoint:
      /*
      await axios.delete(`${apiBaseUrl}/v1/api-keys/${apiKeyId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      */
    } catch (error: any) {
      throw new TokenRevocationError(`API key revocation failed: ${error.message}`, {
        code: 'API_KEY_REVOCATION_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Check if an API key token is valid
   * @param token The token to check
   * @returns Boolean indicating if token is valid
   */
  isTokenValid(token: AuthToken): boolean {
    // API keys don't expire, but we'll check the expiration for consistency
    const now = Date.now();
    
    // Add a buffer of 60 seconds to account for network latency
    return token.expiresAt > now + 60000;
  }
}
