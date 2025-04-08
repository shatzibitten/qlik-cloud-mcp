import { ModelContext, ModelContextConfig } from './model-context';
import { EventEmitter } from 'events';

/**
 * ModelContextManager class for managing multiple model contexts
 * 
 * This class serves as a registry and factory for model contexts,
 * allowing the creation, retrieval, and management of multiple
 * model contexts across the application.
 */
export class ModelContextManager extends EventEmitter {
  private _contexts: Map<string, ModelContext> = new Map();
  private _cleanupInterval: NodeJS.Timeout | null = null;
  private _inactivityTimeout: number = 30 * 60 * 1000; // 30 minutes

  /**
   * Creates a new ModelContextManager instance
   * 
   * @param inactivityTimeout - Optional timeout in milliseconds for inactive contexts
   */
  constructor(inactivityTimeout?: number) {
    super();
    
    if (inactivityTimeout !== undefined) {
      this._inactivityTimeout = inactivityTimeout;
    }
    
    // Start cleanup interval
    this._startCleanupInterval();
  }

  /**
   * Create a new model context
   * 
   * @param config - Configuration for the model context
   * @returns Promise that resolves with the created context
   */
  async createContext(config: ModelContextConfig): Promise<ModelContext> {
    // Create the context
    const context = new ModelContext(config);
    
    // Store the context
    this._contexts.set(context.id, context);
    
    // Set up event forwarding
    this._setupEventForwarding(context);
    
    // Emit context created event
    this.emit('context-created', { contextId: context.id });
    
    return context;
  }

  /**
   * Get a model context by ID
   * 
   * @param contextId - ID of the context to get
   * @returns The model context or null if not found
   */
  getContext(contextId: string): ModelContext | null {
    return this._contexts.get(contextId) || null;
  }

  /**
   * Check if a context exists
   * 
   * @param contextId - ID of the context to check
   * @returns True if the context exists, false otherwise
   */
  hasContext(contextId: string): boolean {
    return this._contexts.has(contextId);
  }

  /**
   * Delete a model context
   * 
   * @param contextId - ID of the context to delete
   * @returns Promise that resolves with true if deleted, false if not found
   */
  async deleteContext(contextId: string): Promise<boolean> {
    const context = this._contexts.get(contextId);
    
    if (!context) {
      return false;
    }
    
    // Disconnect the context if connected
    if (context.isConnected) {
      await context.disconnect();
    }
    
    // Remove the context
    this._contexts.delete(contextId);
    
    // Emit context deleted event
    this.emit('context-deleted', { contextId });
    
    return true;
  }

  /**
   * Get all model contexts
   * 
   * @returns Array of all model contexts
   */
  getAllContexts(): ModelContext[] {
    return Array.from(this._contexts.values());
  }

  /**
   * Get the number of contexts
   * 
   * @returns The number of contexts
   */
  get size(): number {
    return this._contexts.size;
  }

  /**
   * Clean up inactive contexts
   * 
   * @returns Promise that resolves with the number of cleaned up contexts
   */
  async cleanupInactiveContexts(): Promise<number> {
    const now = new Date();
    const inactiveContextIds: string[] = [];
    
    // Find inactive contexts
    for (const [contextId, context] of this._contexts.entries()) {
      const lastActivity = context.lastActivity;
      const inactiveTime = now.getTime() - lastActivity.getTime();
      
      if (inactiveTime > this._inactivityTimeout) {
        inactiveContextIds.push(contextId);
      }
    }
    
    // Delete inactive contexts
    for (const contextId of inactiveContextIds) {
      await this.deleteContext(contextId);
    }
    
    return inactiveContextIds.length;
  }

  /**
   * Dispose the manager and clean up all contexts
   * 
   * @returns Promise that resolves when disposed
   */
  async dispose(): Promise<void> {
    // Stop cleanup interval
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
    
    // Disconnect and remove all contexts
    for (const context of this._contexts.values()) {
      if (context.isConnected) {
        await context.disconnect();
      }
    }
    
    // Clear the contexts map
    this._contexts.clear();
  }

  /**
   * Start the cleanup interval
   */
  private _startCleanupInterval(): void {
    // Clean up every 5 minutes
    this._cleanupInterval = setInterval(() => {
      this.cleanupInactiveContexts().catch((error) => {
        this.emit('error', error);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Set up event forwarding for a context
   * 
   * @param context - Context to set up event forwarding for
   */
  private _setupEventForwarding(context: ModelContext): void {
    // Forward relevant events with context ID
    const eventsToForward = [
      'connected',
      'disconnected',
      'state-saved',
      'state-restored',
      'object-created',
      'object-deleted',
      'session-closed',
      'session-suspended',
      'session-resumed',
      'notification',
      'error'
    ];
    
    for (const event of eventsToForward) {
      context.on(event, (data) => {
        this.emit(`context:${event}`, {
          contextId: context.id,
          ...data
        });
      });
    }
  }
}
