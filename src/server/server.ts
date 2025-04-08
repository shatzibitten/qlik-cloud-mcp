import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ModelContextRouter } from './model-context-router';
import { WebSocketHandler } from './websocket-handler';
import { ModelContextManager } from '../model/model-context-manager';
import { AuthManager } from '../auth/auth-manager';
import { LogManager } from '../utils/log-manager';
import { ConfigManager } from '../config/config-manager';

/**
 * Server class for the Model Context Protocol server
 * 
 * This class sets up and manages the HTTP server, middleware,
 * routers, and WebSocket handlers for the MCP server.
 */
export class Server {
  private _app: express.Application;
  private _server: http.Server;
  private _contextManager: ModelContextManager;
  private _authManager: AuthManager;
  private _logger: LogManager;
  private _config: ConfigManager;
  private _contextRouter: ModelContextRouter;
  private _wsHandler: WebSocketHandler;
  private _port: number;

  /**
   * Creates a new Server instance
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
    this._port = config.get('server.port', 3000);
    
    // Create Express app
    this._app = express();
    
    // Create HTTP server
    this._server = http.createServer(this._app);
    
    // Set up middleware
    this._setupMiddleware();
    
    // Set up routers
    this._setupRouters();
    
    // Set up WebSocket handler
    this._wsHandler = new WebSocketHandler(
      this._server,
      this._contextManager,
      this._authManager,
      this._logger
    );
  }

  /**
   * Get the Express app
   */
  get app(): express.Application {
    return this._app;
  }

  /**
   * Get the HTTP server
   */
  get server(): http.Server {
    return this._server;
  }

  /**
   * Start the server
   * 
   * @returns Promise that resolves when the server is started
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this._server.listen(this._port, () => {
        this._logger.info(`Server started on port ${this._port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   * 
   * @returns Promise that resolves when the server is stopped
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._server.close((err) => {
        if (err) {
          this._logger.error('Error stopping server', { error: err });
          reject(err);
        } else {
          this._logger.info('Server stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Set up middleware
   */
  private _setupMiddleware(): void {
    // Parse JSON bodies
    this._app.use(express.json());
    
    // Parse URL-encoded bodies
    this._app.use(express.urlencoded({ extended: true }));
    
    // Enable CORS
    this._app.use(cors());
    
    // Enable security headers
    this._app.use(helmet());
    
    // Enable compression
    this._app.use(compression());
    
    // Add request logging
    this._app.use((req, res, next) => {
      this._logger.info(`${req.method} ${req.url}`);
      next();
    });
    
    // Add authentication middleware
    this._app.use(this._authMiddleware.bind(this));
  }

  /**
   * Set up routers
   */
  private _setupRouters(): void {
    // Create model context router
    this._contextRouter = new ModelContextRouter(
      this._contextManager,
      this._authManager,
      this._logger
    );
    
    // Set up API routes
    this._app.use('/api/v1/model', this._contextRouter.router);
    
    // Set up health check route
    this._app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
    
    // Set up catch-all route
    this._app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
    
    // Set up error handler
    this._app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this._logger.error('Server error', { error: err });
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Authentication middleware
   */
  private _authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
    // Skip authentication for health check
    if (req.path === '/health') {
      next();
      return;
    }
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Check if it's a Bearer token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Validate token (in a real implementation, this would verify the token)
      // For now, we'll just check if it's not empty
      if (!token) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      
      // Token is valid, continue
      next();
      return;
    }
    
    // Check if it's an API key
    const apiKey = req.headers['x-qlik-api-key'];
    
    if (apiKey) {
      // Validate API key (in a real implementation, this would verify the API key)
      // For now, we'll just check if it's not empty
      if (typeof apiKey !== 'string' || !apiKey) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }
      
      // API key is valid, continue
      next();
      return;
    }
    
    // No valid authentication found
    res.status(401).json({ error: 'Authentication required' });
  }
}
