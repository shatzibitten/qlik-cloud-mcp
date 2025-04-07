/**
 * Authentication token interface
 */
export interface AuthToken {
  /**
   * The access token string
   */
  accessToken: string;
  
  /**
   * The refresh token string (optional)
   */
  refreshToken?: string;
  
  /**
   * Timestamp when the token expires (in milliseconds)
   */
  expiresAt: number;
  
  /**
   * The token type (e.g., "Bearer")
   */
  tokenType: string;
  
  /**
   * The token scope (optional)
   */
  scope?: string;
}

/**
 * Authentication provider interface
 * Defines the contract for all authentication providers
 */
export interface AuthProvider {
  /**
   * Authenticate with Qlik Cloud and obtain a token
   * @param credentials Authentication credentials
   * @returns Promise resolving to an AuthToken
   */
  authenticate(credentials: any): Promise<AuthToken>;
  
  /**
   * Refresh an existing token
   * @param token The token to refresh
   * @returns Promise resolving to a new AuthToken
   */
  refreshToken(token: AuthToken): Promise<AuthToken>;
  
  /**
   * Revoke a token
   * @param token The token to revoke
   * @returns Promise resolving when token is revoked
   */
  revokeToken(token: AuthToken): Promise<void>;
  
  /**
   * Check if a token is valid
   * @param token The token to check
   * @returns Boolean indicating if token is valid
   */
  isTokenValid(token: AuthToken): boolean;
}

/**
 * OAuth2 credentials interface
 */
export interface OAuth2Credentials {
  /**
   * The grant type (e.g., "client_credentials", "password")
   */
  grantType: string;
  
  /**
   * The username (for password grant)
   */
  username?: string;
  
  /**
   * The password (for password grant)
   */
  password?: string;
  
  /**
   * The scope (optional)
   */
  scope?: string;
}

/**
 * JWT credentials interface
 */
export interface JWTCredentials {
  /**
   * The subject (user identifier)
   */
  subject: string;
  
  /**
   * Additional claims (optional)
   */
  claims?: Record<string, any>;
}

/**
 * API key credentials interface
 */
export interface APIKeyCredentials {
  /**
   * The API key
   */
  apiKey: string;
}

/**
 * Authentication error class
 */
export class AuthenticationError extends Error {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Error details
   */
  details?: Record<string, any>;
  
  /**
   * Constructor
   * @param message Error message
   * @param options Error options
   */
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { cause: options?.cause });
    this.name = 'AuthenticationError';
    this.code = options?.code || 'AUTH_ERROR';
    this.details = options?.details;
  }
}

/**
 * Token refresh error class
 */
export class TokenRefreshError extends AuthenticationError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'TOKEN_REFRESH_ERROR', details: options?.details, cause: options?.cause });
    this.name = 'TokenRefreshError';
  }
}

/**
 * Token revocation error class
 */
export class TokenRevocationError extends AuthenticationError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'TOKEN_REVOCATION_ERROR', details: options?.details, cause: options?.cause });
    this.name = 'TokenRevocationError';
  }
}

/**
 * Provider not found error class
 */
export class ProviderNotFoundError extends AuthenticationError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'PROVIDER_NOT_FOUND', details: options?.details, cause: options?.cause });
    this.name = 'ProviderNotFoundError';
  }
}
