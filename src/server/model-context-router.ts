import express from 'express';
import { ModelContextManager } from '../model/model-context-manager';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';

/**
 * Router for model context API endpoints
 * 
 * This router handles all API endpoints related to model context management,
 * including context creation, retrieval, state management, and object operations.
 */
export class ModelContextRouter {
  private _router: express.Router;
  private _contextManager: ModelContextManager;
  private _authManager: AuthManager;
  private _logger: LogManager;

  /**
   * Creates a new ModelContextRouter instance
   * 
   * @param contextManager - Model context manager
   * @param authManager - Authentication manager
   * @param logger - Logger
   */
  constructor(
    contextManager: ModelContextManager,
    authManager: AuthManager,
    logger: LogManager
  ) {
    this._contextManager = contextManager;
    this._authManager = authManager;
    this._logger = logger;
    this._router = express.Router();
    
    // Set up routes
    this._setupRoutes();
  }

  /**
   * Get the Express router
   */
  get router(): express.Router {
    return this._router;
  }

  /**
   * Set up API routes
   */
  private _setupRoutes(): void {
    // Context operations
    this._router.get('/contexts', this._listContexts.bind(this));
    this._router.post('/contexts', this._createContext.bind(this));
    this._router.get('/contexts/:id', this._getContext.bind(this));
    this._router.delete('/contexts/:id', this._deleteContext.bind(this));
    
    // Session operations
    this._router.post('/contexts/:id/connect', this._connectContext.bind(this));
    this._router.post('/contexts/:id/disconnect', this._disconnectContext.bind(this));
    
    // State operations
    this._router.get('/contexts/:id/state', this._getState.bind(this));
    this._router.post('/contexts/:id/state/save', this._saveState.bind(this));
    this._router.post('/contexts/:id/state/restore', this._restoreState.bind(this));
    this._router.get('/contexts/:id/states', this._listStates.bind(this));
    
    // Object operations
    this._router.get('/contexts/:id/objects', this._listObjects.bind(this));
    this._router.post('/contexts/:id/objects', this._createObject.bind(this));
    this._router.get('/contexts/:id/objects/:objectId', this._getObject.bind(this));
    this._router.delete('/contexts/:id/objects/:objectId', this._deleteObject.bind(this));
    this._router.post('/contexts/:id/objects/:objectId/method', this._executeMethod.bind(this));
  }

  /**
   * List all contexts
   */
  private async _listContexts(req: express.Request, res: express.Response): Promise<void> {
    try {
      const contexts = this._contextManager.getAllContexts().map(context => ({
        id: context.id,
        name: context.config.name,
        description: context.config.description,
        appId: context.config.appId,
        isConnected: context.isConnected,
        lastActivity: context.lastActivity
      }));
      
      res.json({ contexts });
    } catch (error) {
      this._logger.error('Failed to list contexts', { error });
      res.status(500).json({ error: 'Failed to list contexts' });
    }
  }

  /**
   * Create a new context
   */
  private async _createContext(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { appId, name, description, engineUrl, authType } = req.body;
      
      // Validate required fields
      if (!appId || !name || !engineUrl) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      // Create the context
      const context = await this._contextManager.createContext({
        appId,
        name,
        description,
        engineUrl,
        authType: authType || this._authManager.defaultAuthType
      });
      
      res.status(201).json({
        id: context.id,
        name: context.config.name,
        description: context.config.description,
        appId: context.config.appId,
        isConnected: context.isConnected,
        lastActivity: context.lastActivity
      });
    } catch (error) {
      this._logger.error('Failed to create context', { error });
      res.status(500).json({ error: 'Failed to create context' });
    }
  }

  /**
   * Get a context by ID
   */
  private async _getContext(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      res.json({
        id: context.id,
        name: context.config.name,
        description: context.config.description,
        appId: context.config.appId,
        isConnected: context.isConnected,
        lastActivity: context.lastActivity
      });
    } catch (error) {
      this._logger.error('Failed to get context', { error });
      res.status(500).json({ error: 'Failed to get context' });
    }
  }

  /**
   * Delete a context
   */
  private async _deleteContext(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this._contextManager.deleteContext(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      this._logger.error('Failed to delete context', { error });
      res.status(500).json({ error: 'Failed to delete context' });
    }
  }

  /**
   * Connect a context to the engine
   */
  private async _connectContext(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // Connect the context
      await context.connect();
      
      res.json({
        id: context.id,
        isConnected: context.isConnected,
        lastActivity: context.lastActivity
      });
    } catch (error) {
      this._logger.error('Failed to connect context', { error });
      res.status(500).json({ error: 'Failed to connect context' });
    }
  }

  /**
   * Disconnect a context from the engine
   */
  private async _disconnectContext(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // Disconnect the context
      await context.disconnect();
      
      res.json({
        id: context.id,
        isConnected: context.isConnected,
        lastActivity: context.lastActivity
      });
    } catch (error) {
      this._logger.error('Failed to disconnect context', { error });
      res.status(500).json({ error: 'Failed to disconnect context' });
    }
  }

  /**
   * Get the current state of a context
   */
  private async _getState(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // Get the current state
      const state = await context.state.list();
      
      res.json({ state });
    } catch (error) {
      this._logger.error('Failed to get state', { error });
      res.status(500).json({ error: 'Failed to get state' });
    }
  }

  /**
   * Save the current state of a context
   */
  private async _saveState(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // Save the state
      const stateId = await context.saveState(name);
      
      res.json({ stateId });
    } catch (error) {
      this._logger.error('Failed to save state', { error });
      res.status(500).json({ error: 'Failed to save state' });
    }
  }

  /**
   * Restore a saved state
   */
  private async _restoreState(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { stateId } = req.body;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      if (!stateId) {
        res.status(400).json({ error: 'Missing stateId' });
        return;
      }
      
      // Restore the state
      await context.restoreState(stateId);
      
      res.json({ success: true });
    } catch (error) {
      this._logger.error('Failed to restore state', { error });
      res.status(500).json({ error: 'Failed to restore state' });
    }
  }

  /**
   * List all saved states for a context
   */
  private async _listStates(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // List the states
      const states = await context.state.list();
      
      res.json({ states });
    } catch (error) {
      this._logger.error('Failed to list states', { error });
      res.status(500).json({ error: 'Failed to list states' });
    }
  }

  /**
   * List all objects in a context
   */
  private async _listObjects(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // List the objects
      const objects = context.objectRegistry.getAllObjects();
      
      res.json({ objects });
    } catch (error) {
      this._logger.error('Failed to list objects', { error });
      res.status(500).json({ error: 'Failed to list objects' });
    }
  }

  /**
   * Create a new object in a context
   */
  private async _createObject(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { objectType, properties } = req.body;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      if (!objectType || !properties) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      // Create the object
      const objectHandle = await context.createObject(objectType, properties);
      
      res.status(201).json({
        handle: objectHandle,
        type: objectType,
        properties
      });
    } catch (error) {
      this._logger.error('Failed to create object', { error });
      res.status(500).json({ error: 'Failed to create object' });
    }
  }

  /**
   * Get an object by handle
   */
  private async _getObject(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id, objectId } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // Get the object metadata
      const objectMeta = context.objectRegistry.getObject(objectId);
      
      if (!objectMeta) {
        res.status(404).json({ error: 'Object not found' });
        return;
      }
      
      res.json(objectMeta);
    } catch (error) {
      this._logger.error('Failed to get object', { error });
      res.status(500).json({ error: 'Failed to get object' });
    }
  }

  /**
   * Delete an object
   */
  private async _deleteObject(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id, objectId } = req.params;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      // Delete the object
      await context.deleteObject(objectId);
      
      res.status(204).end();
    } catch (error) {
      this._logger.error('Failed to delete object', { error });
      res.status(500).json({ error: 'Failed to delete object' });
    }
  }

  /**
   * Execute a method on an object
   */
  private async _executeMethod(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id, objectId } = req.params;
      const { method, params } = req.body;
      const context = this._contextManager.getContext(id);
      
      if (!context) {
        res.status(404).json({ error: 'Context not found' });
        return;
      }
      
      if (!method) {
        res.status(400).json({ error: 'Missing method' });
        return;
      }
      
      // Execute the method
      const result = await context.executeMethod(objectId, method, params || []);
      
      res.json({ result });
    } catch (error) {
      this._logger.error('Failed to execute method', { error });
      res.status(500).json({ error: 'Failed to execute method' });
    }
  }
}
