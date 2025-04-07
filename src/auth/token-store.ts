/**
 * Token store class
 * Handles secure storage and retrieval of tokens
 */
export class TokenStore {
  private tokens: Map<string, any>;
  
  /**
   * Constructor
   */
  constructor() {
    this.tokens = new Map();
  }
  
  /**
   * Store a token
   * @param key The token key
   * @param token The token to store
   */
  storeToken(key: string, token: any): void {
    this.tokens.set(key, token);
  }
  
  /**
   * Get a token
   * @param key The token key
   * @returns The stored token or undefined
   */
  getToken(key: string): any | undefined {
    return this.tokens.get(key);
  }
  
  /**
   * Remove a token
   * @param key The token key
   */
  removeToken(key: string): void {
    this.tokens.delete(key);
  }
  
  /**
   * Check if a token exists
   * @param key The token key
   * @returns Boolean indicating if the token exists
   */
  hasToken(key: string): boolean {
    return this.tokens.has(key);
  }
  
  /**
   * Clear all tokens
   */
  clear(): void {
    this.tokens.clear();
  }
}
