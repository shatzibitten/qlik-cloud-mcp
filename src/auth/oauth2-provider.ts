import { AuthProvider } from './types';
import axios from 'axios';

/**
 * Interface for OAuth2 provider configuration
 */
export interface OAuth2ProviderConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  audience?: string;
}

/**
 * OAuth2Provider class for machine-to-machine authentication with Qlik Cloud
 * 
 * This class implements the AuthProvider interface for OAuth2 authentication,
 * specifically designed for machine-to-machine scenarios with Qlik Cloud.
 */
export class OAuth2Provider implements AuthProvider {
  private _config: OAuth2ProviderConfig;
  private _token: string | null = null;
  private _expiresAt: number = 0;
  private _refreshThreshold: number = 60 * 1000; // 1 minute before expiry

  /**
   * Creates a new OAuth2Provider instance
   * 
   * @param config - Configuration for the OAuth2 provider
   */
  constructor(config: OAuth2ProviderConfig) {
    this._config = config;
  }

  /**
   * Get the authentication type
   */
  get type(): string {
    return 'oauth2';
  }

  /**
   * Get the current token
   */
  get token(): string | null {
    return this._token;
  }

  /**
   * Check if the token is valid
   */
  get isValid(): boolean {
    return !!this._token && Date.now() < this._expiresAt - this._refreshThreshold;
  }

  /**
   * Get the time when the token expires
   */
  get expiresAt(): number {
    return this._expiresAt;
  }

  /**
   * Get authentication headers
   * 
   * @returns Promise that resolves with the authentication headers
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    // Ensure we have a valid token
    await this.ensureValidToken();
    
    // Return the headers
    return {
      'Authorization': `Bearer ${this._token}`
    };
  }

  /**
   * Authenticate with the provider
   * 
   * @returns Promise that resolves with the token
   */
  async authenticate(): Promise<string> {
    try {
      // Prepare the request data
      const data = new URLSearchParams();
      data.append('grant_type', 'client_credentials');
      data.append('client_id', this._config.clientId);
      data.append('client_secret', this._config.clientSecret);
      
      if (this._config.scope) {
        data.append('scope', this._config.scope);
      }
      
      if (this._config.audience) {
        data.append('audience', this._config.audience);
      }
      
      // Make the request
      const response = await axios.post(this._config.tokenUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Extract the token and expiry
      const { access_token, expires_in } = response.data;
      
      if (!access_token) {
        throw new Error('No access token returned');
      }
      
      // Store the token and calculate expiry
      this._token = access_token;
      this._expiresAt = Date.now() + (expires_in * 1000);
      
      return this._token;
    } catch (error) {
      // Clear any existing token
      this._token = null;
      this._expiresAt = 0;
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Ensure we have a valid token
   * 
   * @returns Promise that resolves with the token
   */
  async ensureValidToken(): Promise<string> {
    if (!this.isValid) {
      return this.authenticate();
    }
    
    return this._token!;
  }

  /**
   * Invalidate the current token
   * 
   * @returns Promise that resolves when the token is invalidated
   */
  async invalidateToken(): Promise<void> {
    this._token = null;
    this._expiresAt = 0;
  }
}
