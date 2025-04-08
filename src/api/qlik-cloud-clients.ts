import { QlikCloudAPIClient, QlikCloudAPIClientConfig } from './qlik-cloud-api-client';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';

/**
 * Interface for Qlik Cloud app
 */
export interface QlikCloudApp {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  lastReloadTime?: string;
  createdDate: string;
  modifiedDate: string;
  owner: {
    id: string;
    name: string;
  };
  spaceId?: string;
}

/**
 * Interface for Qlik Cloud space
 */
export interface QlikCloudSpace {
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
}

/**
 * QlikCloudAppClient class for interacting with Qlik Cloud app APIs
 * 
 * This class provides methods for working with Qlik Sense apps in Qlik Cloud,
 * including listing, retrieving, and managing apps.
 */
export class QlikCloudAppClient {
  private _apiClient: QlikCloudAPIClient;
  private _logger: LogManager;

  /**
   * Creates a new QlikCloudAppClient instance
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
   * Get all apps
   * 
   * @returns Promise that resolves with an array of apps
   */
  async getApps(): Promise<QlikCloudApp[]> {
    try {
      const response = await this._apiClient.get<{ data: QlikCloudApp[] }>('/items?resourceType=app');
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get apps', { error });
      throw error;
    }
  }

  /**
   * Get an app by ID
   * 
   * @param appId - ID of the app to get
   * @returns Promise that resolves with the app
   */
  async getApp(appId: string): Promise<QlikCloudApp> {
    try {
      const response = await this._apiClient.get<QlikCloudApp>(`/apps/${appId}`);
      return response;
    } catch (error) {
      this._logger.error('Failed to get app', { appId, error });
      throw error;
    }
  }

  /**
   * Get app metadata
   * 
   * @param appId - ID of the app to get metadata for
   * @returns Promise that resolves with the app metadata
   */
  async getAppMetadata(appId: string): Promise<any> {
    try {
      const response = await this._apiClient.get<any>(`/apps/${appId}/metadata`);
      return response;
    } catch (error) {
      this._logger.error('Failed to get app metadata', { appId, error });
      throw error;
    }
  }

  /**
   * Get app script
   * 
   * @param appId - ID of the app to get script for
   * @returns Promise that resolves with the app script
   */
  async getAppScript(appId: string): Promise<string> {
    try {
      const response = await this._apiClient.get<{ script: string }>(`/apps/${appId}/script`);
      return response.script;
    } catch (error) {
      this._logger.error('Failed to get app script', { appId, error });
      throw error;
    }
  }

  /**
   * Get app variables
   * 
   * @param appId - ID of the app to get variables for
   * @returns Promise that resolves with the app variables
   */
  async getAppVariables(appId: string): Promise<any[]> {
    try {
      const response = await this._apiClient.get<{ data: any[] }>(`/apps/${appId}/variables`);
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get app variables', { appId, error });
      throw error;
    }
  }

  /**
   * Get app dimensions
   * 
   * @param appId - ID of the app to get dimensions for
   * @returns Promise that resolves with the app dimensions
   */
  async getAppDimensions(appId: string): Promise<any[]> {
    try {
      const response = await this._apiClient.get<{ data: any[] }>(`/apps/${appId}/dimensions`);
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get app dimensions', { appId, error });
      throw error;
    }
  }

  /**
   * Get app measures
   * 
   * @param appId - ID of the app to get measures for
   * @returns Promise that resolves with the app measures
   */
  async getAppMeasures(appId: string): Promise<any[]> {
    try {
      const response = await this._apiClient.get<{ data: any[] }>(`/apps/${appId}/measures`);
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get app measures', { appId, error });
      throw error;
    }
  }

  /**
   * Get app sheets
   * 
   * @param appId - ID of the app to get sheets for
   * @returns Promise that resolves with the app sheets
   */
  async getAppSheets(appId: string): Promise<any[]> {
    try {
      const response = await this._apiClient.get<{ data: any[] }>(`/apps/${appId}/sheets`);
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get app sheets', { appId, error });
      throw error;
    }
  }

  /**
   * Get app objects
   * 
   * @param appId - ID of the app to get objects for
   * @returns Promise that resolves with the app objects
   */
  async getAppObjects(appId: string): Promise<any[]> {
    try {
      const response = await this._apiClient.get<{ data: any[] }>(`/apps/${appId}/objects`);
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get app objects', { appId, error });
      throw error;
    }
  }

  /**
   * Get app bookmarks
   * 
   * @param appId - ID of the app to get bookmarks for
   * @returns Promise that resolves with the app bookmarks
   */
  async getAppBookmarks(appId: string): Promise<any[]> {
    try {
      const response = await this._apiClient.get<{ data: any[] }>(`/apps/${appId}/bookmarks`);
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get app bookmarks', { appId, error });
      throw error;
    }
  }

  /**
   * Reload an app
   * 
   * @param appId - ID of the app to reload
   * @returns Promise that resolves when the app is reloaded
   */
  async reloadApp(appId: string): Promise<any> {
    try {
      const response = await this._apiClient.post<any>(`/apps/${appId}/reload`);
      return response;
    } catch (error) {
      this._logger.error('Failed to reload app', { appId, error });
      throw error;
    }
  }
}

/**
 * QlikCloudSpaceClient class for interacting with Qlik Cloud space APIs
 * 
 * This class provides methods for working with spaces in Qlik Cloud,
 * including listing, retrieving, and managing spaces.
 */
export class QlikCloudSpaceClient {
  private _apiClient: QlikCloudAPIClient;
  private _logger: LogManager;

  /**
   * Creates a new QlikCloudSpaceClient instance
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
   * Get all spaces
   * 
   * @returns Promise that resolves with an array of spaces
   */
  async getSpaces(): Promise<QlikCloudSpace[]> {
    try {
      const response = await this._apiClient.get<{ data: QlikCloudSpace[] }>('/spaces');
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get spaces', { error });
      throw error;
    }
  }

  /**
   * Get a space by ID
   * 
   * @param spaceId - ID of the space to get
   * @returns Promise that resolves with the space
   */
  async getSpace(spaceId: string): Promise<QlikCloudSpace> {
    try {
      const response = await this._apiClient.get<QlikCloudSpace>(`/spaces/${spaceId}`);
      return response;
    } catch (error) {
      this._logger.error('Failed to get space', { spaceId, error });
      throw error;
    }
  }

  /**
   * Get apps in a space
   * 
   * @param spaceId - ID of the space to get apps for
   * @returns Promise that resolves with an array of apps
   */
  async getSpaceApps(spaceId: string): Promise<QlikCloudApp[]> {
    try {
      const response = await this._apiClient.get<{ data: QlikCloudApp[] }>(`/spaces/${spaceId}/apps`);
      return response.data || [];
    } catch (error) {
      this._logger.error('Failed to get space apps', { spaceId, error });
      throw error;
    }
  }
}

/**
 * Factory function to create Qlik Cloud API clients
 * 
 * @param config - Configuration for the API client
 * @param authManager - Authentication manager
 * @param logger - Logger
 * @returns Object containing API clients
 */
export function createQlikCloudAPIClients(
  config: QlikCloudAPIClientConfig,
  authManager: AuthManager,
  logger: LogManager
) {
  // Create base API client
  const apiClient = new QlikCloudAPIClient(config, authManager, logger);
  
  // Create specialized clients
  const appClient = new QlikCloudAppClient(apiClient, logger);
  const spaceClient = new QlikCloudSpaceClient(apiClient, logger);
  
  return {
    apiClient,
    appClient,
    spaceClient
  };
}
