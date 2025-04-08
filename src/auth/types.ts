/**
 * Interface for authentication provider
 */
export interface AuthProvider {
  /**
   * Get the authentication type
   */
  readonly type: string;
  
  /**
   * Get the current token
   */
  readonly token: string | null;
  
  /**
   * Check if the token is valid
   */
  readonly isValid: boolean;
  
  /**
   * Get authentication headers
   * 
   * @returns Promise that resolves with the authentication headers
   */
  getAuthHeaders(): Promise<Record<string, string>>;
  
  /**
   * Authenticate with the provider
   * 
   * @returns Promise that resolves with the token
   */
  authenticate(): Promise<string>;
  
  /**
   * Ensure we have a valid token
   * 
   * @returns Promise that resolves with the token
   */
  ensureValidToken(): Promise<string>;
  
  /**
   * Invalidate the current token
   * 
   * @returns Promise that resolves when the token is invalidated
   */
  invalidateToken(): Promise<void>;
}
