import WebSocket from 'ws';
import http from 'http';
import { ModelContextManager } from '../model/model-context-manager';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for WebSocket message
 */
interface WebSocketMessage {
  type: string;
  id?: string;
  contextId?: string;
  [key: string]: any;
}

/**
 * WebSocketHandler class for handling real-time model context updates
 * 
 * This class manages WebSocket connections for real-time interaction with
 * model contexts, allowing clients to receive updates and send commands.
 */
export class WebSocketHandler extends EventEmitter {
  private _server: http.Server;
  private _wss: WebSocket.Server;
  private _contextManager: ModelContextManager;
  private _authManager: AuthManager;
  private _logger: LogManager;
  private _clients: Map<string, WebSocket> = new Map();
  private _clientContexts: Map<string, Set<string>> = new Map();
  private _contextClients: Map<string, Set<string>> = new Map();

  /**
   * Creates a new WebSocketHandler instance
   * 
   * @param server - HTTP server to attach to
   * @param contextManager - Model context manager
   * @param authManager - Authentication manager
   * @param logger - Logger
   */
  constructor(
    server: http.Server,
    contextManager: ModelContextManager,
    authManager: AuthManager,
    logger: LogManager
  ) {
    super();
    this._server = server;
    this._contextManager = contextManager;
    this._authManager = authManager;
    this._logger = logger;
    
    // Create WebSocket server
    this._wss = new WebSocket.Server({ server });
    
    // Set up event handlers
    this._setupEventHandlers();
  }

  /**
   * Set up WebSocket event handlers
   */
  private _setupEventHandlers(): void {
    // Handle new connections
    this._wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      this._handleConnection(ws, req);
    });
    
    // Handle context events
    this._setupContextEventHandlers();
  }

  /**
   * Handle new WebSocket connection
   * 
   * @param ws - WebSocket connection
   * @param req - HTTP request
   */
  private _handleConnection(ws: WebSocket, req: http.IncomingMessage): void {
    // Generate client ID
    const clientId = uuidv4();
    
    // Store client
    this._clients.set(clientId, ws);
    this._clientContexts.set(clientId, new Set());
    
    // Set up client event handlers
    ws.on('message', (message: WebSocket.Data) => {
      this._handleMessage(clientId, message);
    });
    
    ws.on('close', () => {
      this._handleClose(clientId);
    });
    
    ws.on('error', (error: Error) => {
      this._handleError(clientId, error);
    });
    
    // Send welcome message
    this._sendToClient(clientId, {
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString()
    });
    
    this._logger.info('WebSocket client connected', { clientId });
  }

  /**
   * Handle WebSocket message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleMessage(clientId: string, message: WebSocket.Data): Promise<void> {
    try {
      // Parse message
      const data: WebSocketMessage = JSON.parse(message.toString());
      
      // Handle message based on type
      switch (data.type) {
        case 'subscribe':
          await this._handleSubscribe(clientId, data);
          break;
        
        case 'unsubscribe':
          await this._handleUnsubscribe(clientId, data);
          break;
        
        case 'create-object':
          await this._handleCreateObject(clientId, data);
          break;
        
        case 'delete-object':
          await this._handleDeleteObject(clientId, data);
          break;
        
        case 'execute-method':
          await this._handleExecuteMethod(clientId, data);
          break;
        
        case 'save-state':
          await this._handleSaveState(clientId, data);
          break;
        
        case 'restore-state':
          await this._handleRestoreState(clientId, data);
          break;
        
        default:
          this._sendToClient(clientId, {
            type: 'error',
            id: data.id,
            error: `Unknown message type: ${data.type}`
          });
      }
    } catch (error) {
      this._logger.error('Error handling WebSocket message', { clientId, error });
      
      // Send error response
      this._sendToClient(clientId, {
        type: 'error',
        error: 'Failed to process message'
      });
    }
  }

  /**
   * Handle WebSocket close
   * 
   * @param clientId - Client ID
   */
  private _handleClose(clientId: string): void {
    // Get client contexts
    const contexts = this._clientContexts.get(clientId);
    
    if (contexts) {
      // Unsubscribe from all contexts
      for (const contextId of contexts) {
        this._unsubscribeFromContext(clientId, contextId);
      }
      
      // Remove client contexts
      this._clientContexts.delete(clientId);
    }
    
    // Remove client
    this._clients.delete(clientId);
    
    this._logger.info('WebSocket client disconnected', { clientId });
  }

  /**
   * Handle WebSocket error
   * 
   * @param clientId - Client ID
   * @param error - Error
   */
  private _handleError(clientId: string, error: Error): void {
    this._logger.error('WebSocket client error', { clientId, error });
  }

  /**
   * Handle subscribe message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleSubscribe(clientId: string, message: WebSocketMessage): Promise<void> {
    const { contextId } = message;
    
    if (!contextId) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Missing contextId'
      });
      return;
    }
    
    // Get the context
    const context = this._contextManager.getContext(contextId);
    
    if (!context) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Context not found'
      });
      return;
    }
    
    // Subscribe to the context
    this._subscribeToContext(clientId, contextId);
    
    // Send success response
    this._sendToClient(clientId, {
      type: 'subscribed',
      id: message.id,
      contextId
    });
  }

  /**
   * Handle unsubscribe message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleUnsubscribe(clientId: string, message: WebSocketMessage): Promise<void> {
    const { contextId } = message;
    
    if (!contextId) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Missing contextId'
      });
      return;
    }
    
    // Unsubscribe from the context
    this._unsubscribeFromContext(clientId, contextId);
    
    // Send success response
    this._sendToClient(clientId, {
      type: 'unsubscribed',
      id: message.id,
      contextId
    });
  }

  /**
   * Handle create object message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleCreateObject(clientId: string, message: WebSocketMessage): Promise<void> {
    const { contextId, objectType, properties } = message;
    
    if (!contextId || !objectType || !properties) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Missing required fields'
      });
      return;
    }
    
    // Get the context
    const context = this._contextManager.getContext(contextId);
    
    if (!context) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Context not found'
      });
      return;
    }
    
    try {
      // Create the object
      const objectHandle = await context.createObject(objectType, properties);
      
      // Send success response
      this._sendToClient(clientId, {
        type: 'object-created',
        id: message.id,
        contextId,
        objectHandle,
        objectType,
        properties
      });
    } catch (error) {
      this._logger.error('Failed to create object', { clientId, contextId, error });
      
      // Send error response
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Failed to create object'
      });
    }
  }

  /**
   * Handle delete object message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleDeleteObject(clientId: string, message: WebSocketMessage): Promise<void> {
    const { contextId, objectHandle } = message;
    
    if (!contextId || !objectHandle) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Missing required fields'
      });
      return;
    }
    
    // Get the context
    const context = this._contextManager.getContext(contextId);
    
    if (!context) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Context not found'
      });
      return;
    }
    
    try {
      // Delete the object
      await context.deleteObject(objectHandle);
      
      // Send success response
      this._sendToClient(clientId, {
        type: 'object-deleted',
        id: message.id,
        contextId,
        objectHandle
      });
    } catch (error) {
      this._logger.error('Failed to delete object', { clientId, contextId, error });
      
      // Send error response
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Failed to delete object'
      });
    }
  }

  /**
   * Handle execute method message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleExecuteMethod(clientId: string, message: WebSocketMessage): Promise<void> {
    const { contextId, objectHandle, method, params } = message;
    
    if (!contextId || !objectHandle || !method) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Missing required fields'
      });
      return;
    }
    
    // Get the context
    const context = this._contextManager.getContext(contextId);
    
    if (!context) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Context not found'
      });
      return;
    }
    
    try {
      // Execute the method
      const result = await context.executeMethod(objectHandle, method, params || []);
      
      // Send success response
      this._sendToClient(clientId, {
        type: 'method-result',
        id: message.id,
        contextId,
        objectHandle,
        method,
        result
      });
    } catch (error) {
      this._logger.error('Failed to execute method', { clientId, contextId, error });
      
      // Send error response
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Failed to execute method'
      });
    }
  }

  /**
   * Handle save state message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleSaveState(clientId: string, message: WebSocketMessage): Promise<void> {
    const { contextId, name } = message;
    
    if (!contextId) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Missing contextId'
      });
      return;
    }
    
    // Get the context
    const context = this._contextManager.getContext(contextId);
    
    if (!context) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Context not found'
      });
      return;
    }
    
    try {
      // Save the state
      const stateId = await context.saveState(name);
      
      // Send success response
      this._sendToClient(clientId, {
        type: 'state-saved',
        id: message.id,
        contextId,
        stateId
      });
    } catch (error) {
      this._logger.error('Failed to save state', { clientId, contextId, error });
      
      // Send error response
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Failed to save state'
      });
    }
  }

  /**
   * Handle restore state message
   * 
   * @param clientId - Client ID
   * @param message - Message data
   */
  private async _handleRestoreState(clientId: string, message: WebSocketMessage): Promise<void> {
    const { contextId, stateId } = message;
    
    if (!contextId || !stateId) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Missing required fields'
      });
      return;
    }
    
    // Get the context
    const context = this._contextManager.getContext(contextId);
    
    if (!context) {
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Context not found'
      });
      return;
    }
    
    try {
      // Restore the state
      await context.restoreState(stateId);
      
      // Send success response
      this._sendToClient(clientId, {
        type: 'state-restored',
        id: message.id,
        contextId,
        stateId
      });
    } catch (error) {
      this._logger.error('Failed to restore state', { clientId, contextId, error });
      
      // Send error response
      this._sendToClient(clientId, {
        type: 'error',
        id: message.id,
        error: 'Failed to restore state'
      });
    }
  }

  /**
   * Set up context event handlers
   */
  private _setupContextEventHandlers(): void {
    // Listen for context events
    const eventsToForward = [
      'context:connected',
      'context:disconnected',
      'context:state-saved',
      'context:state-restored',
      'context:object-created',
      'context:object-deleted',
      'context:session-closed',
      'context:session-suspended',
      'context:session-resumed',
      'context:notification'
    ];
    
    for (const event of eventsToForward) {
      this._contextManager.on(event, (data: any) => {
        // Extract context ID
        const contextId = data.contextId;
        
        if (!contextId) {
          return;
        }
        
        // Get clients subscribed to this context
        const clients = this._contextClients.get(contextId);
        
        if (!clients || clients.size === 0) {
          return;
        }
        
        // Forward event to subscribed clients
        const message = {
          type: event.replace('context:', ''),
          contextId,
          ...data
        };
        
        for (const clientId of clients) {
          this._sendToClient(clientId, message);
        }
      });
    }
  }

  /**
   * Subscribe a client to a context
   * 
   * @param clientId - Client ID
   * @param contextId - Context ID
   */
  private _subscribeToContext(clientId: string, contextId: string): void {
    // Add context to client contexts
    const clientContexts = this._clientContexts.get(clientId);
    
    if (clientContexts) {
      clientContexts.add(contextId);
    }
    
    // Add client to context clients
    let contextClients = this._contextClients.get(contextId);
    
    if (!contextClients) {
      contextClients = new Set();
      this._contextClients.set(contextId, contextClients);
    }
    
    contextClients.add(clientId);
    
    this._logger.info('Client subscribed to context', { clientId, contextId });
  }

  /**
   * Unsubscribe a client from a context
   * 
   * @param clientId - Client ID
   * @param contextId - Context ID
   */
  private _unsubscribeFromContext(clientId: string, contextId: string): void {
    // Remove context from client contexts
    const clientContexts = this._clientContexts.get(clientId);
    
    if (clientContexts) {
      clientContexts.delete(contextId);
    }
    
    // Remove client from context clients
    const contextClients = this._contextClients.get(contextId);
    
    if (contextClients) {
      contextClients.delete(clientId);
      
      // Remove context clients if empty
      if (contextClients.size === 0) {
        this._contextClients.delete(contextId);
      }
    }
    
    this._logger.info('Client unsubscribed from context', { clientId, contextId });
  }

  /**
   * Send a message to a client
   * 
   * @param clientId - Client ID
   * @param message - Message to send
   */
  private _sendToClient(clientId: string, message: any): void {
    const client = this._clients.get(clientId);
    
    if (!client) {
      return;
    }
    
    try {
      client.send(JSON.stringify(message));
    } catch (error) {
      this._logger.error('Failed to send message to client', { clientId, error });
    }
  }
}
