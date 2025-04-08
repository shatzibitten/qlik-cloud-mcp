import { ModelState } from './model-state';
import { ObjectRegistry } from './object-registry';
import { QixSession, QixSessionConfig } from '../engine/qix-session';
import { AuthManager } from '../auth/auth-manager';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for model context configuration
 */
export interface ModelContextConfig {
  appId: string;
  name: string;
  description?: string;
  engineUrl: string;
  authType?: 'oauth2' | 'jwt' | 'apikey';
}

/**
 * ModelContext class for managing model context
 * 
 * This class serves as the central component for managing model state,
 * tracking objects, and handling sessions with the Qlik Associative Engine.
 */
export class ModelContext extends EventEmitter {
  private _id: string;
  private _config: ModelContextConfig;
  private _state: ModelState;
  private _objectRegistry: ObjectRegistry;
  private _session: QixSession | null = null;
  private _authManager: AuthManager | null = null;
  private _isConnected: boolean = false;
  private _lastActivity: Date = new Date();
  private _metadata: Map<string, any> = new Map();

  /**
   * Creates a new ModelContext instance
   * 
   * @param config - Configuration for the model context
   * @param authManager - Optional authentication manager
   */
  constructor(config: ModelContextConfig, authManager?: AuthManager) {
    super();
    this._id = uuidv4();
    this._config = config;
    this._state = new ModelState(this._id);
    this._objectRegistry = new ObjectRegistry(this._id);
    this._authManager = authManager || null;
    
    // Update last activity
    this._updateLastActivity();
  }

  /**
   * Get the context ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the context configuration
   */
  get config(): ModelContextConfig {
    return { ...this._config };
  }

  /**
   * Get the model state
   */
  get state(): ModelState {
    return this._state;
  }

  /**
   * Get the object registry
   */
  get objectRegistry(): ObjectRegistry {
    return this._objectRegistry;
  }

  /**
   * Check if the context is connected to the engine
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get the last activity timestamp
   */
  get lastActivity(): Date {
    return new Date(this._lastActivity.getTime());
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
      // Create session configuration
      const sessionConfig: QixSessionConfig = {
        url: this._config.engineUrl,
        appId: this._config.appId,
        authType: this._config.authType || 'oauth2'
      };
      
      // Add auth headers if auth manager is available
      if (this._authManager) {
        sessionConfig.authHeaders = await this._authManager.getAuthHeaders(this._config.authType);
      }
      
      // Create QIX session
      this._session = new QixSession(sessionConfig);
      
      // Set up session event handlers
      this._setupSessionEventHandlers();
      
      // Connect the session
      await this._session.connect();
      
      // Mark as connected
      this._isConnected = true;
      
      // Update last activity
      this._updateLastActivity();
      
      // Emit connected event
      this.emit('connected', { contextId: this._id });
    } catch (error) {
      // Clean up on error
      if (this._session) {
        await this._session.close().catch(() => {});
        this._session = null;
      }
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Disconnect from the Qlik Associative Engine
   * 
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (!this._isConnected || !this._session) {
      return;
    }
    
    try {
      // Close the session
      await this._session.close();
      
      // Mark as disconnected
      this._isConnected = false;
      this._session = null;
      
      // Update last activity
      this._updateLastActivity();
      
      // Emit disconnected event
      this.emit('disconnected', { contextId: this._id });
    } catch (error) {
      // Ensure we're marked as disconnected even on error
      this._isConnected = false;
      this._session = null;
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Save the current state
   * 
   * @param name - Optional name for the state
   * @returns Promise that resolves with the state ID
   */
  async saveState(name?: string): Promise<string> {
    // Update last activity
    this._updateLastActivity();
    
    // Get the current state
    const state = await this._getCurrentState();
    
    // Add name if provided
    if (name) {
      state.name = name;
    }
    
    // Save the state
    const stateId = await this._state.save(state);
    
    // Emit state saved event
    this.emit('state-saved', { contextId: this._id, stateId, name });
    
    return stateId;
  }

  /**
   * Restore a saved state
   * 
   * @param stateId - ID of the state to restore
   * @returns Promise that resolves when the state is restored
   */
  async restoreState(stateId: string): Promise<void> {
    // Update last activity
    this._updateLastActivity();
    
    // Load the state
    const state = await this._state.load(stateId);
    
    if (!state) {
      throw new Error(`State not found: ${stateId}`);
    }
    
    // Restore the state
    await this._restoreState(state);
    
    // Emit state restored event
    this.emit('state-restored', { contextId: this._id, stateId });
  }

  /**
   * Create a new object
   * 
   * @param objectType - Type of object to create
   * @param properties - Object properties
   * @returns Promise that resolves with the object handle
   */
  async createObject(objectType: string, properties: any): Promise<string> {
    if (!this._isConnected || !this._session) {
      throw new Error('Not connected to engine');
    }
    
    // Update last activity
    this._updateLastActivity();
    
    // Create the object
    const objectHandle = await this._session.createObject(objectType, properties);
    
    // Register the object
    this._objectRegistry.registerObject(objectHandle, objectType, properties);
    
    // Emit object created event
    this.emit('object-created', { contextId: this._id, objectHandle, objectType, properties });
    
    return objectHandle;
  }

  /**
   * Delete an object
   * 
   * @param objectHandle - Handle of the object to delete
   * @returns Promise that resolves when the object is deleted
   */
  async deleteObject(objectHandle: string): Promise<void> {
    if (!this._isConnected || !this._session) {
      throw new Error('Not connected to engine');
    }
    
    // Check if the object exists
    if (!this._objectRegistry.hasObject(objectHandle)) {
      throw new Error(`Object not found: ${objectHandle}`);
    }
    
    // Update last activity
    this._updateLastActivity();
    
    // Destroy the object
    await this._session.destroyObject(objectHandle);
    
    // Unregister the object
    this._objectRegistry.unregisterObject(objectHandle);
    
    // Emit object deleted event
    this.emit('object-deleted', { contextId: this._id, objectHandle });
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
    if (!this._isConnected || !this._session) {
      throw new Error('Not connected to engine');
    }
    
    // Check if the object exists
    if (!this._objectRegistry.hasObject(objectHandle)) {
      throw new Error(`Object not found: ${objectHandle}`);
    }
    
    // Update last activity
    this._updateLastActivity();
    
    // Execute the method
    const result = await this._session.executeMethod(objectHandle, method, params);
    
    // Update object properties if the method returns properties
    if (result && typeof result === 'object' && result.qProp) {
      this._objectRegistry.updateObject(objectHandle, result.qProp);
    }
    
    return result;
  }

  /**
   * Get metadata
   * 
   * @param key - Metadata key
   * @returns Metadata value or undefined if not found
   */
  getMetadata(key: string): any {
    return this._metadata.get(key);
  }

  /**
   * Set metadata
   * 
   * @param key - Metadata key
   * @param value - Metadata value
   */
  setMetadata(key: string, value: any): void {
    this._metadata.set(key, value);
    
    // Update last activity
    this._updateLastActivity();
  }

  /**
   * Delete metadata
   * 
   * @param key - Metadata key
   * @returns True if the metadata was deleted, false if not found
   */
  deleteMetadata(key: string): boolean {
    // Update last activity
    this._updateLastActivity();
    
    return this._metadata.delete(key);
  }

  /**
   * Get all metadata
   * 
   * @returns Object containing all metadata
   */
  getAllMetadata(): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    for (const [key, value] of this._metadata.entries()) {
      metadata[key] = value;
    }
    
    return metadata;
  }

  /**
   * Update last activity timestamp
   */
  private _updateLastActivity(): void {
    this._lastActivity = new Date();
  }

  /**
   * Set up session event handlers
   */
  private _setupSessionEventHandlers(): void {
    if (!this._session) {
      return;
    }
    
    // Forward relevant events
    this._session.on('suspended', this._handleSessionSuspended.bind(this));
    this._session.on('closed', this._handleSessionClosed.bind(this));
    this._session.on('notification', this._handleSessionNotification.bind(this));
    this._session.on('error', this._handleSessionError.bind(this));
  }

  /**
   * Handle session suspended event
   * 
   * @param event - Suspended event
   */
  private _handleSessionSuspended(event: any): void {
    this._isConnected = false;
    
    // Emit session suspended event
    this.emit('session-suspended', { contextId: this._id, event });
  }

  /**
   * Handle session closed event
   * 
   * @param event - Closed event
   */
  private _handleSessionClosed(event: any): void {
    this._isConnected = false;
    this._session = null;
    
    // Emit session closed event
    this.emit('session-closed', { contextId: this._id, event });
  }

  /**
   * Handle session notification event
   * 
   * @param notification - Notification event
   */
  private _handleSessionNotification(notification: any): void {
    // Emit notification event
    this.emit('notification', { contextId: this._id, notification });
  }

  /**
   * Handle session error event
   * 
   * @param error - Error event
   */
  private _handleSessionError(error: Error): void {
    // Emit error event
    this.emit('error', { contextId: this._id, error });
  }

  /**
   * Get the current state
   * 
   * @returns Promise that resolves with the current state
   */
  private async _getCurrentState(): Promise<any> {
    // Get session state if connected
    const sessionState = this._isConnected && this._session
      ? await this._session.getState()
      : null;
    
    // Get object registry state
    const objectState = this._objectRegistry.getState();
    
    // Get metadata
    const metadata = this.getAllMetadata();
    
    // Return the combined state
    return {
      timestamp: new Date().toISOString(),
      session: sessionState,
      objects: objectState,
      metadata
    };
  }

  /**
   * Restore a state
   * 
   * @param state - State to restore
   * @returns Promise that resolves when the state is restored
   */
  private async _restoreState(state: any): Promise<void> {
    // Restore object registry state
    if (state.objects) {
      await this._objectRegistry.setState(state.objects);
    }
    
    // Restore session state if connected
    if (state.session && this._isConnected && this._session) {
      await this._session.setState(state.session);
    }
    
    // Restore metadata
    if (state.metadata) {
      for (const [key, value] of Object.entries(state.metadata)) {
        this._metadata.set(key, value);
      }
    }
  }
}
