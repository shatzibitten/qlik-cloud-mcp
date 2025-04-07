import { BaseResourceClient } from './resource-client';

/**
 * Content interface
 */
export interface Content {
  id: string;
  name: string;
  description?: string;
  resourceType: string;
  resourceId: string;
  resourceAttributes: Record<string, any>;
  resourceCreatedAt: string;
  resourceUpdatedAt: string;
  owner: {
    id: string;
    name: string;
    userId: string;
  };
  links: {
    self: {
      href: string;
    };
  };
}

/**
 * Content client class
 * Implements resource client for content
 */
export class ContentClient extends BaseResourceClient<Content> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/items', authType);
  }
  
  /**
   * Search content
   * @param query Search query
   * @returns Promise resolving to matching content
   */
  async search(query: Record<string, any>): Promise<Content[]> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/search`,
      body: query
    }, this.authType);
    
    return response.body.data || [];
  }
  
  /**
   * Get content by resource type
   * @param resourceType Resource type
   * @param params Query parameters
   * @returns Promise resolving to matching content
   */
  async getByResourceType(resourceType: string, params?: Record<string, string>): Promise<Content[]> {
    const query = {
      ...params,
      resourceType
    };
    
    const response = await this.apiClient.request({
      method: 'GET',
      path: this.basePath,
      query
    }, this.authType);
    
    return response.body.data || [];
  }
}

/**
 * Collection interface
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  ownerId: string;
  created: string;
  updated: string;
  itemCount: number;
}

/**
 * Collection client class
 * Implements resource client for collections
 */
export class CollectionClient extends BaseResourceClient<Collection> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/collections', authType);
  }
  
  /**
   * Get collection items
   * @param id Collection ID
   * @param params Query parameters
   * @returns Promise resolving to collection items
   */
  async getItems(id: string, params?: Record<string, string>): Promise<any[]> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}/items`,
      query: params
    }, this.authType);
    
    return response.body.data || [];
  }
  
  /**
   * Add item to collection
   * @param id Collection ID
   * @param itemId Item ID
   * @returns Promise resolving when item is added
   */
  async addItem(id: string, itemId: string): Promise<void> {
    await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/items`,
      body: {
        id: itemId
      }
    }, this.authType);
  }
  
  /**
   * Remove item from collection
   * @param id Collection ID
   * @param itemId Item ID
   * @returns Promise resolving when item is removed
   */
  async removeItem(id: string, itemId: string): Promise<void> {
    await this.apiClient.request({
      method: 'DELETE',
      path: `${this.basePath}/${id}/items/${itemId}`
    }, this.authType);
  }
}

/**
 * Report interface
 */
export interface Report {
  id: string;
  title: string;
  description?: string;
  created: string;
  lastUpdated: string;
  ownerId: string;
  status: 'active' | 'inactive' | 'draft';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    timeZone: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
}

/**
 * Report client class
 * Implements resource client for reports
 */
export class ReportClient extends BaseResourceClient<Report> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/reports', authType);
  }
  
  /**
   * Generate a report
   * @param id Report ID
   * @returns Promise resolving to the generated report
   */
  async generate(id: string): Promise<any> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/generate`
    }, this.authType);
    
    return response.body;
  }
  
  /**
   * Get report executions
   * @param id Report ID
   * @param params Query parameters
   * @returns Promise resolving to report executions
   */
  async getExecutions(id: string, params?: Record<string, string>): Promise<any[]> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}/executions`,
      query: params
    }, this.authType);
    
    return response.body.data || [];
  }
}

/**
 * Automation interface
 */
export interface Automation {
  id: string;
  name: string;
  description?: string;
  created: string;
  lastUpdated: string;
  ownerId: string;
  status: 'active' | 'inactive' | 'draft';
  triggers: Array<{
    type: 'schedule' | 'event';
    config: Record<string, any>;
  }>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
}

/**
 * Automation client class
 * Implements resource client for automations
 */
export class AutomationClient extends BaseResourceClient<Automation> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/automations', authType);
  }
  
  /**
   * Trigger an automation
   * @param id Automation ID
   * @returns Promise resolving when automation is triggered
   */
  async trigger(id: string): Promise<void> {
    await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/trigger`
    }, this.authType);
  }
  
  /**
   * Get automation executions
   * @param id Automation ID
   * @param params Query parameters
   * @returns Promise resolving to automation executions
   */
  async getExecutions(id: string, params?: Record<string, string>): Promise<any[]> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}/executions`,
      query: params
    }, this.authType);
    
    return response.body.data || [];
  }
}
