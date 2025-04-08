import { AuthProvider } from './types';
import jwt from 'jsonwebtoken';

/**
 * Interface for JWT provider configuration
 */
export interface JWTProviderConfig {
  key: string;
  issuer: string;
  subject?: string;
  audience?: string;
  expiresIn?: string | number;
  keyId?: string;
  algorithm?: string;
  claims?: Record<string, any>;
}

/**
 * JWTProvider class for JWT-based authentication with Qlik Cloud
 * 
 * This class implements the AuthProvider interface for JWT authentication,
 * which is commonly used for legacy embedding scenarios in Qlik Cloud.
 */
export class JWTProvider implements AuthProvider {
  private _config: JWTProviderConfig;
  private _token: string | null = null;
  private _expiresAt: number = 0;
  private _refreshThreshold: number = 60 * 1000; // 1 minute before expiry

  /**
   * Creates a new JWTProvider instance
   * 
   * @param config - Configuration for the JWT provider
   */
  constructor(config: JWTProviderConfig) {
    this._config = config;
  }

  /**
   * Get the authentication type
   */
  get type(): string {
    return 'jwt';
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
      // Prepare the payload
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = typeof this._config.expiresIn === 'number' 
        ? this._config.expiresIn 
        : this._config.expiresIn 
          ? parseInt(this._config.expiresIn, 10) 
          : 3600; // Default to 1 hour
      
      const payload: Record<string, any> = {
        iss: this._config.issuer,
        iat: now,
        exp: now + expiresIn,
        ...this._config.claims
      };
      
      if (this._config.subject) {
        payload.sub = this._config.subject;
      }
      
      if (this._config.audience) {
        payload.aud = this._config.audience;
      }
      
      // Prepare the options
      const options: jwt.SignOptions = {
        algorithm: (this._config.algorithm || 'HS256') as jwt.Algorithm
      };
      
      if (this._config.keyId) {
        options.keyid = this._config.keyId;
      }
      
      // Sign the token
      this._token = jwt.sign(payload, this._config.key, options);
      this._expiresAt = (payload.exp * 1000);
      
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
