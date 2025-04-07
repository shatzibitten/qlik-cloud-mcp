import axios from 'axios';
import { AuthProvider, AuthToken, OAuth2Credentials, AuthenticationError, TokenRefreshError, TokenRevocationError } from './types';

/**
 * OAuth2 configuration interface
 */
export interface OAuth2Config {
  /**
   * The client ID
   */
  clientId: string;
  
  /**
   * The client secret
   */
  clientSecret: string;
  
  /**
   * The token URL
   */
  tokenUrl: string;
}

/**
 * OAuth2 provider class
 * Implements the AuthProvider interface for OAuth2 authentication
 */
export class OAuth2Provider implements AuthProvider {
  private clientId: string;
  private clientSecret: string;
  private tokenUrl: string;
  
  /**
   * Constructor
   * @param config OAuth2 configuration
   */
  constructor(config: OAuth2Config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokenUrl = config.tokenUrl;
  }
  
  /**
   * Authenticate with Qlik Cloud using OAuth2
   * @param credentials OAuth2 credentials
   * @returns Promise resolving to an AuthToken
   */
  async authenticate(credentials: OAuth2Credentials): Promise<AuthToken> {
    try {
      // Prepare request data based on grant type
      const data: Record<string, string> = {
        grant_type: credentials.grantType,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      };
      
      // Add additional parameters based on grant type
      if (credentials.grantType === 'password') {
        if (!credentials.username || !credentials.password) {
          throw new AuthenticationError('Username and password are required for password grant');
        }
        data.username = credentials.username;
        data.password = credentials.password;
      }
      
      if (credentials.scope) {
        data.scope = credentials.scope;
      }
      
      // Make request to token endpoint
      const response = await axios.post(this.tokenUrl, new URLSearchParams(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Parse response
      const now = Date.now();
      const expiresIn = response.data.expires_in || 3600; // Default to 1 hour if not provided
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: now + expiresIn * 1000,
        tokenType: response.data.token_type || 'Bearer',
        scope: response.data.scope,
      };
    } catch (error: any) {
      // Handle axios errors
      if (error.response) {
        throw new AuthenticationError(`OAuth2 authentication failed: ${error.response.data.error_description || error.response.data.error || error.message}`, {
          code: 'OAUTH2_AUTH_FAILED',
          details: {
            status: error.response.status,
            data: error.response.data,
          },
          cause: error,
        });
      }
      
      // Handle network errors
      throw new AuthenticationError(`OAuth2 authentication failed: ${error.message}`, {
        code: 'OAUTH2_AUTH_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Refresh an OAuth2 token
   * @param token The token to refresh
   * @returns Promise resolving to a new AuthToken
   */
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    if (!token.refreshToken) {
      throw new TokenRefreshError('No refresh token available');
    }
    
    try {
      // Prepare request data
      const data = {
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      };
      
      // Make request to token endpoint
      const response = await axios.post(this.tokenUrl, new URLSearchParams(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Parse response
      const now = Date.now();
      const expiresIn = response.data.expires_in || 3600; // Default to 1 hour if not provided
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || token.refreshToken,
        expiresAt: now + expiresIn * 1000,
        tokenType: response.data.token_type || 'Bearer',
        scope: response.data.scope || token.scope,
      };
    } catch (error: any) {
      // Handle axios errors
      if (error.response) {
        throw new TokenRefreshError(`OAuth2 token refresh failed: ${error.response.data.error_description || error.response.data.error || error.message}`, {
          code: 'OAUTH2_REFRESH_FAILED',
          details: {
            status: error.response.status,
            data: error.response.data,
          },
          cause: error,
        });
      }
      
      // Handle network errors
      throw new TokenRefreshError(`OAuth2 token refresh failed: ${error.message}`, {
        code: 'OAUTH2_REFRESH_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Revoke an OAuth2 token
   * @param token The token to revoke
   * @returns Promise resolving when token is revoked
   */
  async revokeToken(token: AuthToken): Promise<void> {
    try {
      // Note: Qlik Cloud doesn't have a standard token revocation endpoint
      // This is a placeholder implementation
      // In a real implementation, you would call the token revocation endpoint if available
      
      // For now, we'll just log that the token was "revoked"
      console.log(`Token revocation not implemented for Qlik Cloud OAuth2`);
      
      // In a real implementation, you might do something like:
      /*
      await axios.post(this.revocationUrl, new URLSearchParams({
        token: token.accessToken,
        token_type_hint: 'access_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (token.refreshToken) {
        await axios.post(this.revocationUrl, new URLSearchParams({
          token: token.refreshToken,
          token_type_hint: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      }
      */
    } catch (error: any) {
      // Handle axios errors
      if (error.response) {
        throw new TokenRevocationError(`OAuth2 token revocation failed: ${error.response.data.error_description || error.response.data.error || error.message}`, {
          code: 'OAUTH2_REVOCATION_FAILED',
          details: {
            status: error.response.status,
            data: error.response.data,
          },
          cause: error,
        });
      }
      
      // Handle network errors
      throw new TokenRevocationError(`OAuth2 token revocation failed: ${error.message}`, {
        code: 'OAUTH2_REVOCATION_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Check if an OAuth2 token is valid
   * @param token The token to check
   * @returns Boolean indicating if token is valid
   */
  isTokenValid(token: AuthToken): boolean {
    // Check if token is expired
    const now = Date.now();
    
    // Add a buffer of 60 seconds to account for network latency
    return token.expiresAt > now + 60000;
  }
}
