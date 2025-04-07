import { AuthManager } from '../auth';
import { APIClient, APIClientConfig } from './api-client';
import { ResourceClient } from './resource-client';
import { APIKey, APIKeyClient, App, AppClient, Audit, AuditClient } from './resource-clients';

/**
 * API manager configuration interface
 */
export interface APIManagerConfig extends APIClientConfig {
  // Additional configuration options can be added here
}

/**
 * API manager class
 * Factory for creating and managing API clients
 */
export class APIManager {
  public apiClient: APIClient;
  private clients: Map<string, ResourceClient<any>>;
  
  /**
   * Constructor
   * @param baseUrl Base URL for the API
   * @param authManager Authentication manager
   * @param config Additional configuration options
   */
  constructor(baseUrl: string, authManager: AuthManager, config?: Partial<APIManagerConfig>) {
    this.apiClient = new APIClient(baseUrl, authManager, config);
    this.clients = new Map();
  }
  
  /**
   * Get an API client for a specific resource
   * @param resourceType The resource type
   * @param authType The authentication type to use
   * @returns The resource client
   */
  getClient<T>(resourceType: string, authType: string): ResourceClient<T> {
    const key = `${resourceType}:${authType}`;
    
    if (!this.clients.has(key)) {
      this.clients.set(key, this.createClient(resourceType, authType));
    }
    
    return this.clients.get(key) as ResourceClient<T>;
  }
  
  /**
   * Get an API key client
   * @param authType The authentication type to use
   * @returns The API key client
   */
  getAPIKeyClient(authType: string): APIKeyClient {
    return this.getClient<APIKey>('api-keys', authType) as APIKeyClient;
  }
  
  /**
   * Get an app client
   * @param authType The authentication type to use
   * @returns The app client
   */
  getAppClient(authType: string): AppClient {
    return this.getClient<App>('apps', authType) as AppClient;
  }
  
  /**
   * Get an audit client
   * @param authType The authentication type to use
   * @returns The audit client
   */
  getAuditClient(authType: string): AuditClient {
    return this.getClient<Audit>('audits', authType) as AuditClient;
  }
  
  /**
   * Create a new client for a resource type
   * @param resourceType The resource type
   * @param authType The authentication type to use
   * @returns The created client
   */
  private createClient(resourceType: string, authType: string): ResourceClient<any> {
    switch (resourceType) {
      case 'api-keys':
        return new APIKeyClient(this.apiClient, authType);
      case 'apps':
        return new AppClient(this.apiClient, authType);
      case 'audits':
        return new AuditClient(this.apiClient, authType);
      // Add more resource types as needed
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
  }
}
