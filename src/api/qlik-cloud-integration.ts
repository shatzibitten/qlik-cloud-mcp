import { QlikCloudAPIClient, QlikCloudAPIClientConfig } from './qlik-cloud-api-client';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';
import { ModelContextManager } from '../model/model-context-manager';
import { ConfigManager } from '../config/config-manager';
import { createAllQlikCloudAPIClients } from './qlik-cloud-clients-additional';

/**
 * QlikCloudModelContextIntegration class for integrating Qlik Cloud APIs with the Model Context Protocol
 * 
 * This class connects the Model Context Protocol server with Qlik Cloud APIs,
 * providing methods for retrieving and managing model context resources.
 */
export class QlikCloudModelContextIntegration {
  private _contextManager: ModelContextManager;
  private _authManager: AuthManager;
  private _logger: LogManager;
  private _config: ConfigManager;
  private _clients: ReturnType<typeof createAllQlikCloudAPIClients>;

  /**
   * Creates a new QlikCloudModelContextIntegration instance
   * 
   * @param contextManager - Model context manager
   * @param authManager - Authentication manager
   * @param logger - Logger
   * @param config - Configuration manager
   */
  constructor(
    contextManager: ModelContextManager,
    authManager: AuthManager,
    logger: LogManager,
    config: ConfigManager
  ) {
    this._contextManager = contextManager;
    this._authManager = authManager;
    this._logger = logger;
    this._config = config;
    
    // Create API clients
    this._clients = createAllQlikCloudAPIClients(
      {
        baseUrl: this._config.get('qlikCloud.baseUrl'),
        tenantId: this._config.get('qlikCloud.tenantId'),
        authType: this._config.get('qlikCloud.authType', 'oauth2'),
        timeout: this._config.get('qlikCloud.timeout', 30000),
        retryAttempts: this._config.get('qlikCloud.retryAttempts', 3),
        retryDelay: this._config.get('qlikCloud.retryDelay', 1000)
      },
      authManager,
      logger
    );
    
    // Set up event handlers
    this._setupEventHandlers();
  }

  /**
   * Get the API clients
   */
  get clients() {
    return this._clients;
  }

  /**
   * Initialize a model context with Qlik Cloud app data
   * 
   * @param contextId - ID of the context to initialize
   * @param appId - ID of the Qlik Cloud app
   * @returns Promise that resolves when the context is initialized
   */
  async initializeContextWithApp(contextId: string, appId: string): Promise<void> {
    try {
      // Get the context
      const context = this._contextManager.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }
      
      // Get the app
      const app = await this._clients.appClient.getApp(appId);
      
      if (!app) {
        throw new Error(`App not found: ${appId}`);
      }
      
      // Connect to the app if not already connected
      if (!context.isConnected) {
        await context.connect();
      }
      
      // Get app metadata
      const metadata = await this._clients.appClient.getAppMetadata(appId);
      
      // Get app variables
      const variables = await this._clients.appClient.getAppVariables(appId);
      
      // Get app dimensions
      const dimensions = await this._clients.appClient.getAppDimensions(appId);
      
      // Get app measures
      const measures = await this._clients.appClient.getAppMeasures(appId);
      
      // Store app information in context
      context.setMetadata('app', {
        id: app.id,
        name: app.name,
        description: app.description,
        lastReloadTime: app.lastReloadTime,
        createdDate: app.createdDate,
        modifiedDate: app.modifiedDate,
        owner: app.owner,
        spaceId: app.spaceId
      });
      
      context.setMetadata('appMetadata', metadata);
      context.setMetadata('appVariables', variables);
      context.setMetadata('appDimensions', dimensions);
      context.setMetadata('appMeasures', measures);
      
      this._logger.info('Context initialized with app data', { contextId, appId });
    } catch (error) {
      this._logger.error('Failed to initialize context with app', { contextId, appId, error });
      throw error;
    }
  }

  /**
   * Synchronize model context state with Qlik Cloud app
   * 
   * @param contextId - ID of the context to synchronize
   * @returns Promise that resolves when the context is synchronized
   */
  async synchronizeContextWithApp(contextId: string): Promise<void> {
    try {
      // Get the context
      const context = this._contextManager.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }
      
      // Get app ID from context metadata
      const appMetadata = context.getMetadata('app');
      
      if (!appMetadata || !appMetadata.id) {
        throw new Error(`App metadata not found in context: ${contextId}`);
      }
      
      const appId = appMetadata.id;
      
      // Get the app
      const app = await this._clients.appClient.getApp(appId);
      
      if (!app) {
        throw new Error(`App not found: ${appId}`);
      }
      
      // Check if app has been modified since last synchronization
      if (appMetadata.modifiedDate === app.modifiedDate) {
        this._logger.info('App has not been modified, skipping synchronization', { contextId, appId });
        return;
      }
      
      // Connect to the app if not already connected
      if (!context.isConnected) {
        await context.connect();
      }
      
      // Get updated app metadata
      const metadata = await this._clients.appClient.getAppMetadata(appId);
      
      // Get updated app variables
      const variables = await this._clients.appClient.getAppVariables(appId);
      
      // Get updated app dimensions
      const dimensions = await this._clients.appClient.getAppDimensions(appId);
      
      // Get updated app measures
      const measures = await this._clients.appClient.getAppMeasures(appId);
      
      // Update app information in context
      context.setMetadata('app', {
        id: app.id,
        name: app.name,
        description: app.description,
        lastReloadTime: app.lastReloadTime,
        createdDate: app.createdDate,
        modifiedDate: app.modifiedDate,
        owner: app.owner,
        spaceId: app.spaceId
      });
      
      context.setMetadata('appMetadata', metadata);
      context.setMetadata('appVariables', variables);
      context.setMetadata('appDimensions', dimensions);
      context.setMetadata('appMeasures', measures);
      
      // Save the current state
      await context.saveState(`Auto-sync ${new Date().toISOString()}`);
      
      this._logger.info('Context synchronized with app', { contextId, appId });
    } catch (error) {
      this._logger.error('Failed to synchronize context with app', { contextId, error });
      throw error;
    }
  }

  /**
   * Get data connections for a model context
   * 
   * @param contextId - ID of the context to get data connections for
   * @returns Promise that resolves with the data connections
   */
  async getContextDataConnections(contextId: string): Promise<any[]> {
    try {
      // Get the context
      const context = this._contextManager.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }
      
      // Get app ID from context metadata
      const appMetadata = context.getMetadata('app');
      
      if (!appMetadata || !appMetadata.id) {
        throw new Error(`App metadata not found in context: ${contextId}`);
      }
      
      // Get all data connections
      const connections = await this._clients.dataConnectionClient.getDataConnections();
      
      // Store data connections in context metadata
      context.setMetadata('dataConnections', connections);
      
      return connections;
    } catch (error) {
      this._logger.error('Failed to get context data connections', { contextId, error });
      throw error;
    }
  }

  /**
   * Reload app for a model context
   * 
   * @param contextId - ID of the context to reload app for
   * @returns Promise that resolves when the app is reloaded
   */
  async reloadContextApp(contextId: string): Promise<void> {
    try {
      // Get the context
      const context = this._contextManager.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }
      
      // Get app ID from context metadata
      const appMetadata = context.getMetadata('app');
      
      if (!appMetadata || !appMetadata.id) {
        throw new Error(`App metadata not found in context: ${contextId}`);
      }
      
      const appId = appMetadata.id;
      
      // Reload the app
      await this._clients.appClient.reloadApp(appId);
      
      // Synchronize context with app
      await this.synchronizeContextWithApp(contextId);
      
      this._logger.info('App reloaded for context', { contextId, appId });
    } catch (error) {
      this._logger.error('Failed to reload app for context', { contextId, error });
      throw error;
    }
  }

  /**
   * Set up event handlers
   */
  private _setupEventHandlers(): void {
    // Listen for context created events
    this._contextManager.on('context-created', async (data: any) => {
      const contextId = data.contextId;
      const context = this._contextManager.getContext(contextId);
      
      if (!context) {
        return;
      }
      
      // Get app ID from context config
      const appId = context.config.appId;
      
      if (!appId) {
        return;
      }
      
      try {
        // Initialize context with app data
        await this.initializeContextWithApp(contextId, appId);
      } catch (error) {
        this._logger.error('Failed to initialize context with app on creation', { contextId, appId, error });
      }
    });
    
    // Listen for context connected events
    this._contextManager.on('context:connected', async (data: any) => {
      const contextId = data.contextId;
      const context = this._contextManager.getContext(contextId);
      
      if (!context) {
        return;
      }
      
      // Get app metadata
      const appMetadata = context.getMetadata('app');
      
      if (!appMetadata || !appMetadata.id) {
        return;
      }
      
      try {
        // Synchronize context with app
        await this.synchronizeContextWithApp(contextId);
      } catch (error) {
        this._logger.error('Failed to synchronize context with app on connection', { contextId, error });
      }
    });
  }
}
