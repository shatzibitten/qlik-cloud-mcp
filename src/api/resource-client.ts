import { APIClient } from './api-client';
import { APIRequest, APIResponse, APIError } from './types';

/**
 * Resource client interface
 * Defines the contract for resource-specific clients
 */
export interface ResourceClient<T> {
  /**
   * Get all resources
   * @param params Query parameters
   * @returns Promise resolving to an array of resources
   */
  getAll(params?: Record<string, string>): Promise<T[]>;
  
  /**
   * Get a resource by ID
   * @param id The resource ID
   * @returns Promise resolving to the resource
   */
  getById(id: string): Promise<T>;
  
  /**
   * Create a new resource
   * @param data The resource data
   * @returns Promise resolving to the created resource
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update a resource
   * @param id The resource ID
   * @param data The resource data
   * @returns Promise resolving to the updated resource
   */
  update(id: string, data: Partial<T>): Promise<T>;
  
  /**
   * Delete a resource
   * @param id The resource ID
   * @returns Promise resolving when the resource is deleted
   */
  delete(id: string): Promise<void>;
}

/**
 * Base resource client class
 * Provides a base implementation of the ResourceClient interface
 */
export abstract class BaseResourceClient<T> implements ResourceClient<T> {
  protected apiClient: APIClient;
  protected basePath: string;
  protected authType: string;
  
  /**
   * Constructor
   * @param apiClient API client
   * @param basePath Base path for the resource
   * @param authType Authentication type to use
   */
  constructor(apiClient: APIClient, basePath: string, authType: string) {
    this.apiClient = apiClient;
    this.basePath = basePath;
    this.authType = authType;
  }
  
  /**
   * Get all resources
   * @param params Query parameters
   * @returns Promise resolving to an array of resources
   */
  async getAll(params?: Record<string, string>): Promise<T[]> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: this.basePath,
      query: params
    }, this.authType);
    
    // Handle different response formats
    if (Array.isArray(response.body)) {
      return response.body;
    } else if (response.body.data && Array.isArray(response.body.data)) {
      return response.body.data;
    } else {
      return [];
    }
  }
  
  /**
   * Get a resource by ID
   * @param id The resource ID
   * @returns Promise resolving to the resource
   */
  async getById(id: string): Promise<T> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}`
    }, this.authType);
    
    return response.body;
  }
  
  /**
   * Create a new resource
   * @param data The resource data
   * @returns Promise resolving to the created resource
   */
  async create(data: Partial<T>): Promise<T> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: this.basePath,
      body: data
    }, this.authType);
    
    return response.body;
  }
  
  /**
   * Update a resource
   * @param id The resource ID
   * @param data The resource data
   * @returns Promise resolving to the updated resource
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const response = await this.apiClient.request({
      method: 'PATCH',
      path: `${this.basePath}/${id}`,
      body: data
    }, this.authType);
    
    return response.body;
  }
  
  /**
   * Delete a resource
   * @param id The resource ID
   * @returns Promise resolving when the resource is deleted
   */
  async delete(id: string): Promise<void> {
    await this.apiClient.request({
      method: 'DELETE',
      path: `${this.basePath}/${id}`
    }, this.authType);
  }
  
  /**
   * Build query string from parameters
   * @param params Query parameters
   * @returns Formatted query string
   */
  protected buildQueryString(params: Record<string, string>): string {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    }
    return queryParams.toString() ? `?${queryParams.toString()}` : '';
  }
}
