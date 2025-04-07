import express from 'express';
import cors from 'cors';
import { AuthManager } from '../auth';
import { APIManager } from '../api';
import { ServerConfig } from '../config';
import { LogManager } from '../utils';

/**
 * Router class
 * Handles routing of incoming requests
 */
export class Router {
  private authManager: AuthManager;
  private apiManager: APIManager;
  private logManager: LogManager;
  
  /**
   * Constructor
   * @param authManager Authentication manager
   * @param apiManager API manager
   * @param logManager Log manager
   */
  constructor(
    authManager: AuthManager,
    apiManager: APIManager,
    logManager: LogManager
  ) {
    this.authManager = authManager;
    this.apiManager = apiManager;
    this.logManager = logManager;
  }
  
  /**
   * Register routes with the Express app
   * @param app The Express app
   */
  registerRoutes(app: express.Application): void {
    // Health check route
    app.get('/health', this.handleHealth.bind(this));
    
    // Authentication routes
    app.post('/auth/token', this.handleAuthToken.bind(this));
    app.post('/auth/revoke', this.handleAuthRevoke.bind(this));
    
    // API proxy routes
    app.all('/api/*', this.handleApiProxy.bind(this));
    
    // Webhook routes
    app.post('/webhooks/qlik', this.handleWebhook.bind(this));
    
    // Error handler
    app.use(this.handleError.bind(this));
  }
  
  /**
   * Handle health check requests
   * @param req The request
   * @param res The response
   */
  private handleHealth(req: express.Request, res: express.Response): void {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  }
  
  /**
   * Handle authentication token requests
   * @param req The request
   * @param res The response
   * @param next The next function
   */
  private async handleAuthToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const { type, ...credentials } = req.body;
      
      if (!type) {
        throw new Error('Authentication type is required');
      }
      
      const token = await this.authManager.authenticate(type, credentials);
      
      res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle authentication token revocation
   * @param req The request
   * @param res The response
   * @param next The next function
   */
  private async handleAuthRevoke(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const { type } = req.body;
      
      if (!type) {
        throw new Error('Authentication type is required');
      }
      
      await this.authManager.revokeToken(type);
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle API proxy requests
   * @param req The request
   * @param res The response
   * @param next The next function
   */
  private async handleApiProxy(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract path and remove '/api' prefix
      const path = req.path.replace(/^\/api/, '');
      
      // Get authentication type from header
      const authType = req.headers['x-auth-type'] as string || 'oauth2';
      
      // Prepare API request
      const apiRequest = {
        method: req.method,
        path,
        query: req.query as Record<string, string>,
        headers: this.extractHeaders(req),
        body: req.body
      };
      
      // Make API request
      const apiResponse = await this.apiManager.apiClient.request(apiRequest, authType);
      
      // Send response
      res.status(apiResponse.statusCode)
         .set(apiResponse.headers)
         .json(apiResponse.body);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle webhook events
   * @param req The request
   * @param res The response
   * @param next The next function
   */
  private async handleWebhook(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-qlik-signature'] as string;
      
      if (!signature) {
        throw new Error('Webhook signature is required');
      }
      
      // TODO: Implement webhook event handling
      // This will be implemented in step 006 (implement_webhook_event_handling)
      
      res.status(200).send('OK');
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle errors
   * @param error The error
   * @param req The request
   * @param res The response
   * @param next The next function
   */
  private handleError(error: any, req: express.Request, res: express.Response, next: express.NextFunction): void {
    // Log error
    this.logManager.logger.error('Request error:', error);
    
    // Determine status code
    let statusCode = 500;
    if (error.statusCode) {
      statusCode = error.statusCode;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
    } else if (error.name === 'AuthenticationError') {
      statusCode = 401;
    } else if (error.name === 'AuthorizationError') {
      statusCode = 403;
    } else if (error.name === 'ResourceNotFoundError') {
      statusCode = 404;
    } else if (error.name === 'RateLimitError') {
      statusCode = 429;
    }
    
    // Send error response
    res.status(statusCode).json({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error.details
      }
    });
  }
  
  /**
   * Extract headers from request
   * @param req The request
   * @returns Record of headers
   */
  private extractHeaders(req: express.Request): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Copy headers, excluding those we don't want to forward
    Object.entries(req.headers).forEach(([key, value]) => {
      if (
        key !== 'host' &&
        key !== 'connection' &&
        key !== 'content-length' &&
        !key.startsWith('x-auth-')
      ) {
        headers[key] = Array.isArray(value) ? value[0] : (value as string);
      }
    });
    
    return headers;
  }
}
