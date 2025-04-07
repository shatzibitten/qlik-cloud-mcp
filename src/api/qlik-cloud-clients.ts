import { BaseResourceClient } from './resource-client';

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  created: string;
  lastUpdated: string;
  roles: string[];
}

/**
 * User client class
 * Implements resource client for users
 */
export class UserClient extends BaseResourceClient<User> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/users', authType);
  }
  
  /**
   * Get current user
   * @returns Promise resolving to the current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/me`
    }, this.authType);
    
    return response.body;
  }
  
  /**
   * Invite a user
   * @param email User email
   * @param name User name
   * @param roles User roles
   * @returns Promise resolving to the invited user
   */
  async inviteUser(email: string, name: string, roles: string[]): Promise<User> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/invite`,
      body: {
        email,
        name,
        roles
      }
    }, this.authType);
    
    return response.body;
  }
}

/**
 * Space interface
 */
export interface Space {
  id: string;
  name: string;
  description?: string;
  type: 'shared' | 'personal' | 'managed';
  ownerId: string;
  created: string;
  modified: string;
}

/**
 * Space client class
 * Implements resource client for spaces
 */
export class SpaceClient extends BaseResourceClient<Space> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/spaces', authType);
  }
  
  /**
   * Get space members
   * @param id Space ID
   * @returns Promise resolving to space members
   */
  async getMembers(id: string): Promise<any[]> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}/members`
    }, this.authType);
    
    return response.body.data || [];
  }
  
  /**
   * Add member to space
   * @param id Space ID
   * @param userId User ID
   * @param roles Roles
   * @returns Promise resolving when member is added
   */
  async addMember(id: string, userId: string, roles: string[]): Promise<void> {
    await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/members`,
      body: {
        userId,
        roles
      }
    }, this.authType);
  }
  
  /**
   * Remove member from space
   * @param id Space ID
   * @param userId User ID
   * @returns Promise resolving when member is removed
   */
  async removeMember(id: string, userId: string): Promise<void> {
    await this.apiClient.request({
      method: 'DELETE',
      path: `${this.basePath}/${id}/members/${userId}`
    }, this.authType);
  }
}

/**
 * Data connection interface
 */
export interface DataConnection {
  id: string;
  name: string;
  type: string;
  connectionString: string;
  qConnectStatement: string;
  created: string;
  lastUpdated: string;
  ownerId: string;
}

/**
 * Data connection client class
 * Implements resource client for data connections
 */
export class DataConnectionClient extends BaseResourceClient<DataConnection> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/data-connections', authType);
  }
  
  /**
   * Test a data connection
   * @param id Data connection ID
   * @returns Promise resolving to test result
   */
  async testConnection(id: string): Promise<any> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/test`
    }, this.authType);
    
    return response.body;
  }
}

/**
 * Extension interface
 */
export interface Extension {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  created: string;
  modified: string;
}

/**
 * Extension client class
 * Implements resource client for extensions
 */
export class ExtensionClient extends BaseResourceClient<Extension> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/extensions', authType);
  }
  
  /**
   * Upload an extension
   * @param file Extension file (base64 encoded)
   * @param overwrite Whether to overwrite existing extension
   * @returns Promise resolving to the uploaded extension
   */
  async uploadExtension(file: string, overwrite: boolean = false): Promise<Extension> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: this.basePath,
      query: {
        overwrite: overwrite.toString()
      },
      body: {
        file
      }
    }, this.authType);
    
    return response.body;
  }
}

/**
 * Theme interface
 */
export interface Theme {
  id: string;
  name: string;
  description?: string;
  created: string;
  modified: string;
  ownerId: string;
}

/**
 * Theme client class
 * Implements resource client for themes
 */
export class ThemeClient extends BaseResourceClient<Theme> {
  /**
   * Constructor
   * @param apiClient API client
   * @param authType Authentication type to use
   */
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/themes', authType);
  }
  
  /**
   * Apply a theme to an app
   * @param id Theme ID
   * @param appId App ID
   * @returns Promise resolving when theme is applied
   */
  async applyToApp(id: string, appId: string): Promise<void> {
    await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/apply`,
      body: {
        appId
      }
    }, this.authType);
  }
}
