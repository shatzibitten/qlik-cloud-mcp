import { AuthProvider } from './types';
import { OAuth2Provider } from './oauth2-provider';
import { JWTProvider } from './jwt-provider';
import { APIKeyProvider } from './api-key-provider';
import { EventEmitter } from 'events';

/**
 * Interface for auth manager configuration
 */
export interface AuthManagerConfig {
  defaultAuthType?: 'oauth2' | 'jwt' | 'apikey';
  oauth2?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
    audience?: string;
  };
  jwt?: {
    key: string;
    issuer: string;
    subject?: string;
    audience?: string;
    expiresIn?: string | number;
    keyId?: string;
    algorithm?: string;
    claims?: Record<string, any>;
  };
  apiKey?: {
    apiKey: string;
    headerName?: string;
  };
}

/**
 * AuthManager class for managing authentication providers
 * 
 * This class serves as a factory and registry for authentication providers,
 * allowing the application to use different authentication methods as needed.
 */
export class AuthManager extends EventEmitter {
  private _config: AuthManagerConfig;
  private _providers: Map<string, AuthProvider> = new Map();
  private _defaultAuthType: string;

  /**
   * Creates a new AuthManager instance
   * 
   * @param config - Configuration for the auth manager
   */
  constructor(config: AuthManagerConfig) {
    super();
    this._config = config;
    this._defaultAuthType = config.defaultAuthType || 'oauth2';
    
    // Initialize providers based on config
    this._initializeProviders();
  }

  /**
   * Get the default authentication type
   */
  get defaultAuthType(): string {
    return this._defaultAuthType;
  }

  /**
   * Set the default authentication type
   */
  set defaultAuthType(type: string) {
    if (!this._providers.has(type)) {
      throw new Error(`Authentication provider not found: ${type}`);
    }
    
    this._defaultAuthType = type;
  }

  /**
   * Get an authentication provider by type
   * 
   * @param type - Type of provider to get
   * @returns The authentication provider
   */
  getProvider(type?: string): AuthProvider {
    const providerType = type || this._defaultAuthType;
    const provider = this._providers.get(providerType);
    
    if (!provider) {
      throw new Error(`Authentication provider not found: ${providerType}`);
    }
    
    return provider;
  }

  /**
   * Check if a provider exists
   * 
   * @param type - Type of provider to check
   * @returns True if the provider exists, false otherwise
   */
  hasProvider(type: string): boolean {
    return this._providers.has(type);
  }

  /**
   * Get authentication headers for a provider
   * 
   * @param type - Type of provider to get headers for
   * @returns Promise that resolves with the authentication headers
   */
  async getAuthHeaders(type?: string): Promise<Record<string, string>> {
    const provider = this.getProvider(type);
    return provider.getAuthHeaders();
  }

  /**
   * Authenticate with a provider
   * 
   * @param type - Type of provider to authenticate with
   * @returns Promise that resolves with the token
   */
  async authenticate(type?: string): Promise<string> {
    const provider = this.getProvider(type);
    const token = await provider.authenticate();
    
    // Emit authenticated event
    this.emit('authenticated', { type: provider.type, token });
    
    return token;
  }

  /**
   * Ensure we have a valid token for a provider
   * 
   * @param type - Type of provider to ensure token for
   * @returns Promise that resolves with the token
   */
  async ensureValidToken(type?: string): Promise<string> {
    const provider = this.getProvider(type);
    return provider.ensureValidToken();
  }

  /**
   * Invalidate the token for a provider
   * 
   * @param type - Type of provider to invalidate token for
   * @returns Promise that resolves when the token is invalidated
   */
  async invalidateToken(type?: string): Promise<void> {
    const provider = this.getProvider(type);
    await provider.invalidateToken();
    
    // Emit token invalidated event
    this.emit('token-invalidated', { type: provider.type });
  }

  /**
   * Initialize authentication providers based on config
   */
  private _initializeProviders(): void {
    // Initialize OAuth2 provider if configured
    if (this._config.oauth2) {
      const oauth2Provider = new OAuth2Provider(this._config.oauth2);
      this._providers.set('oauth2', oauth2Provider);
    }
    
    // Initialize JWT provider if configured
    if (this._config.jwt) {
      const jwtProvider = new JWTProvider(this._config.jwt);
      this._providers.set('jwt', jwtProvider);
    }
    
    // Initialize API key provider if configured
    if (this._config.apiKey) {
      const apiKeyProvider = new APIKeyProvider(this._config.apiKey);
      this._providers.set('apikey', apiKeyProvider);
    }
    
    // Ensure we have at least one provider
    if (this._providers.size === 0) {
      throw new Error('No authentication providers configured');
    }
    
    // Ensure the default provider exists
    if (!this._providers.has(this._defaultAuthType)) {
      // Use the first available provider as default
      this._defaultAuthType = Array.from(this._providers.keys())[0];
    }
  }
}
