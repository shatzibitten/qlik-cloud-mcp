import { AuthProvider } from './types';

/**
 * Interface for API key provider configuration
 */
export interface APIKeyProviderConfig {
  apiKey: string;
  headerName?: string;
}

/**
 * APIKeyProvider class for API key authentication with Qlik Cloud
 * 
 * This class implements the AuthProvider interface for API key authentication,
 * which is a simple authentication method for Qlik Cloud APIs.
 */
export class APIKeyProvider implements AuthProvider {
  private _config: APIKeyProviderConfig;
  private _headerName: string;

  /**
   * Creates a new APIKeyProvider instance
   * 
   * @param config - Configuration for the API key provider
   */
  constructor(config: APIKeyProviderConfig) {
    this._config = config;
    this._headerName = config.headerName || 'X-Qlik-Api-Key';
  }

  /**
   * Get the authentication type
   */
  get type(): string {
    return 'apikey';
  }

  /**
   * Get the current token (API key)
   */
  get token(): string | null {
    return this._config.apiKey;
  }

  /**
   * Check if the token is valid
   * API keys don't expire, so this is always true if we have an API key
   */
  get isValid(): boolean {
    return !!this._config.apiKey;
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
    const headers: Record<string, string> = {};
    headers[this._headerName] = this._config.apiKey;
    return headers;
  }

  /**
   * Authenticate with the provider
   * For API keys, this just returns the key as there's no authentication flow
   * 
   * @returns Promise that resolves with the API key
   */
  async authenticate(): Promise<string> {
    if (!this._config.apiKey) {
      throw new Error('No API key provided');
    }
    
    return this._config.apiKey;
  }

  /**
   * Ensure we have a valid token
   * 
   * @returns Promise that resolves with the API key
   */
  async ensureValidToken(): Promise<string> {
    return this.authenticate();
  }

  /**
   * Invalidate the current token
   * For API keys, this doesn't do anything as they don't expire
   * 
   * @returns Promise that resolves immediately
   */
  async invalidateToken(): Promise<void> {
    // API keys don't expire, so this is a no-op
    return Promise.resolve();
  }
}
