# Server Core Module Design

## Overview

The Server Core Module is the central component of the Qlik Cloud MCP server. It ties together all other modules and provides the external interface for clients to interact with the server.

## Components

### Server

The `Server` class is the main entry point for the application:

```typescript
class Server {
  private router: Router;
  private configManager: ConfigManager;
  private authManager: AuthManager;
  private apiManager: APIManager;
  private eventListener: EventListener;
  private logManager: LogManager;
  
  constructor(config: ServerConfig) {
    // Initialize configuration
    this.configManager = new ConfigManager(config);
    
    // Initialize logging
    this.logManager = new LogManager(this.configManager.getLogConfig());
    
    // Initialize authentication
    this.authManager = new AuthManager(this.configManager.getAuthConfig());
    
    // Initialize API integration
    this.apiManager = new APIManager(
      this.configManager.getApiConfig().baseUrl,
      this.authManager
    );
    
    // Initialize event handling
    const eventProcessor = new EventProcessor();
    this.eventListener = new EventListener(
      this.configManager.getWebhookConfig().secret,
      eventProcessor
    );
    
    // Register event handlers
    this.registerEventHandlers(eventProcessor);
    
    // Initialize router
    this.router = new Router(
      this.authManager,
      this.apiManager,
      this.eventListener
    );
  }
  
  /**
   * Start the server
   * @param port The port to listen on
   * @returns Promise resolving when the server is started
   */
  async start(port: number): Promise<void> {
    try {
      // Initialize Express app
      const app = express();
      
      // Configure middleware
      app.use(express.json());
      app.use(cors());
      app.use(this.logManager.requestLogger());
      
      // Register routes
      this.router.registerRoutes(app);
      
      // Start listening
      await new Promise<void>((resolve) => {
        app.listen(port, () => {
          this.logManager.logger.info(`Server started on port ${port}`);
          resolve();
        });
      });
    } catch (error) {
      this.logManager.logger.error('Failed to start server:', error);
      throw error;
    }
  }
  
  /**
   * Stop the server
   * @returns Promise resolving when the server is stopped
   */
  async stop(): Promise<void> {
    // Cleanup resources
    this.logManager.logger.info('Server stopping...');
    // Additional cleanup as needed
  }
  
  /**
   * Register event handlers
   * @param eventProcessor The event processor
   */
  private registerEventHandlers(eventProcessor: EventProcessor): void {
    // Create notification manager
    const notificationManager = new NotificationManager();
    
    // Register notification channels
    const webhookConfig = this.configManager.getWebhookConfig();
    if (webhookConfig.notifications?.slackWebhookUrl) {
      notificationManager.registerChannel(
        new SlackNotificationChannel(webhookConfig.notifications.slackWebhookUrl)
      );
    }
    
    if (webhookConfig.notifications?.emailRecipients && webhookConfig.email) {
      const emailService = new EmailService(webhookConfig.email);
      notificationManager.registerChannel(
        new EmailNotificationChannel(emailService, webhookConfig.notifications.emailRecipients)
      );
    }
    
    // Register event handlers
    eventProcessor.registerHandler(new AppCreatedHandler(notificationManager));
    eventProcessor.registerHandler(new UserAddedHandler(notificationManager));
    // Register more handlers as needed
  }
}
```

### Router

The `Router` class handles routing of incoming requests:

```typescript
class Router {
  private authManager: AuthManager;
  private apiManager: APIManager;
  private eventListener: EventListener;
  
  constructor(
    authManager: AuthManager,
    apiManager: APIManager,
    eventListener: EventListener
  ) {
    this.authManager = authManager;
    this.apiManager = apiManager;
    this.eventListener = eventListener;
  }
  
  /**
   * Register routes with the Express app
   * @param app The Express app
   */
  registerRoutes(app: express.Application): void {
    // Health check route
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
    
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
   * Handle authentication token requests
   * @param req The request
   * @param res The response
   */
  private async handleAuthToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const { type, ...credentials } = req.body;
      
      if (!type) {
        throw new ValidationError('Authentication type is required');
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
   */
  private async handleAuthRevoke(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const { type } = req.body;
      
      if (!type) {
        throw new ValidationError('Authentication type is required');
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
   */
  private async handleApiProxy(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract path and remove '/api' prefix
      const path = req.path.replace(/^\/api/, '');
      
      // Get authentication type from header
      const authType = req.headers['x-auth-type'] as string || 'oauth2';
      
      // Prepare API request
      const apiRequest: APIRequest = {
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
   */
  private async handleWebhook(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-qlik-signature'] as string;
      
      if (!signature) {
        throw new ValidationError('Webhook signature is required');
      }
      
      await this.eventListener.handleEvent(req.body, signature);
      
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
    // Determine status code
    let statusCode = 500;
    if (error instanceof ValidationError) {
      statusCode = 400;
    } else if (error instanceof AuthenticationError) {
      statusCode = 401;
    } else if (error instanceof AuthorizationError) {
      statusCode = 403;
    } else if (error instanceof ResourceNotFoundError) {
      statusCode = 404;
    } else if (error instanceof RateLimitError) {
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
```

### ConfigManager

The `ConfigManager` manages server configuration:

```typescript
class ConfigManager {
  private config: ServerConfig;
  
  constructor(config: ServerConfig) {
    this.config = this.mergeWithDefaults(config);
    this.validateConfig();
  }
  
  /**
   * Get authentication configuration
   * @returns Authentication configuration
   */
  getAuthConfig(): AuthManagerConfig {
    return this.config.auth;
  }
  
  /**
   * Get API configuration
   * @returns API configuration
   */
  getApiConfig(): APIManagerConfig {
    return this.config.api;
  }
  
  /**
   * Get webhook configuration
   * @returns Webhook configuration
   */
  getWebhookConfig(): WebhookConfig {
    return this.config.webhook;
  }
  
  /**
   * Get logging configuration
   * @returns Logging configuration
   */
  getLogConfig(): LogManagerConfig {
    return this.config.log;
  }
  
  /**
   * Merge configuration with defaults
   * @param config The configuration
   * @returns Merged configuration
   */
  private mergeWithDefaults(config: ServerConfig): ServerConfig {
    // Default configuration
    const defaults: ServerConfig = {
      auth: {
        // Default auth config
      },
      api: {
        baseUrl: 'https://api.qlik.com',
        timeout: 30000,
        retry: {
          maxRetries: 3,
          backoffFactor: 2,
          initialDelay: 100
        }
      },
      webhook: {
        secret: '',
        notifications: {}
      },
      log: {
        level: 'info',
        format: 'json'
      }
    };
    
    // Merge with provided config
    return {
      ...defaults,
      ...config,
      auth: {
        ...defaults.auth,
        ...config.auth
      },
      api: {
        ...defaults.api,
        ...config.api,
        retry: {
          ...defaults.api.retry,
          ...config.api?.retry
        }
      },
      webhook: {
        ...defaults.webhook,
        ...config.webhook,
        notifications: {
          ...defaults.webhook.notifications,
          ...config.webhook?.notifications
        }
      },
      log: {
        ...defaults.log,
        ...config.log
      }
    };
  }
  
  /**
   * Validate configuration
   * @throws Error if configuration is invalid
   */
  private validateConfig(): void {
    // Validate API configuration
    if (!this.config.api.baseUrl) {
      throw new Error('API base URL is required');
    }
    
    // Validate webhook configuration
    if (!this.config.webhook.secret) {
      throw new Error('Webhook secret is required');
    }
    
    // Additional validation as needed
  }
}
```

### LogManager

The `LogManager` handles logging:

```typescript
class LogManager {
  public logger: any; // Winston logger
  
  constructor(config: LogManagerConfig) {
    // Initialize Winston logger
    this.logger = winston.createLogger({
      level: config.level,
      format: config.format === 'json' ? winston.format.json() : winston.format.simple(),
      transports: [
        new winston.transports.Console()
      ]
    });
  }
  
  /**
   * Create request logger middleware
   * @returns Express middleware
   */
  requestLogger(): express.RequestHandler {
    return (req, res, next) => {
      const start = Date.now();
      
      // Log request
      this.logger.info(`${req.method} ${req.path} started`);
      
      // Log response
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      
      next();
    };
  }
}
```

## Data Models

### ServerConfig

```typescript
interface ServerConfig {
  /**
   * Authentication configuration
   */
  auth: AuthManagerConfig;
  
  /**
   * API configuration
   */
  api: APIManagerConfig;
  
  /**
   * Webhook configuration
   */
  webhook: WebhookConfig;
  
  /**
   * Logging configuration
   */
  log: LogManagerConfig;
}
```

### LogManagerConfig

```typescript
interface LogManagerConfig {
  /**
   * Log level
   */
  level: 'error' | 'warn' | 'info' | 'debug';
  
  /**
   * Log format
   */
  format: 'json' | 'simple';
}
```

## Error Handling

The Server Core Module defines the following error types:

1. **ServerError**: Base error for server-related issues.
2. **ConfigurationError**: Error in server configuration.
3. **ValidationError**: Request validation failed.
4. **AuthenticationError**: Authentication failed.
5. **AuthorizationError**: Authorization failed.
6. **ResourceNotFoundError**: Resource not found.
7. **RateLimitError**: Rate limit exceeded.

All errors include appropriate error codes, messages, and details to aid in troubleshooting.

## Configuration

The Server Core Module is configured through environment variables or configuration files:

```typescript
// Load configuration from environment variables
const config: ServerConfig = {
  auth: {
    oauth2: process.env.OAUTH2_ENABLED === 'true' ? {
      clientId: process.env.OAUTH2_CLIENT_ID!,
      clientSecret: process.env.OAUTH2_CLIENT_SECRET!,
      tokenUrl: process.env.OAUTH2_TOKEN_URL!
    } : undefined,
    jwt: process.env.JWT_ENABLED === 'true' ? {
      key: process.env.JWT_KEY!,
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      issuer: process.env.JWT_ISSUER!
    } : undefined,
    apiKey: process.env.API_KEY_ENABLED === 'true' ? {
      apiKey: process.env.API_KEY!
    } : undefined
  },
  api: {
    baseUrl: process.env.API_BASE_URL!,
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retry: {
      maxRetries: parseInt(process.env.API_MAX_RETRIES || '3'),
      backoffFactor: parseFloat(process.env.API_BACKOFF_FACTOR || '2'),
      initialDelay: parseInt(process.env.API_INITIAL_DELAY || '100')
    }
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET!,
    notifications: {
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      emailRecipients: process.env.EMAIL_RECIPIENTS?.split(',')
    },
    email: process.env.EMAIL_ENABLED === 'true' ? {
      host: process.env.EMAIL_HOST!,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!
      },
      from: process.env.EMAIL_FROM!
    } : undefined
  },
  log: {
    level: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
    format: (process.env.LOG_FORMAT || 'json') as 'json' | 'simple'
  }
};
```

## Usage Example

```typescript
// Create and start server
const server = new Server(config);

server.start(3000)
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await server.stop();
  process.exit(0);
});
```
