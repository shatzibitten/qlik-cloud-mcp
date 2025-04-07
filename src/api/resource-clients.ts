import { BaseResourceClient } from './resource-client';

/**
 * API key interface
 */
export interface APIKey {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  createdByUser: string;
  expiresAt?: string;
  lastUsedAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

/**
 * API key client class
 * Implements resource client for API keys
 */
export class APIKeyClient extends BaseResourceClient<APIKey> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/api-keys', authType);
  }
  
  /**
   * Revoke an API key
   * @param id The API key ID
   * @returns Promise resolving when the API key is revoked
   */
  async revoke(id: string): Promise<void> {
    await this.update(id, { status: 'revoked' as const });
  }
}

/**
 * App interface
 */
export interface App {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  lastReloadTime?: string;
  createdDate: string;
  modifiedDate: string;
  owner: string;
  published: boolean;
}

/**
 * App client class
 * Implements resource client for apps
 */
export class AppClient extends BaseResourceClient<App> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/apps', authType);
  }
  
  /**
   * Get app metadata
   * @param id The app ID
   * @returns Promise resolving to the app metadata
   */
  async getMetadata(id: string): Promise<Record<string, any>> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}/metadata`
    }, this.authType);
    
    return response.body;
  }
  
  /**
   * Reload an app
   * @param id The app ID
   * @returns Promise resolving when the app is reloaded
   */
  async reload(id: string): Promise<void> {
    await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/reload`
    }, this.authType);
  }
}

/**
 * Audit interface
 */
export interface Audit {
  id: string;
  timestamp: string;
  action: string;
  objectType: string;
  objectId: string;
  userId: string;
  userType: string;
  tenantId: string;
  details: Record<string, any>;
}

/**
 * Audit client class
 * Implements resource client for audits
 */
export class AuditClient extends BaseResourceClient<Audit> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/audits', authType);
  }
  
  /**
   * Search audits
   * @param query The search query
   * @returns Promise resolving to matching audits
   */
  async search(query: Record<string, any>): Promise<Audit[]> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/search`,
      body: query
    }, this.authType);
    
    return response.body.data || [];
  }
}
