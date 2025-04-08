/**
 * Cursor Connector
 * 
 * This module provides integration between the Qlik Cloud MCP server and Cursor AI.
 * It implements the necessary functionality to allow Cursor to use our MCP server
 * for accessing Qlik Cloud resources and functionality through the Anthropic API.
 * 
 * @module integrations/cursor-connector
 */

import { Server } from '../server/server';
import { ModelContextManager } from '../model/model-context-manager';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';
import { ConfigManager } from '../config/config-manager';
import { QlikCloudModelContextIntegration } from '../api/qlik-cloud-integration';
import * as express from 'express';

/**
 * Configuration for the Cursor connector
 */
export interface CursorConnectorConfig {
  /**
   * API key for authenticating requests from Cursor
   */
  apiKey: string;
  
  /**
   * Base URL for the Anthropic API
   */
  anthropicBaseUrl: string;
  
  /**
   * API version for the Anthropic API
   */
  anthropicApiVersion: string;
  
  /**
   * Default model to use for Anthropic API requests
   */
  defaultModel: string;
  
  /**
   * Maximum tokens to generate in responses
   */
  maxTokens: number;
}

/**
 * Cursor Connector class
 * 
 * This class provides integration between the Qlik Cloud MCP server and Cursor AI.
 */
export class CursorConnector {
  private _server: Server;
  private _contextManager: ModelContextManager;
  private _authManager: AuthManager;
  private _logger: LogManager;
  private _config: ConfigManager;
  private _qlikCloudIntegration: QlikCloudModelContextIntegration;
  private _connectorConfig: CursorConnectorConfig;
  
  /**
   * Creates a new Cursor Connector
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
    connectorConfig: CursorConnectorConfig
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
    this._logger.info('Initializing Cursor connector', {
      anthropicBaseUrl: this._connectorConfig.anthropicBaseUrl,
      anthropicApiVersion: this._connectorConfig.anthropicApiVersion
    });
    
    // Register Anthropic API compatible routes for Cursor
    this._registerAnthropicApiRoutes();
    
    // Set up event handlers
    this._setupEventHandlers();
  }
  
  /**
   * Register Anthropic API compatible routes for Cursor
   */
  private _registerAnthropicApiRoutes(): void {
    // Create a router for the Anthropic API routes
    const router = express.Router();
    
    // Add authentication middleware
    router.use(this._authenticateRequest.bind(this));
    
    // Register the messages endpoint (Claude API)
    router.post('/v1/messages', this._handleMessagesRequest.bind(this));
    
    // Register the completions endpoint (legacy Claude API)
    router.post('/v1/complete', this._handleCompletionsRequest.bind(this));
    
    // Register the models endpoint
    router.get('/v1/models', this._handleModelsRequest.bind(this));
    
    // Add the router to the server
    this._server.app.use('/anthropic', router);
    
    this._logger.info('Registered Anthropic API routes for Cursor');
  }
  
  /**
   * Authenticate incoming requests
   */
  private _authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction): void {
    try {
      // Get the API key from the request
      const apiKey = req.headers['x-api-key'] || req.headers['anthropic-api-key'] || '';
      
      // Check if the API key is valid
      if (apiKey !== this._connectorConfig.apiKey) {
        this._logger.warn('Invalid API key', { apiKey });
        return res.status(401).json({ error: 'Invalid API key' });
      }
      
      // Continue to the next middleware
      next();
    } catch (error) {
      this._logger.error('Error authenticating request', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Handle requests to the messages endpoint
   */
  private async _handleMessagesRequest(req: express.Request, res: express.Response): Promise<void> {
    try {
      this._logger.info('Handling messages request', { body: req.body });
      
      // Extract request parameters
      const {
        model = this._connectorConfig.defaultModel,
        messages,
        max_tokens = this._connectorConfig.maxTokens,
        temperature = 0.7,
        system,
        tools = []
      } = req.body;
      
      // Validate required parameters
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing or invalid messages parameter' });
      }
      
      // Check if there are any Qlik-related tools
      const qlikTools = tools.filter((tool: any) => 
        tool.name && tool.name.startsWith('qlik_')
      );
      
      // Process the request
      let response;
      
      if (qlikTools.length > 0) {
        // Handle Qlik-specific tools
        response = await this._processQlikTools(messages, qlikTools);
      } else {
        // Forward the request to the Anthropic API
        response = await this._forwardToAnthropic('/v1/messages', {
          model,
          messages,
          max_tokens,
          temperature,
          system,
          tools
        });
      }
      
      // Return the response
      res.json(response);
    } catch (error) {
      this._logger.error('Error handling messages request', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Handle requests to the completions endpoint
   */
  private async _handleCompletionsRequest(req: express.Request, res: express.Response): Promise<void> {
    try {
      this._logger.info('Handling completions request', { body: req.body });
      
      // Extract request parameters
      const {
        model = this._connectorConfig.defaultModel,
        prompt,
        max_tokens_to_sample = this._connectorConfig.maxTokens,
        temperature = 0.7,
        system
      } = req.body;
      
      // Validate required parameters
      if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt parameter' });
      }
      
      // Forward the request to the Anthropic API
      const response = await this._forwardToAnthropic('/v1/complete', {
        model,
        prompt,
        max_tokens_to_sample,
        temperature,
        system
      });
      
      // Return the response
      res.json(response);
    } catch (error) {
      this._logger.error('Error handling completions request', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Handle requests to the models endpoint
   */
  private async _handleModelsRequest(req: express.Request, res: express.Response): Promise<void> {
    try {
      this._logger.info('Handling models request');
      
      // Forward the request to the Anthropic API
      const response = await this._forwardToAnthropic('/v1/models', {});
      
      // Return the response
      res.json(response);
    } catch (error) {
      this._logger.error('Error handling models request', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Forward a request to the Anthropic API
   * 
   * @param endpoint - API endpoint
   * @param data - Request data
   * @returns Response from the Anthropic API
   */
  private async _forwardToAnthropic(endpoint: string, data: any): Promise<any> {
    try {
      // Implement actual forwarding logic here
      // This is a placeholder that returns a mock response
      
      if (endpoint === '/v1/messages') {
        return {
          id: 'msg_' + Math.random().toString(36).substring(2, 15),
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'This is a mock response from the Anthropic API. In a real implementation, this would be forwarded to the actual Anthropic API.'
            }
          ],
          model: data.model,
          stop_reason: 'end_turn',
          usage: {
            input_tokens: 100,
            output_tokens: 50
          }
        };
      } else if (endpoint === '/v1/complete') {
        return {
          completion: 'This is a mock response from the Anthropic API. In a real implementation, this would be forwarded to the actual Anthropic API.',
          stop_reason: 'stop_sequence',
          model: data.model,
          truncated: false
        };
      } else if (endpoint === '/v1/models') {
        return {
          models: [
            {
              name: 'claude-3-opus-20240229',
              description: 'Claude 3 Opus',
              context_window: 200000,
              max_tokens: 4096
            },
            {
              name: 'claude-3-sonnet-20240229',
              description: 'Claude 3 Sonnet',
              context_window: 180000,
              max_tokens: 4096
            },
            {
              name: 'claude-3-haiku-20240307',
              description: 'Claude 3 Haiku',
              context_window: 150000,
              max_tokens: 4096
            }
          ]
        };
      }
      
      return {};
    } catch (error) {
      this._logger.error('Error forwarding request to Anthropic API', { endpoint, error });
      throw error;
    }
  }
  
  /**
   * Process Qlik-specific tools
   * 
   * @param messages - Messages from the request
   * @param tools - Qlik tools to process
   * @returns Response with tool results
   */
  private async _processQlikTools(messages: any[], tools: any[]): Promise<any> {
    try {
      // Extract the last user message
      const lastUserMessage = messages
        .filter(msg => msg.role === 'user')
        .pop();
      
      if (!lastUserMessage) {
        throw new Error('No user message found');
      }
      
      // Process each tool
      const toolResults = [];
      
      for (const tool of tools) {
        const toolName = tool.name;
        
        // Process the tool based on its name
        if (toolName === 'qlik_list_apps') {
          // Get apps from Qlik Cloud
          const apps = await this._qlikCloudIntegration.clients.appClient.getApps();
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ apps })
          });
        } else if (toolName === 'qlik_get_app') {
          // Extract app ID from the message
          const appId = this._extractParameterFromMessage(lastUserMessage.content, 'appId');
          
          if (!appId) {
            throw new Error('App ID not found in message');
          }
          
          // Get the app from Qlik Cloud
          const app = await this._qlikCloudIntegration.clients.appClient.getApp(appId);
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ app })
          });
        } else if (toolName === 'qlik_create_model_context') {
          // Extract parameters from the message
          const appId = this._extractParameterFromMessage(lastUserMessage.content, 'appId');
          const name = this._extractParameterFromMessage(lastUserMessage.content, 'name');
          const description = this._extractParameterFromMessage(lastUserMessage.content, 'description');
          
          if (!appId || !name) {
            throw new Error('Required parameters not found in message');
          }
          
          // Create a new context
          const context = await this._contextManager.createContext({
            appId,
            name,
            description: description || '',
            engineUrl: `wss://${this._config.get('qlikCloud.tenantId')}.us.qlikcloud.com/app/${appId}`,
            authType: this._config.get('qlikCloud.authType', 'oauth2')
          });
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ context: context.getMetadata() })
          });
        } else if (toolName === 'qlik_get_model_context') {
          // Extract context ID from the message
          const contextId = this._extractParameterFromMessage(lastUserMessage.content, 'contextId');
          
          if (!contextId) {
            throw new Error('Context ID not found in message');
          }
          
          // Get the context
          const context = this._contextManager.getContext(contextId);
          
          if (!context) {
            throw new Error(`Context not found: ${contextId}`);
          }
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ context: context.getMetadata() })
          });
        } else if (toolName === 'qlik_list_model_contexts') {
          // List all contexts
          const contexts = this._contextManager.listContexts();
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ contexts })
          });
        } else if (toolName === 'qlik_delete_model_context') {
          // Extract context ID from the message
          const contextId = this._extractParameterFromMessage(lastUserMessage.content, 'contextId');
          
          if (!contextId) {
            throw new Error('Context ID not found in message');
          }
          
          // Delete the context
          await this._contextManager.deleteContext(contextId);
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ success: true })
          });
        } else if (toolName === 'qlik_save_model_state') {
          // Extract parameters from the message
          const contextId = this._extractParameterFromMessage(lastUserMessage.content, 'contextId');
          const name = this._extractParameterFromMessage(lastUserMessage.content, 'name');
          const description = this._extractParameterFromMessage(lastUserMessage.content, 'description');
          
          if (!contextId || !name) {
            throw new Error('Required parameters not found in message');
          }
          
          // Get the context
          const context = this._contextManager.getContext(contextId);
          
          if (!context) {
            throw new Error(`Context not found: ${contextId}`);
          }
          
          // Save the state
          const state = await context.saveState(name, description || '');
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ state })
          });
        } else if (toolName === 'qlik_restore_model_state') {
          // Extract parameters from the message
          const contextId = this._extractParameterFromMessage(lastUserMessage.content, 'contextId');
          const stateId = this._extractParameterFromMessage(lastUserMessage.content, 'stateId');
          
          if (!contextId || !stateId) {
            throw new Error('Required parameters not found in message');
          }
          
          // Get the context
          const context = this._contextManager.getContext(contextId);
          
          if (!context) {
            throw new Error(`Context not found: ${contextId}`);
          }
          
          // Restore the state
          await context.restoreState(stateId);
          
          toolResults.push({
            tool_name: toolName,
            tool_result: JSON.stringify({ success: true })
          });
        }
      }
      
      // Create a response with the tool results
      return {
        id: 'msg_' + Math.random().toString(36).substring(2, 15),
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'I\'ve processed your request using the Qlik Cloud MCP server.'
          }
        ],
        model: this._connectorConfig.defaultModel,
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50
        },
        tool_results: toolResults
      };
    } catch (error) {
      this._logger.error('Error processing Qlik tools', { error });
      throw error;
    }
  }
  
  /**
   * Extract a parameter from a message
   * 
   * @param content - Message content
   * @param paramName - Parameter name
   * @returns Parameter value or undefined
   */
  private _extractParameterFromMessage(content: any, paramName: string): string | undefined {
    try {
      // Handle different content formats
      if (typeof content === 'string') {
        // Try to extract from a string
        const regex = new RegExp(`${paramName}[\\s]*[:=][\\s]*["']?([^"',\\s]+)["']?`, 'i');
        const match = content.match(regex);
        return match ? match[1] : undefined;
      } else if (Array.isArray(content)) {
        // Try to extract from an array of content blocks
        for (const block of content) {
          if (block.type === 'text') {
            const value = this._extractParameterFromMessage(block.text, paramName);
            if (value) {
              return value;
            }
          }
        }
      }
      
      return undefined;
    } catch (error) {
      this._logger.error('Error extracting parameter from message', { paramName, error });
      return undefined;
    }
  }
  
  /**
   * Set up event handlers
   */
  private _setupEventHandlers(): void {
    // Listen for server started event
    this._server.on('server:started', () => {
      this._logger.info('Cursor connector ready');
    });
  }
  
  /**
   * Get the Anthropic API URL for Cursor
   * 
   * @returns Anthropic API URL
   */
  public getAnthropicApiUrl(): string {
    return `${this._server.baseUrl}/anthropic`;
  }
  
  /**
   * Generate Cursor integration instructions
   * 
   * @returns Instructions for integrating with Cursor
   */
  public generateCursorInstructions(): string {
    return `
# Integrating with Cursor AI

To use the Qlik Cloud MCP server with Cursor AI, follow these steps:

1. Open Cursor AI and go to Settings
2. Navigate to the "AI Models" or "Integrations" section
3. Find the Claude/Anthropic integration settings
4. Enter the following information:
   - API URL: ${this.getAnthropicApiUrl()}
   - API Key: ${this._connectorConfig.apiKey}
   - Model: ${this._connectorConfig.defaultModel}

5. Save your settings and restart Cursor AI

You can now use Qlik Cloud functionality directly from Cursor AI by using the following commands:
- qlik_list_apps: List all Qlik Cloud apps
- qlik_get_app: Get a Qlik Cloud app by ID
- qlik_create_model_context: Create a new model context for a Qlik Cloud app
- qlik_get_model_context: Get a model context by ID
- qlik_list_model_contexts: List all model contexts
- qlik_delete_model_context: Delete a model context
- qlik_save_model_state: Save the current state of a model context
- qlik_restore_model_state: Restore a saved state of a model context
`;
  }
}
