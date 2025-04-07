import { APIManager } from './api-manager';
import { 
  User, UserClient,
  Space, SpaceClient,
  DataConnection, DataConnectionClient,
  Extension, ExtensionClient,
  Theme, ThemeClient
} from './qlik-cloud-clients';

/**
 * Qlik Cloud API Manager class
 * Extends the base API Manager with Qlik Cloud specific clients
 */
export class QlikCloudAPIManager extends APIManager {
  /**
   * Get a user client
   * @param authType The authentication type to use
   * @returns The user client
   */
  getUserClient(authType: string): UserClient {
    return this.getClient<User>('users', authType) as UserClient;
  }
  
  /**
   * Get a space client
   * @param authType The authentication type to use
   * @returns The space client
   */
  getSpaceClient(authType: string): SpaceClient {
    return this.getClient<Space>('spaces', authType) as SpaceClient;
  }
  
  /**
   * Get a data connection client
   * @param authType The authentication type to use
   * @returns The data connection client
   */
  getDataConnectionClient(authType: string): DataConnectionClient {
    return this.getClient<DataConnection>('data-connections', authType) as DataConnectionClient;
  }
  
  /**
   * Get an extension client
   * @param authType The authentication type to use
   * @returns The extension client
   */
  getExtensionClient(authType: string): ExtensionClient {
    return this.getClient<Extension>('extensions', authType) as ExtensionClient;
  }
  
  /**
   * Get a theme client
   * @param authType The authentication type to use
   * @returns The theme client
   */
  getThemeClient(authType: string): ThemeClient {
    return this.getClient<Theme>('themes', authType) as ThemeClient;
  }
  
  /**
   * Create a new client for a resource type
   * @param resourceType The resource type
   * @param authType The authentication type to use
   * @returns The created client
   */
  protected createClient(resourceType: string, authType: string): any {
    // First try to create a client using the parent method
    try {
      return super.createClient(resourceType, authType);
    } catch (error) {
      // If the parent method fails, try to create a Qlik Cloud specific client
      switch (resourceType) {
        case 'users':
          return new UserClient(this.apiClient, authType);
        case 'spaces':
          return new SpaceClient(this.apiClient, authType);
        case 'data-connections':
          return new DataConnectionClient(this.apiClient, authType);
        case 'extensions':
          return new ExtensionClient(this.apiClient, authType);
        case 'themes':
          return new ThemeClient(this.apiClient, authType);
        default:
          throw new Error(`Unsupported resource type: ${resourceType}`);
      }
    }
  }
}
