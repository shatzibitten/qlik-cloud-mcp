import { AuthProvider, AuthToken, ProviderNotFoundError, AuthenticationError } from './types';
import { OAuth2Provider, OAuth2Config } from './oauth2-provider';
import { JWTProvider, JWTConfig } from './jwt-provider';
import { APIKeyProvider, APIKeyConfig } from './api-key-provider';
import { TokenStore } from './token-store';

/**
 * Auth manager configuration interface
 */
export interface AuthManagerConfig {
  /**
   * OAuth2 configuration (optional)
   */
  oauth2?: OAuth2Config;
  
  /**
   * JWT configuration (optional)
   */
  jwt?: JWTConfig;
  
  /**
   * API key configuration (optional)
   */
  apiKey?: APIKeyConfig;
}

/**
 * Auth manager class
 * Manages authentication providers and token lifecycle
 */
export class AuthManager {
  private providers: Map<string, AuthProvider>;
  private tokenStore: TokenStore;
  
  /**
   * Constructor
   * @param config Auth manager configuration
   */
  constructor(config: AuthManagerConfig) {
    this.providers = new Map();
    this.tokenStore = new TokenStore();
    
    // Initialize providers based on configuration
    if (config.oauth2) {
      this.providers.set('oauth2', new OAuth2Provider(config.oauth2));
    }
    
    if (config.jwt) {
      this.providers.set('jwt', new JWTProvider(config.jwt));
    }
    
    if (config.apiKey) {
      this.providers.set('apiKey', new APIKeyProvider(config.apiKey));
    }
  }
  
  /**
   * Get an authentication provider by type
   * @param type The provider type
   * @returns The provider instance
   * @throws ProviderNotFoundError if provider not found
   */
  getProvider(type: string): AuthProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new ProviderNotFoundError(`Provider not found: ${type}`);
    }
    return provider;
  }
  
  /**
   * Check if a provider exists
   * @param type The provider type
   * @returns Boolean indicating if the provider exists
   */
  hasProvider(type: string): boolean {
    return this.providers.has(type);
  }
  
  /**
   * Add a provider
   * @param type The provider type
   * @param provider The provider instance
   */
  addProvider(type: string, provider: AuthProvider): void {
    this.providers.set(type, provider);
  }
  
  /**
   * Remove a provider
   * @param type The provider type
   */
  removeProvider(type: string): void {
    this.providers.delete(type);
    this.tokenStore.removeToken(type);
  }
  
  /**
   * Authenticate using a specific provider
   * @param type The provider type
   * @param credentials The authentication credentials
   * @returns Promise resolving to an AuthToken
   * @throws ProviderNotFoundError if provider not found
   * @throws AuthenticationError if authentication fails
   */
  async authenticate(type: string, credentials: any): Promise<AuthToken> {
    const provider = this.getProvider(type);
    const token = await provider.authenticate(credentials);
    this.tokenStore.storeToken(type, token);
    return token;
  }
  
  /**
   * Get a valid token for a provider
   * @param type The provider type
   * @returns Promise resolving to an AuthToken
   * @throws ProviderNotFoundError if provider not found
   * @throws AuthenticationError if no token available and no credentials provided
   */
  async getToken(type: string): Promise<AuthToken> {
    const provider = this.getProvider(type);
    let token = this.tokenStore.getToken(type);
    
    // If token doesn't exist or is expired, refresh it
    if (!token || !provider.isTokenValid(token)) {
      if (token) {
        token = await provider.refreshToken(token);
        this.tokenStore.storeToken(type, token);
      } else {
        throw new AuthenticationError(`No token available for provider: ${type}`);
      }
    }
    
    return token;
  }
  
  /**
   * Revoke a token
   * @param type The provider type
   * @returns Promise resolving when token is revoked
   * @throws ProviderNotFoundError if provider not found
   */
  async revokeToken(type: string): Promise<void> {
    const provider = this.getProvider(type);
    const token = this.tokenStore.getToken(type);
    
    if (token) {
      await provider.revokeToken(token);
      this.tokenStore.removeToken(type);
    }
  }
  
  /**
   * Get all available provider types
   * @returns Array of provider types
   */
  getProviderTypes(): string[] {
    return Array.from(this.providers.keys());
  }
}
