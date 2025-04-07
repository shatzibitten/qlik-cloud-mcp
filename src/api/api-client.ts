import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthManager } from '../auth';
import { APIRequest, APIResponse, APIError, RequestError, ResponseError, RateLimitError, ServerError } from './types';

/**
 * API client configuration interface
 */
export interface APIClientConfig {
  /**
   * Base URL for the API
   */
  baseUrl: string;
  
  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;
  
  /**
   * Maximum number of retries for failed requests (default: 3)
   */
  maxRetries?: number;
  
  /**
   * Initial delay for retry backoff in milliseconds (default: 100)
   */
  initialRetryDelay?: number;
  
  /**
   * Backoff factor for retries (default: 2)
   */
  retryBackoffFactor?: number;
}

/**
 * API client class
 * Base client for making API requests to Qlik Cloud
 */
export class APIClient {
  private baseUrl: string;
  private authManager: AuthManager;
  private timeout: number;
  private maxRetries: number;
  private initialRetryDelay: number;
  private retryBackoffFactor: number;
  
  /**
   * Constructor
   * @param baseUrl Base URL for the API
   * @param authManager Authentication manager
   * @param config Additional configuration options
   */
  constructor(baseUrl: string, authManager: AuthManager, config?: Partial<APIClientConfig>) {
    this.baseUrl = baseUrl;
    this.authManager = authManager;
    this.timeout = config?.timeout || 30000;
    this.maxRetries = config?.maxRetries || 3;
    this.initialRetryDelay = config?.initialRetryDelay || 100;
    this.retryBackoffFactor = config?.retryBackoffFactor || 2;
  }
  
  /**
   * Make an authenticated request to the API
   * @param request The API request
   * @param authType The authentication type to use
   * @returns Promise resolving to the API response
   */
  async request(request: APIRequest, authType: string): Promise<APIResponse> {
    return this.executeWithRetry(async () => {
      try {
        // Get authentication token
        const token = await this.authManager.getToken(authType);
        
        // Prepare request with authentication
        const headers: Record<string, string> = {
          ...request.headers,
          'Authorization': `${token.tokenType} ${token.accessToken}`,
          'Content-Type': request.body ? 'application/json' : undefined,
          'Accept': 'application/json'
        };
        
        // Filter out undefined headers
        Object.keys(headers).forEach(key => {
          if (headers[key] === undefined) {
            delete headers[key];
          }
        });
        
        // Prepare URL with query parameters
        let url = `${this.baseUrl}${request.path}`;
        if (request.query && Object.keys(request.query).length > 0) {
          const queryParams = new URLSearchParams();
          for (const [key, value] of Object.entries(request.query)) {
            if (value !== undefined) {
              queryParams.append(key, value);
            }
          }
          url += `?${queryParams.toString()}`;
        }
        
        // Prepare request config
        const config: AxiosRequestConfig = {
          method: request.method,
          url,
          headers,
          data: request.body,
          timeout: this.timeout,
          validateStatus: () => true, // Don't throw on any status code
        };
        
        // Make the request
        const response = await axios.request(config);
        
        // Handle error status codes
        if (response.status >= 400) {
          this.handleErrorResponse(response);
        }
        
        // Return formatted response
        return {
          statusCode: response.status,
          headers: this.extractHeaders(response),
          body: response.data
        };
      } catch (error: any) {
        // Handle axios errors
        if (axios.isAxiosError(error)) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            this.handleErrorResponse(error.response);
          } else if (error.request) {
            // The request was made but no response was received
            throw new RequestError(`No response received: ${error.message}`, {
              code: 'NO_RESPONSE',
              cause: error
            });
          }
        }
        
        // Re-throw other errors
        throw error;
      }
    });
  }
  
  /**
   * Execute a function with retry logic
   * @param fn The function to execute
   * @returns Promise resolving to the function result
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if this is the last attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Don't retry certain errors
        if (!this.isRetryable(error)) {
          break;
        }
        
        // Wait before retrying
        const delay = this.initialRetryDelay * Math.pow(this.retryBackoffFactor, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  /**
   * Check if an error is retryable
   * @param error The error to check
   * @returns Boolean indicating if the error is retryable
   */
  private isRetryable(error: any): boolean {
    // Retry network errors
    if (error instanceof RequestError) {
      return true;
    }
    
    // Retry rate limit errors
    if (error instanceof RateLimitError) {
      return true;
    }
    
    // Retry server errors (5xx)
    if (error instanceof ServerError) {
      return true;
    }
    
    // Don't retry other errors
    return false;
  }
  
  /**
   * Handle error response
   * @param response The error response
   * @throws Appropriate error based on status code
   */
  private handleErrorResponse(response: AxiosResponse): never {
    const status = response.status;
    const data = response.data;
    const message = data?.message || data?.error || 'Unknown error';
    
    switch (true) {
      case status === 401:
        throw new APIError(`Authentication failed: ${message}`, {
          code: 'AUTHENTICATION_FAILED',
          statusCode: status,
          details: data
        });
      
      case status === 403:
        throw new APIError(`Authorization failed: ${message}`, {
          code: 'AUTHORIZATION_FAILED',
          statusCode: status,
          details: data
        });
      
      case status === 404:
        throw new APIError(`Resource not found: ${message}`, {
          code: 'RESOURCE_NOT_FOUND',
          statusCode: status,
          details: data
        });
      
      case status === 429:
        throw new RateLimitError(`Rate limit exceeded: ${message}`, {
          details: data
        });
      
      case status >= 500:
        throw new ServerError(`Server error: ${message}`, {
          statusCode: status,
          details: data
        });
      
      default:
        throw new ResponseError(`API error: ${message}`, {
          statusCode: status,
          details: data
        });
    }
  }
  
  /**
   * Extract headers from response
   * @param response The response
   * @returns Record of headers
   */
  private extractHeaders(response: AxiosResponse): Record<string, string> {
    const headers: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(response.headers)) {
      headers[key] = value as string;
    }
    
    return headers;
  }
}
