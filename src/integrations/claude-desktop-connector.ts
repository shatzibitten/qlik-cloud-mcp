/**
 * Claude Desktop Connector
 * 
 * This module provides integration between the Qlik Cloud MCP server and Claude Desktop.
 * It implements the necessary functionality to allow Claude Desktop to use our MCP server
 * for accessing Qlik Cloud resources and functionality.
 * 
 * @module integrations/claude-desktop-connector
 */

import { Server } from '../server/server';
import { ModelContextManager } from '../model/model-context-manager';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';
import { ConfigManager } from '../config/config-manager';
import { QlikCloudModelContextIntegration } from '../api/qlik-cloud-integration';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration for the Claude Desktop connector
 */
export interface ClaudeDesktopConnectorConfig {
  /**
   * Name of the MCP server as it will appear in Claude Desktop
   */
  serverName: string;
  
  /**
   * Port to run the MCP server on
   */
  port: number;
  
  /**
   * Base URL for the Qlik Cloud tenant
   */
  qlikCloudBaseUrl: string;
  
  /**
   * Tenant ID for the Qlik Cloud tenant
   */
  qlikCloudTenantId: string;
  
  /**
   * Authentication type to use for Qlik Cloud
   */
  authType: 'oauth2' | 'jwt' | 'apikey';
  
  /**
   * Paths that Claude Desktop is allowed to access
   */
  allowedPaths?: string[];
}

/**
 * Claude Desktop Connector class
 * 
 * This class provides integration between the Qlik Cloud MCP server and Claude Desktop.
 */
export class ClaudeDesktopConnector {
  private _server: Server;
  private _contextManager: ModelContextManager;
  private _authManager: AuthManager;
  private _logger: LogManager;
  private _config: ConfigManager;
  private _qlikCloudIntegration: QlikCloudModelContextIntegration;
  private _connectorConfig: ClaudeDesktopConnectorConfig;
  
  /**
   * Creates a new Claude Desktop Connector
   * 
   * @param server - Server instance
   * @param contextManager - Model context manager
   * @param authManager - Authentication manager
   * @param logger - Logger
   * @param config - Configuration manager
   * @param qlikCloudIntegration - Qlik Cloud integration
   * @param connectorConfig - Connector configuration
   */
  constructor(
    server: Server,
    contextManager: ModelContextManager,
    authManager: AuthManager,
    logger: LogManager,
    config: ConfigManager,
    qlikCloudIntegration: QlikCloudModelContextIntegration,
    connectorConfig: ClaudeDesktopConnectorConfig
  ) {
    this._server = server;
    this._contextManager = contextManager;
    this._authManager = authManager;
    this._logger = logger;
    this._config = config;
    this._qlikCloudIntegration = qlikCloudIntegration;
    this._connectorConfig = connectorConfig;
    
    // Initialize the connector
    this._initialize();
  }
  
  /**
   * Initialize the connector
   */
  private _initialize(): void {
    this._logger.info('Initializing Claude Desktop connector', {
      serverName: this._connectorConfig.serverName,
      port: this._connectorConfig.port
    });
    
    // Register additional routes for Claude Desktop compatibility
    this._registerClaudeDesktopRoutes();
    
    // Set up event handlers
    this._setupEventHandlers();
  }
  
  /**
   * Register additional routes for Claude Desktop compatibility
   */
  private _registerClaudeDesktopRoutes(): void {
    // Register the MCP manifest endpoint
    this._server.app.get('/mcp-manifest.json', (req, res) => {
      const manifest = this._generateMCPManifest();
      res.json(manifest);
    });
    
    // Register the health check endpoint
    this._server.app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  }
  
  /**
   * Generate the MCP manifest for Claude Desktop
   */
  private _generateMCPManifest(): any {
    return {
      name: this._connectorConfig.serverName,
      version: '1.0.0',
      description: 'Qlik Cloud MCP Server for Claude Desktop',
      tools: [
        {
          name: 'qlik_get_app',
          description: 'Get a Qlik Cloud app by ID',
          parameters: {
            type: 'object',
            properties: {
              appId: {
                type: 'string',
                description: 'ID of the app to get'
              }
            },
            required: ['appId']
          }
        },
        {
          name: 'qlik_list_apps',
          description: 'List all Qlik Cloud apps',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'integer',
                description: 'Maximum number of apps to return'
              },
              offset: {
                type: 'integer',
                description: 'Offset for pagination'
              }
            }
          }
        },
        {
          name: 'qlik_create_model_context',
          description: 'Create a new model context for a Qlik Cloud app',
          parameters: {
            type: 'object',
            properties: {
              appId: {
                type: 'string',
                description: 'ID of the app to create a context for'
              },
              name: {
                type: 'string',
                description: 'Name of the context'
              },
              description: {
                type: 'string',
                description: 'Description of the context'
              }
            },
            required: ['appId', 'name']
          }
        },
        {
          name: 'qlik_get_model_context',
          description: 'Get a model context by ID',
          parameters: {
            type: 'object',
            properties: {
              contextId: {
                type: 'string',
                description: 'ID of the context to get'
              }
            },
            required: ['contextId']
          }
        },
        {
          name: 'qlik_list_model_contexts',
          description: 'List all model contexts',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'integer',
                description: 'Maximum number of contexts to return'
              },
              offset: {
                type: 'integer',
                description: 'Offset for pagination'
              }
            }
          }
        },
        {
          name: 'qlik_delete_model_context',
          description: 'Delete a model context',
          parameters: {
            type: 'object',
            properties: {
              contextId: {
                type: 'string',
                description: 'ID of the context to delete'
              }
            },
            required: ['contextId']
          }
        },
        {
          name: 'qlik_save_model_state',
          description: 'Save the current state of a model context',
          parameters: {
            type: 'object',
            properties: {
              contextId: {
                type: 'string',
                description: 'ID of the context to save state for'
              },
              name: {
                type: 'string',
                description: 'Name of the state'
              },
              description: {
                type: 'string',
                description: 'Description of the state'
              }
            },
            required: ['contextId', 'name']
          }
        },
        {
          name: 'qlik_restore_model_state',
          description: 'Restore a saved state of a model context',
          parameters: {
            type: 'object',
            properties: {
              contextId: {
                type: 'string',
                description: 'ID of the context to restore state for'
              },
              stateId: {
                type: 'string',
                description: 'ID of the state to restore'
              }
            },
            required: ['contextId', 'stateId']
          }
        }
      ]
    };
  }
  
  /**
   * Set up event handlers
   */
  private _setupEventHandlers(): void {
    // Listen for server started event
    this._server.on('server:started', () => {
      this._logger.info('Claude Desktop connector ready', {
        serverName: this._connectorConfig.serverName,
        port: this._connectorConfig.port
      });
    });
  }
  
  /**
   * Generate Claude Desktop configuration
   * 
   * @returns Claude Desktop configuration object
   */
  public generateClaudeDesktopConfig(): any {
    return {
      [this._connectorConfig.serverName]: {
        command: `npx @qlik-cloud-mcp/server start --port ${this._connectorConfig.port}`,
        env: {
          QLIK_CLOUD_BASE_URL: this._connectorConfig.qlikCloudBaseUrl,
          QLIK_CLOUD_TENANT_ID: this._connectorConfig.qlikCloudTenantId,
          QLIK_CLOUD_AUTH_TYPE: this._connectorConfig.authType,
          NODE_ENV: 'production'
        }
      }
    };
  }
  
  /**
   * Get the path to the Claude Desktop configuration file
   * 
   * @returns Path to the Claude Desktop configuration file
   */
  public static getClaudeDesktopConfigPath(): string {
    // Determine the platform-specific path
    if (process.platform === 'darwin') {
      // macOS
      const homeDir = process.env.HOME || '';
      return path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else if (process.platform === 'win32') {
      // Windows
      const appData = process.env.APPDATA || '';
      return path.join(appData, 'Claude', 'claude_desktop_config.json');
    } else {
      // Unsupported platform
      throw new Error('Unsupported platform for Claude Desktop');
    }
  }
  
  /**
   * Update the Claude Desktop configuration file to include our MCP server
   * 
   * @param configPath - Path to the Claude Desktop configuration file
   * @returns True if the configuration was updated successfully
   */
  public updateClaudeDesktopConfig(configPath?: string): boolean {
    try {
      // Use the provided path or get the default path
      const finalConfigPath = configPath || ClaudeDesktopConnector.getClaudeDesktopConfigPath();
      
      // Check if the configuration file exists
      let existingConfig: any = {};
      if (fs.existsSync(finalConfigPath)) {
        // Read the existing configuration
        const configContent = fs.readFileSync(finalConfigPath, 'utf8');
        existingConfig = JSON.parse(configContent);
      }
      
      // Generate our configuration
      const ourConfig = this.generateClaudeDesktopConfig();
      
      // Merge the configurations
      const newConfig = {
        ...existingConfig,
        ...ourConfig
      };
      
      // Write the updated configuration
      fs.writeFileSync(finalConfigPath, JSON.stringify(newConfig, null, 2), 'utf8');
      
      this._logger.info('Updated Claude Desktop configuration', {
        configPath: finalConfigPath,
        serverName: this._connectorConfig.serverName
      });
      
      return true;
    } catch (error) {
      this._logger.error('Failed to update Claude Desktop configuration', { error });
      return false;
    }
  }
  
  /**
   * Remove our MCP server from the Claude Desktop configuration file
   * 
   * @param configPath - Path to the Claude Desktop configuration file
   * @returns True if the configuration was updated successfully
   */
  public removeFromClaudeDesktopConfig(configPath?: string): boolean {
    try {
      // Use the provided path or get the default path
      const finalConfigPath = configPath || ClaudeDesktopConnector.getClaudeDesktopConfigPath();
      
      // Check if the configuration file exists
      if (!fs.existsSync(finalConfigPath)) {
        return true; // Nothing to remove
      }
      
      // Read the existing configuration
      const configContent = fs.readFileSync(finalConfigPath, 'utf8');
      const existingConfig = JSON.parse(configContent);
      
      // Remove our configuration
      if (existingConfig[this._connectorConfig.serverName]) {
        delete existingConfig[this._connectorConfig.serverName];
      }
      
      // Write the updated configuration
      fs.writeFileSync(finalConfigPath, JSON.stringify(existingConfig, null, 2), 'utf8');
      
      this._logger.info('Removed from Claude Desktop configuration', {
        configPath: finalConfigPath,
        serverName: this._connectorConfig.serverName
      });
      
      return true;
    } catch (error) {
      this._logger.error('Failed to remove from Claude Desktop configuration', { error });
      return false;
    }
  }
}
