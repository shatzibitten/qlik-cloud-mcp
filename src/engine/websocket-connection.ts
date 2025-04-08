import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * Interface for WebSocket connection configuration
 */
export interface WebSocketConnectionConfig {
  url: string;
  headers?: Record<string, string>;
  protocols?: string | string[];
}

/**
 * WebSocketConnection class for managing WebSocket connections to the Qlik Associative Engine
 * 
 * This class handles the low-level WebSocket communication, including connection
 * establishment, message sending/receiving, and connection lifecycle events.
 */
export class WebSocketConnection extends EventEmitter {
  private _config: WebSocketConnectionConfig;
  private _socket: WebSocket | null = null;
  private _isConnected: boolean = false;
  private _reconnectAttempts: number = 0;
  private _maxReconnectAttempts: number = 5;
  private _reconnectDelay: number = 1000;
  private _messageQueue: string[] = [];
  private _messageId: number = 1;

  /**
   * Creates a new WebSocketConnection instance
   * 
   * @param config - Configuration for the WebSocket connection
   */
  constructor(config: WebSocketConnectionConfig) {
    super();
    this._config = config;
  }

  /**
   * Get the connection URL
   */
  get url(): string {
    return this._config.url;
  }

  /**
   * Check if the connection is established
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Connect to the WebSocket server
   * 
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this._isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        this._socket = new WebSocket(this._config.url, this._config.protocols, {
          headers: this._config.headers
        });

        // Set up event handlers
        this._socket.onopen = this._handleOpen.bind(this, resolve);
        this._socket.onclose = this._handleClose.bind(this);
        this._socket.onerror = this._handleError.bind(this, reject);
        this._socket.onmessage = this._handleMessage.bind(this);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   * 
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (!this._isConnected || !this._socket) {
      return;
    }

    return new Promise((resolve) => {
      // Set up one-time close handler to resolve the promise
      this._socket!.once('close', () => {
        this._isConnected = false;
        this._socket = null;
        resolve();
      });

      // Close the connection
      this._socket!.close();
    });
  }

  /**
   * Send a message to the WebSocket server
   * 
   * @param message - Message to send
   * @returns Promise that resolves when the message is sent
   */
  async send(message: any): Promise<void> {
    // Convert message to string if it's an object
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

    // If not connected, queue the message
    if (!this._isConnected || !this._socket) {
      this._messageQueue.push(messageStr);
      return;
    }

    return new Promise((resolve, reject) => {
      this._socket!.send(messageStr, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Send a JSON-RPC request and get a response
   * 
   * @param method - Method to call
   * @param params - Parameters for the method
   * @returns Promise that resolves with the response
   */
  async request(method: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      // Generate a unique ID for this request
      const id = this._messageId++;

      // Create the JSON-RPC request
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
        handle: -1 // Global handle
      };

      // Set up a one-time listener for the response
      const responseHandler = (message: any) => {
        if (message.id === id) {
          // Remove the listener
          this.removeListener('message', responseHandler);

          // Check for errors
          if (message.error) {
            reject(new Error(message.error.message || 'Unknown error'));
          } else {
            resolve(message.result);
          }
        }
      };

      // Add the listener
      this.on('message', responseHandler);

      // Send the request
      this.send(request).catch((error) => {
        // Remove the listener if sending fails
        this.removeListener('message', responseHandler);
        reject(error);
      });

      // Set a timeout to prevent hanging promises
      setTimeout(() => {
        // Check if the listener is still registered
        if (this.listenerCount('message') > 0) {
          // Remove the listener
          this.removeListener('message', responseHandler);
          reject(new Error(`Request timed out: ${method}`));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Handle WebSocket open event
   * 
   * @param resolve - Promise resolve function
   */
  private _handleOpen(resolve: () => void): void {
    this._isConnected = true;
    this._reconnectAttempts = 0;

    // Process any queued messages
    while (this._messageQueue.length > 0) {
      const message = this._messageQueue.shift();
      if (message) {
        this.send(message).catch((error) => {
          this.emit('error', error);
        });
      }
    }

    // Emit connected event
    this.emit('connected');

    // Resolve the connect promise
    resolve();
  }

  /**
   * Handle WebSocket close event
   * 
   * @param event - Close event
   */
  private _handleClose(event: WebSocket.CloseEvent): void {
    const wasConnected = this._isConnected;
    this._isConnected = false;
    this._socket = null;

    // Emit disconnected event
    if (wasConnected) {
      this.emit('disconnected', event);
    }

    // Attempt to reconnect if it wasn't a clean close
    if (!event.wasClean && this._reconnectAttempts < this._maxReconnectAttempts) {
      this._reconnectAttempts++;
      const delay = this._reconnectDelay * Math.pow(2, this._reconnectAttempts - 1);

      this.emit('reconnecting', { attempt: this._reconnectAttempts, delay });

      setTimeout(() => {
        this.connect().catch((error) => {
          this.emit('error', error);
        });
      }, delay);
    }
  }

  /**
   * Handle WebSocket error event
   * 
   * @param reject - Promise reject function
   * @param event - Error event
   */
  private _handleError(reject: (reason?: any) => void, event: WebSocket.ErrorEvent): void {
    const error = new Error(`WebSocket error: ${event.message || 'Unknown error'}`);
    this.emit('error', error);

    // If we're still connecting, reject the connect promise
    if (!this._isConnected) {
      reject(error);
    }
  }

  /**
   * Handle WebSocket message event
   * 
   * @param event - Message event
   */
  private _handleMessage(event: WebSocket.MessageEvent): void {
    try {
      // Parse the message
      const message = JSON.parse(event.data.toString());

      // Emit the raw message event
      this.emit('message', message);

      // Handle different message types
      if (message.method === 'notification') {
        // It's a notification
        this.emit('notification', message.params);
      } else if (message.id !== undefined) {
        // It's a response to a request
        this.emit('response', message);
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }
}
