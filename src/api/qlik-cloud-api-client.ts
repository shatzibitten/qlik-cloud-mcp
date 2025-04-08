import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';

/**
 * Interface for Qlik Cloud API client configuration
 */
export interface QlikCloudAPIClientConfig {
  baseUrl: string;
  tenantId: string;
  authType?: 'oauth2' | 'jwt' | 'apikey';
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * QlikCloudAPIClient class for interacting with Qlik Cloud REST APIs
 * 
 * This class provides a base client for making requests to Qlik Cloud REST APIs,
 * handling authentication, retries, and error handling.
 */
export class QlikCloudAPIClient {
  private _config: QlikCloudAPIClientConfig;
  private _authManager: AuthManager;
  private _logger: LogManager;
  private _axios: AxiosInstance;
  private _retryAttempts: number;
  private _retryDelay: number;

  /**
   * Creates a new QlikCloudAPIClient instance
   * 
   * @param config - Configuration for the API client
   * @param authManager - Authentication manager
   * @param logger - Logger
   */
  constructor(
    config: QlikCloudAPIClientConfig,
    authManager: AuthManager,
    logger: LogManager
  ) {
    this._config = config;
    this._authManager = authManager;
    this._logger = logger;
    this._retryAttempts = config.retryAttempts || 3;
    this._retryDelay = config.retryDelay || 1000;
    
    // Create Axios instance
    this._axios = axios.create({
      baseURL: this._buildBaseUrl(),
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for authentication
    this._axios.interceptors.request.use(
      this._requestInterceptor.bind(this)
    );
    
    // Add response interceptor for error handling
    this._axios.interceptors.response.use(
      (response) => response,
      this._responseErrorInterceptor.bind(this)
    );
  }

  /**
   * Get the API client configuration
   */
  get config(): QlikCloudAPIClientConfig {
    return { ...this._config };
  }

  /**
   * Make a GET request
   * 
   * @param path - API path
   * @param params - Query parameters
   * @param config - Additional Axios config
   * @returns Promise that resolves with the response data
   */
  async get<T = any>(
    path: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this._axios.get<T>(path, {
      ...config,
      params
    });
    
    return response.data;
  }

  /**
   * Make a POST request
   * 
   * @param path - API path
   * @param data - Request body
   * @param config - Additional Axios config
   * @returns Promise that resolves with the response data
   */
  async post<T = any>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this._axios.post<T>(path, data, config);
    
    return response.data;
  }

  /**
   * Make a PUT request
   * 
   * @param path - API path
   * @param data - Request body
   * @param config - Additional Axios config
   * @returns Promise that resolves with the response data
   */
  async put<T = any>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this._axios.put<T>(path, data, config);
    
    return response.data;
  }

  /**
   * Make a PATCH request
   * 
   * @param path - API path
   * @param data - Request body
   * @param config - Additional Axios config
   * @returns Promise that resolves with the response data
   */
  async patch<T = any>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this._axios.patch<T>(path, data, config);
    
    return response.data;
  }

  /**
   * Make a DELETE request
   * 
   * @param path - API path
   * @param config - Additional Axios config
   * @returns Promise that resolves with the response data
   */
  async delete<T = any>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this._axios.delete<T>(path, config);
    
    return response.data;
  }

  /**
   * Build the base URL for the API
   * 
   * @returns The base URL
   */
  private _buildBaseUrl(): string {
    const baseUrl = this._config.baseUrl.endsWith('/')
      ? this._config.baseUrl.slice(0, -1)
      : this._config.baseUrl;
    
    return `${baseUrl}/api/v1`;
  }

  /**
   * Request interceptor for adding authentication headers
   * 
   * @param config - Axios request config
   * @returns Promise that resolves with the updated config
   */
  private async _requestInterceptor(
    config: AxiosRequestConfig
  ): Promise<AxiosRequestConfig> {
    try {
      // Get authentication headers
      const authHeaders = await this._authManager.getAuthHeaders(
        this._config.authType
      );
      
      // Add headers to request
      config.headers = {
        ...config.headers,
        ...authHeaders
      };
      
      return config;
    } catch (error) {
      this._logger.error('Failed to add authentication headers', { error });
      return Promise.reject(error);
    }
  }

  /**
   * Response error interceptor for handling errors and retries
   * 
   * @param error - Axios error
   * @returns Promise that resolves with the response or rejects with the error
   */
  private async _responseErrorInterceptor(error: any): Promise<AxiosResponse> {
    // Get request config
    const config = error.config;
    
    // Check if we should retry
    if (
      config &&
      config.__retryCount !== undefined &&
      config.__retryCount < this._retryAttempts &&
      this._shouldRetry(error)
    ) {
      // Increment retry count
      config.__retryCount = config.__retryCount || 0;
      config.__retryCount++;
      
      // Log retry attempt
      this._logger.info('Retrying request', {
        url: config.url,
        attempt: config.__retryCount,
        maxAttempts: this._retryAttempts
      });
      
      // Delay before retry
      await new Promise(resolve => setTimeout(resolve, this._retryDelay));
      
      // Retry request
      return this._axios(config);
    }
    
    // Log error
    this._logger.error('API request failed', {
      url: config?.url,
      status: error.response?.status,
      error: error.response?.data || error.message
    });
    
    // Reject with error
    return Promise.reject(error);
  }

  /**
   * Check if we should retry a failed request
   * 
   * @param error - Axios error
   * @returns True if we should retry, false otherwise
   */
  private _shouldRetry(error: any): boolean {
    // Retry on network errors
    if (!error.response) {
      return true;
    }
    
    // Retry on 5xx errors
    if (error.response.status >= 500) {
      return true;
    }
    
    // Retry on rate limiting
    if (error.response.status === 429) {
      return true;
    }
    
    // Don't retry on other errors
    return false;
  }
}
