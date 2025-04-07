import jwt from 'jsonwebtoken';
import { AuthProvider, AuthToken, JWTCredentials, AuthenticationError, TokenRefreshError, TokenRevocationError } from './types';

/**
 * JWT configuration interface
 */
export interface JWTConfig {
  /**
   * The signing key
   */
  key: string;
  
  /**
   * The signing algorithm
   */
  algorithm: string;
  
  /**
   * The token issuer
   */
  issuer: string;
  
  /**
   * Token expiration time in seconds (default: 1 hour)
   */
  expiresIn?: number;
}

/**
 * JWT provider class
 * Implements the AuthProvider interface for JWT authentication
 */
export class JWTProvider implements AuthProvider {
  private key: string;
  private algorithm: string;
  private issuer: string;
  private expiresIn: number;
  
  /**
   * Constructor
   * @param config JWT configuration
   */
  constructor(config: JWTConfig) {
    this.key = config.key;
    this.algorithm = config.algorithm;
    this.issuer = config.issuer;
    this.expiresIn = config.expiresIn || 3600; // Default to 1 hour
  }
  
  /**
   * Authenticate with Qlik Cloud using JWT
   * @param credentials JWT credentials
   * @returns Promise resolving to an AuthToken
   */
  async authenticate(credentials: JWTCredentials): Promise<AuthToken> {
    try {
      // Prepare JWT payload
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        sub: credentials.subject,
        iss: this.issuer,
        iat: now,
        exp: now + this.expiresIn,
        ...credentials.claims,
      };
      
      // Sign JWT
      const accessToken = jwt.sign(payload, this.key, { algorithm: this.algorithm as jwt.Algorithm });
      
      return {
        accessToken,
        expiresAt: (payload.exp * 1000),
        tokenType: 'Bearer',
      };
    } catch (error: any) {
      throw new AuthenticationError(`JWT authentication failed: ${error.message}`, {
        code: 'JWT_AUTH_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Refresh a JWT token
   * @param token The token to refresh
   * @returns Promise resolving to a new AuthToken
   */
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    try {
      // Decode the current token to get the subject and claims
      const decoded = jwt.verify(token.accessToken, this.key, { algorithms: [this.algorithm as jwt.Algorithm] }) as jwt.JwtPayload;
      
      // Create new token with the same subject and claims
      const credentials: JWTCredentials = {
        subject: decoded.sub as string,
        claims: { ...decoded },
      };
      
      // Remove standard JWT claims that will be added by authenticate
      delete credentials.claims.sub;
      delete credentials.claims.iss;
      delete credentials.claims.iat;
      delete credentials.claims.exp;
      
      // Generate new token
      return this.authenticate(credentials);
    } catch (error: any) {
      throw new TokenRefreshError(`JWT token refresh failed: ${error.message}`, {
        code: 'JWT_REFRESH_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Revoke a JWT token
   * @param token The token to revoke
   * @returns Promise resolving when token is revoked
   */
  async revokeToken(token: AuthToken): Promise<void> {
    try {
      // JWTs cannot be revoked unless using a blacklist/revocation list
      // This is a placeholder implementation
      console.log(`JWT token revocation not implemented (stateless tokens cannot be revoked)`);
      
      // In a real implementation with a revocation list, you might do:
      /*
      await axios.post(this.revocationUrl, {
        token: token.accessToken,
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      */
    } catch (error: any) {
      throw new TokenRevocationError(`JWT token revocation failed: ${error.message}`, {
        code: 'JWT_REVOCATION_FAILED',
        cause: error,
      });
    }
  }
  
  /**
   * Check if a JWT token is valid
   * @param token The token to check
   * @returns Boolean indicating if token is valid
   */
  isTokenValid(token: AuthToken): boolean {
    try {
      // Verify token signature and expiration
      jwt.verify(token.accessToken, this.key, { algorithms: [this.algorithm as jwt.Algorithm] });
      
      // Check if token is expired based on our stored expiresAt
      const now = Date.now();
      
      // Add a buffer of 60 seconds to account for network latency
      return token.expiresAt > now + 60000;
    } catch (error) {
      // Token is invalid or expired
      return false;
    }
  }
}
