import { QlikCloudAPIClient, QlikCloudAPIClientConfig } from './qlik-cloud-api-client';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';

/**
 * Interface for Qlik Cloud data connection
 */
export interface QlikCloudDataConnection {
  id: string;
  name: string;
  description?: string;
  type: string;
  createdDate: string;
  modifiedDate: string;
  owner: {
    id: string;
    name: string;
  };
  connectionString?: string;
  username?: string;
  qlikUsername?: string;
}

/**
 * Interface for Qlik Cloud extension
 */
export interface QlikCloudExtension {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdDate: string;
  modifiedDate: string;
  owner: {
    id: string;
    name: string;
  };
}

/**
 * QlikCloudDataConnectionClient class for interacting with Qlik Cloud data connection APIs
 * 
 * This class provides methods for working with data connections in Qlik Cloud,
 * which are essential for model context operations.
 */
export class QlikCloudDataConnectionClient {
  private _apiClient: QlikCloudAPIClient;
  private _logger: LogManager;

  /**
   * Creates a new QlikCloudDataConnectionClient instance
   * 
   * @param apiClient - Qlik Cloud API client
   * @param logger - Logger
   */
  constructor(
    apiClient: QlikCloudAPIClient,
    logger: LogManager
  ) {
    this._apiClient = apiClient;
    this._logger = logger;
  }

  /**
   * Get all data connections
   * 
   * @returns Promise that resolves with an array of data connections
   */
  async getDataConnections(): Promise<QlikCloudDataConnection[]> {
    try {
      const response = await this._apiClient.get<{ data: QlikCloudDataConnection[] }>('/data-connections');
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get data connections', { error });
      throw error;
    }
  }

  /**
   * Get a data connection by ID
   * 
   * @param connectionId - ID of the data connection to get
   * @returns Promise that resolves with the data connection
   */
  async getDataConnection(connectionId: string): Promise<QlikCloudDataConnection> {
    try {
      const response = await this._apiClient.get<QlikCloudDataConnection>(`/data-connections/${connectionId}`);
      return response;
    } catch (error) {
      this._logger.error('Failed to get data connection', { connectionId, error });
      throw error;
    }
  }

  /**
   * Create a data connection
   * 
   * @param connection - Data connection to create
   * @returns Promise that resolves with the created data connection
   */
  async createDataConnection(connection: Partial<QlikCloudDataConnection>): Promise<QlikCloudDataConnection> {
    try {
      const response = await this._apiClient.post<QlikCloudDataConnection>('/data-connections', connection);
      return response;
    } catch (error) {
      this._logger.error('Failed to create data connection', { error });
      throw error;
    }
  }

  /**
   * Update a data connection
   * 
   * @param connectionId - ID of the data connection to update
   * @param connection - Updated data connection
   * @returns Promise that resolves with the updated data connection
   */
  async updateDataConnection(connectionId: string, connection: Partial<QlikCloudDataConnection>): Promise<QlikCloudDataConnection> {
    try {
      const response = await this._apiClient.put<QlikCloudDataConnection>(`/data-connections/${connectionId}`, connection);
      return response;
    } catch (error) {
      this._logger.error('Failed to update data connection', { connectionId, error });
      throw error;
    }
  }

  /**
   * Delete a data connection
   * 
   * @param connectionId - ID of the data connection to delete
   * @returns Promise that resolves when the data connection is deleted
   */
  async deleteDataConnection(connectionId: string): Promise<void> {
    try {
      await this._apiClient.delete(`/data-connections/${connectionId}`);
    } catch (error) {
      this._logger.error('Failed to delete data connection', { connectionId, error });
      throw error;
    }
  }
}

/**
 * QlikCloudExtensionClient class for interacting with Qlik Cloud extension APIs
 * 
 * This class provides methods for working with extensions in Qlik Cloud,
 * which can be used to extend model context functionality.
 */
export class QlikCloudExtensionClient {
  private _apiClient: QlikCloudAPIClient;
  private _logger: LogManager;

  /**
   * Creates a new QlikCloudExtensionClient instance
   * 
   * @param apiClient - Qlik Cloud API client
   * @param logger - Logger
   */
  constructor(
    apiClient: QlikCloudAPIClient,
    logger: LogManager
  ) {
    this._apiClient = apiClient;
    this._logger = logger;
  }

  /**
   * Get all extensions
   * 
   * @returns Promise that resolves with an array of extensions
   */
  async getExtensions(): Promise<QlikCloudExtension[]> {
    try {
      const response = await this._apiClient.get<{ data: QlikCloudExtension[] }>('/extensions');
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get extensions', { error });
      throw error;
    }
  }

  /**
   * Get an extension by ID
   * 
   * @param extensionId - ID of the extension to get
   * @returns Promise that resolves with the extension
   */
  async getExtension(extensionId: string): Promise<QlikCloudExtension> {
    try {
      const response = await this._apiClient.get<QlikCloudExtension>(`/extensions/${extensionId}`);
      return response;
    } catch (error) {
      this._logger.error('Failed to get extension', { extensionId, error });
      throw error;
    }
  }
}

/**
 * QlikCloudThemeClient class for interacting with Qlik Cloud theme APIs
 * 
 * This class provides methods for working with themes in Qlik Cloud,
 * which can be used to customize the appearance of model visualizations.
 */
export class QlikCloudThemeClient {
  private _apiClient: QlikCloudAPIClient;
  private _logger: LogManager;

  /**
   * Creates a new QlikCloudThemeClient instance
   * 
   * @param apiClient - Qlik Cloud API client
   * @param logger - Logger
   */
  constructor(
    apiClient: QlikCloudAPIClient,
    logger: LogManager
  ) {
    this._apiClient = apiClient;
    this._logger = logger;
  }

  /**
   * Get all themes
   * 
   * @returns Promise that resolves with an array of themes
   */
  async getThemes(): Promise<any[]> {
    try {
      const response = await this._apiClient.get<{ data: any[] }>('/themes');
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get themes', { error });
      throw error;
    }
  }

  /**
   * Get a theme by ID
   * 
   * @param themeId - ID of the theme to get
   * @returns Promise that resolves with the theme
   */
  async getTheme(themeId: string): Promise<any> {
    try {
      const response = await this._apiClient.get<any>(`/themes/${themeId}`);
      return response;
    } catch (error) {
      this._logger.error('Failed to get theme', { themeId, error });
      throw error;
    }
  }
}

/**
 * Extended factory function to create all Qlik Cloud API clients
 * 
 * @param config - Configuration for the API client
 * @param authManager - Authentication manager
 * @param logger - Logger
 * @returns Object containing all API clients
 */
export function createAllQlikCloudAPIClients(
  config: QlikCloudAPIClientConfig,
  authManager: AuthManager,
  logger: LogManager
) {
  // Create base API client
  const apiClient = new QlikCloudAPIClient(config, authManager, logger);
  
  // Create specialized clients
  const appClient = new QlikCloudAppClient(apiClient, logger);
  const spaceClient = new QlikCloudSpaceClient(apiClient, logger);
  const dataConnectionClient = new QlikCloudDataConnectionClient(apiClient, logger);
  const extensionClient = new QlikCloudExtensionClient(apiClient, logger);
  const themeClient = new QlikCloudThemeClient(apiClient, logger);
  
  return {
    apiClient,
    appClient,
    spaceClient,
    dataConnectionClient,
    extensionClient,
    themeClient
  };
}

// Re-export types and clients from the previous file
export * from './qlik-cloud-clients';
