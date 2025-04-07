# Authentication Module Design

## Overview

The Authentication Module is responsible for handling all aspects of authenticating with Qlik Cloud APIs. It provides a unified interface for different authentication methods and manages the token lifecycle.

## Components

### AuthProvider Interface

The `AuthProvider` interface defines the contract for all authentication providers:

```typescript
interface AuthProvider {
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
```

### OAuth2Provider

The `OAuth2Provider` implements the `AuthProvider` interface for OAuth2 authentication:

```typescript
class OAuth2Provider implements AuthProvider {
  private clientId: string;
  private clientSecret: string;
  private tokenUrl: string;
  
  constructor(config: OAuth2Config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokenUrl = config.tokenUrl;
  }
  
  async authenticate(credentials: OAuth2Credentials): Promise<AuthToken> {
    // Implementation for OAuth2 authentication
  }
  
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    // Implementation for refreshing OAuth2 token
  }
  
  async revokeToken(token: AuthToken): Promise<void> {
    // Implementation for revoking OAuth2 token
  }
  
  isTokenValid(token: AuthToken): boolean {
    // Implementation for checking OAuth2 token validity
  }
}
```

### JWTProvider

The `JWTProvider` implements the `AuthProvider` interface for JWT authentication:

```typescript
class JWTProvider implements AuthProvider {
  private key: string;
  private algorithm: string;
  private issuer: string;
  
  constructor(config: JWTConfig) {
    this.key = config.key;
    this.algorithm = config.algorithm;
    this.issuer = config.issuer;
  }
  
  async authenticate(credentials: JWTCredentials): Promise<AuthToken> {
    // Implementation for JWT authentication
  }
  
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    // Implementation for refreshing JWT token
  }
  
  async revokeToken(token: AuthToken): Promise<void> {
    // Implementation for revoking JWT token
  }
  
  isTokenValid(token: AuthToken): boolean {
    // Implementation for checking JWT token validity
  }
}
```

### APIKeyProvider

The `APIKeyProvider` implements the `AuthProvider` interface for API key authentication:

```typescript
class APIKeyProvider implements AuthProvider {
  private apiKey: string;
  
  constructor(config: APIKeyConfig) {
    this.apiKey = config.apiKey;
  }
  
  async authenticate(credentials: APIKeyCredentials): Promise<AuthToken> {
    // Implementation for API key authentication
  }
  
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    // Implementation for refreshing API key token (usually not needed)
  }
  
  async revokeToken(token: AuthToken): Promise<void> {
    // Implementation for revoking API key token
  }
  
  isTokenValid(token: AuthToken): boolean {
    // Implementation for checking API key token validity
  }
}
```

### AuthManager

The `AuthManager` manages authentication providers and token lifecycle:

```typescript
class AuthManager {
  private providers: Map<string, AuthProvider>;
  private tokenStore: TokenStore;
  
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
   */
  getProvider(type: string): AuthProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider not found: ${type}`);
    }
    return provider;
  }
  
  /**
   * Authenticate using a specific provider
   * @param type The provider type
   * @param credentials The authentication credentials
   * @returns Promise resolving to an AuthToken
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
   */
  async getToken(type: string): Promise<AuthToken> {
    let token = this.tokenStore.getToken(type);
    
    // If token doesn't exist or is expired, refresh it
    if (!token || !this.getProvider(type).isTokenValid(token)) {
      if (token) {
        token = await this.getProvider(type).refreshToken(token);
      } else {
        throw new Error(`No token available for provider: ${type}`);
      }
      this.tokenStore.storeToken(type, token);
    }
    
    return token;
  }
  
  /**
   * Revoke a token
   * @param type The provider type
   * @returns Promise resolving when token is revoked
   */
  async revokeToken(type: string): Promise<void> {
    const token = this.tokenStore.getToken(type);
    if (token) {
      await this.getProvider(type).revokeToken(token);
      this.tokenStore.removeToken(type);
    }
  }
}
```

### TokenStore

The `TokenStore` handles secure storage and retrieval of tokens:

```typescript
class TokenStore {
  private tokens: Map<string, AuthToken>;
  
  constructor() {
    this.tokens = new Map();
  }
  
  /**
   * Store a token
   * @param key The token key
   * @param token The token to store
   */
  storeToken(key: string, token: AuthToken): void {
    this.tokens.set(key, token);
  }
  
  /**
   * Get a token
   * @param key The token key
   * @returns The stored token or undefined
   */
  getToken(key: string): AuthToken | undefined {
    return this.tokens.get(key);
  }
  
  /**
   * Remove a token
   * @param key The token key
   */
  removeToken(key: string): void {
    this.tokens.delete(key);
  }
}
```

## Data Models

### AuthToken

```typescript
interface AuthToken {
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
```

### OAuth2Credentials

```typescript
interface OAuth2Credentials {
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
```

### JWTCredentials

```typescript
interface JWTCredentials {
  /**
   * The subject (user identifier)
   */
  subject: string;
  
  /**
   * Additional claims (optional)
   */
  claims?: Record<string, any>;
}
```

### APIKeyCredentials

```typescript
interface APIKeyCredentials {
  /**
   * The API key
   */
  apiKey: string;
}
```

## Configuration

The Authentication Module is configured through environment variables or configuration files:

```typescript
interface AuthManagerConfig {
  /**
   * OAuth2 configuration (optional)
   */
  oauth2?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
  };
  
  /**
   * JWT configuration (optional)
   */
  jwt?: {
    key: string;
    algorithm: string;
    issuer: string;
  };
  
  /**
   * API key configuration (optional)
   */
  apiKey?: {
    apiKey: string;
  };
}
```

## Security Considerations

1. **Secure Storage**: Tokens and credentials must be stored securely.
2. **Token Rotation**: Tokens should be rotated regularly to minimize risk.
3. **Least Privilege**: Use the minimum required permissions for each token.
4. **Token Validation**: Always validate tokens before use.
5. **Secure Communication**: Use HTTPS for all communication with Qlik Cloud APIs.

## Error Handling

The Authentication Module defines the following error types:

1. **AuthenticationError**: Thrown when authentication fails.
2. **TokenRefreshError**: Thrown when token refresh fails.
3. **TokenRevocationError**: Thrown when token revocation fails.
4. **ProviderNotFoundError**: Thrown when a requested provider is not found.

All errors include appropriate error codes, messages, and details to aid in troubleshooting.
