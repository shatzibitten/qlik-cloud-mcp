import express from 'express';
import cors from 'cors';
import { AuthManager } from '../auth';
import { APIManager } from '../api';
import { ServerConfig } from '../config';
import { LogManager } from '../utils';
import { Router } from './router';

/**
 * Server class
 * Main server application
 */
export class Server {
  private app: express.Application;
  private config: ServerConfig;
  private authManager: AuthManager;
  private apiManager: APIManager;
  private logManager: LogManager;
  private router: Router;
  private server: any;
  
  /**
   * Constructor
   * @param config Server configuration
   */
  constructor(config: ServerConfig) {
    this.config = config;
    
    // Initialize Express app
    this.app = express();
    
    // Initialize logging
    this.logManager = new LogManager(this.config.log);
    
    // Initialize authentication
    this.authManager = new AuthManager({
      oauth2: this.config.auth.oauth2,
      jwt: this.config.auth.jwt,
      apiKey: this.config.auth.apiKey
    });
    
    // Initialize API integration
    this.apiManager = new APIManager(
      this.config.api.baseUrl,
      this.authManager,
      {
        timeout: this.config.api.timeout,
        maxRetries: this.config.api.retry.maxRetries,
        initialRetryDelay: this.config.api.retry.initialDelay,
        retryBackoffFactor: this.config.api.retry.backoffFactor
      }
    );
    
    // Initialize router
    this.router = new Router(
      this.authManager,
      this.apiManager,
      this.logManager
    );
    
    // Configure middleware
    this.configureMiddleware();
    
    // Register routes
    this.router.registerRoutes(this.app);
  }
  
  /**
   * Configure Express middleware
   */
  private configureMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Enable CORS
    this.app.use(cors());
    
    // Request logging
    this.app.use(this.logManager.requestLogger());
  }
  
  /**
   * Start the server
   * @returns Promise resolving when the server is started
   */
  async start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        this.logManager.logger.info(`Server started on ${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }
  
  /**
   * Stop the server
   * @returns Promise resolving when the server is stopped
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }
    
    return new Promise<void>((resolve, reject) => {
      this.server.close((err: Error) => {
        if (err) {
          this.logManager.logger.error('Error stopping server:', err);
          reject(err);
        } else {
          this.logManager.logger.info('Server stopped');
          resolve();
        }
      });
    });
  }
  
  /**
   * Get the Express app
   * @returns The Express app
   */
  getApp(): express.Application {
    return this.app;
  }
  
  /**
   * Get the authentication manager
   * @returns The authentication manager
   */
  getAuthManager(): AuthManager {
    return this.authManager;
  }
  
  /**
   * Get the API manager
   * @returns The API manager
   */
  getAPIManager(): APIManager {
    return this.apiManager;
  }
  
  /**
   * Get the log manager
   * @returns The log manager
   */
  getLogManager(): LogManager {
    return this.logManager;
  }
}
