import { EventEmitter } from 'events';
import { WebSocketConnection } from './websocket-connection';
import enigma from 'enigma.js';
import schema from 'enigma.js/schemas/12.20.0.json';

/**
 * Interface for QIX session configuration
 */
export interface QixSessionConfig {
  url: string;
  appId: string;
  authType: 'oauth2' | 'jwt' | 'apikey';
  authHeaders?: Record<string, string>;
}

/**
 * QixSession class for managing sessions with the Qlik Associative Engine
 * 
 * This class provides a higher-level interface for interacting with the
 * Qlik Associative Engine, building on top of the WebSocketConnection
 * and using enigma.js for handling the QIX protocol.
 */
export class QixSession extends EventEmitter {
  private _config: QixSessionConfig;
  private _connection: WebSocketConnection | null = null;
  private _session: any = null;
  private _app: any = null;
  private _global: any = null;
  private _isConnected: boolean = false;

  /**
   * Creates a new QixSession instance
   * 
   * @param config - Configuration for the QIX session
   */
  constructor(config: QixSessionConfig) {
    super();
    this._config = config;
  }

  /**
   * Get the session configuration
   */
  get config(): QixSessionConfig {
    return { ...this._config };
  }

  /**
   * Check if the session is connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get the enigma.js session
   */
  get session(): any {
    return this._session;
  }

  /**
   * Get the enigma.js app
   */
  get app(): any {
    return this._app;
  }

  /**
   * Get the enigma.js global
   */
  get global(): any {
    return this._global;
  }

  /**
   * Connect to the Qlik Associative Engine
   * 
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this._isConnected) {
      return;
    }

    try {
      // Create WebSocket connection
      this._connection = new WebSocketConnection({
        url: this._config.url,
        headers: this._getAuthHeaders()
      });

      // Set up event handlers
      this._connection.on('connected', this._handleConnectionConnected.bind(this));
      this._connection.on('disconnected', this._handleConnectionDisconnected.bind(this));
      this._connection.on('error', this._handleConnectionError.bind(this));
      this._connection.on('notification', this._handleConnectionNotification.bind(this));

      // Connect the WebSocket
      await this._connection.connect();

      // Create enigma.js session
      this._session = enigma.create({
        schema,
        url: this._config.url,
        createSocket: (url: string) => {
          // Return the existing WebSocket connection
          return this._connection!;
        }
      });

      // Open the session
      this._global = await this._session.open();

      // Open the app
      this._app = await this._global.openDoc(this._config.appId);

      // Mark as connected
      this._isConnected = true;

      // Emit connected event
      this.emit('connected');
    } catch (error) {
      // Clean up on error
      if (this._connection) {
        await this._connection.disconnect().catch(() => {});
        this._connection = null;
      }
      this._session = null;
      this._app = null;
      this._global = null;
      this._isConnected = false;

      // Re-throw the error
      throw error;
    }
  }

  /**
   * Close the session
   * 
   * @returns Promise that resolves when closed
   */
  async close(): Promise<void> {
    if (!this._isConnected) {
      return;
    }

    try {
      // Close the session
      if (this._session) {
        await this._session.close();
        this._session = null;
        this._app = null;
        this._global = null;
      }

      // Disconnect the WebSocket
      if (this._connection) {
        await this._connection.disconnect();
        this._connection = null;
      }

      // Mark as disconnected
      this._isConnected = false;

      // Emit closed event
      this.emit('closed');
    } catch (error) {
      // Ensure we're marked as disconnected even on error
      this._isConnected = false;
      this._session = null;
      this._app = null;
      this._global = null;
      this._connection = null;

      // Re-throw the error
      throw error;
    }
  }

  /**
   * Get the current session state
   * 
   * @returns Promise that resolves with the session state
   */
  async getState(): Promise<any> {
    if (!this._isConnected || !this._app) {
      throw new Error('Not connected to engine');
    }

    // Get the current selections
    const selections = await this._app.getList('CurrentSelections');

    // Get the current variables
    const variables = await this._app.getVariables();

    // Return the state
    return {
      selections,
      variables
    };
  }

  /**
   * Set the session state
   * 
   * @param state - State to set
   * @returns Promise that resolves when state is set
   */
  async setState(state: any): Promise<void> {
    if (!this._isConnected || !this._app) {
      throw new Error('Not connected to engine');
    }

    // Clear all selections
    await this._app.clearAll();

    // Apply selections
    if (state.selections) {
      for (const field of state.selections.qSelectionObject.qSelections) {
        const fieldObj = await this._app.getField(field.qField);
        await fieldObj.selectValues(field.qSelectedValues, false, false);
      }
    }

    // Apply variables
    if (state.variables) {
      for (const variable of state.variables) {
        await this._app.setVariableValue(variable.qName, variable.qDefinition);
      }
    }
  }

  /**
   * Create a new object
   * 
   * @param objectType - Type of object to create
   * @param properties - Object properties
   * @returns Promise that resolves with the object handle
   */
  async createObject(objectType: string, properties: any): Promise<string> {
    if (!this._isConnected || !this._app) {
      throw new Error('Not connected to engine');
    }

    let object;
    
    // Create the object based on type
    switch (objectType) {
      case 'GenericObject':
        object = await this._app.createObject(properties);
        break;
      case 'GenericBookmark':
        object = await this._app.createBookmark(properties);
        break;
      case 'GenericVariable':
        object = await this._app.createVariableEx(properties);
        break;
      case 'GenericDimension':
        object = await this._app.createDimension(properties);
        break;
      case 'GenericMeasure':
        object = await this._app.createMeasure(properties);
        break;
      default:
        throw new Error(`Unsupported object type: ${objectType}`);
    }

    // Return the object handle
    return object.id;
  }

  /**
   * Get an object by handle
   * 
   * @param objectHandle - Handle of the object to get
   * @returns Promise that resolves with the object
   */
  async getObject(objectHandle: string): Promise<any> {
    if (!this._isConnected || !this._app) {
      throw new Error('Not connected to engine');
    }

    // Get the object
    return await this._app.getObject(objectHandle);
  }

  /**
   * Destroy an object
   * 
   * @param objectHandle - Handle of the object to destroy
   * @returns Promise that resolves when the object is destroyed
   */
  async destroyObject(objectHandle: string): Promise<void> {
    if (!this._isConnected || !this._app) {
      throw new Error('Not connected to engine');
    }

    // Destroy the object
    await this._app.destroyObject(objectHandle);
  }

  /**
   * Execute a method on an object
   * 
   * @param objectHandle - Handle of the object
   * @param method - Method to execute
   * @param params - Parameters for the method
   * @returns Promise that resolves with the result
   */
  async executeMethod(objectHandle: string, method: string, params: any[] = []): Promise<any> {
    if (!this._isConnected || !this._app) {
      throw new Error('Not connected to engine');
    }

    // Get the object
    const object = await this.getObject(objectHandle);

    // Check if the method exists
    if (typeof object[method] !== 'function') {
      throw new Error(`Method not found: ${method}`);
    }

    // Execute the method
    return await object[method](...params);
  }

  /**
   * Get authentication headers based on auth type
   * 
   * @returns Authentication headers
   */
  private _getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Add auth headers based on auth type
    if (this._config.authHeaders) {
      // Use provided auth headers
      Object.assign(headers, this._config.authHeaders);
    } else {
      // Add default headers based on auth type
      switch (this._config.authType) {
        case 'oauth2':
          // OAuth2 headers would be added here
          // This would typically be a Bearer token
          break;
        case 'jwt':
          // JWT headers would be added here
          break;
        case 'apikey':
          // API key headers would be added here
          break;
      }
    }

    return headers;
  }

  /**
   * Handle WebSocket connection connected event
   */
  private _handleConnectionConnected(): void {
    // This is handled in the connect method
  }

  /**
   * Handle WebSocket connection disconnected event
   * 
   * @param event - Disconnected event
   */
  private _handleConnectionDisconnected(event: any): void {
    this._isConnected = false;
    this._session = null;
    this._app = null;
    this._global = null;

    // Emit suspended event
    this.emit('suspended', event);
  }

  /**
   * Handle WebSocket connection error event
   * 
   * @param error - Error event
   */
  private _handleConnectionError(error: Error): void {
    // Emit error event
    this.emit('error', error);
  }

  /**
   * Handle WebSocket connection notification event
   * 
   * @param notification - Notification event
   */
  private _handleConnectionNotification(notification: any): void {
    // Emit notification event
    this.emit('notification', notification);
  }
}
