import { ConfigManager } from './config-manager';

/**
 * Server configuration interface
 */
export interface ServerConfig {
  /**
   * Server port
   */
  port: number;
  
  /**
   * Server host
   */
  host: string;
  
  /**
   * Base URL for the server
   */
  baseUrl: string;
  
  /**
   * Authentication configuration
   */
  auth: {
    /**
     * OAuth2 configuration (optional)
     */
    oauth2?: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      tokenUrl: string;
    };
    
    /**
     * JWT configuration (optional)
     */
    jwt?: {
      enabled: boolean;
      key: string;
      algorithm: string;
      issuer: string;
      expiresIn?: number;
    };
    
    /**
     * API key configuration (optional)
     */
    apiKey?: {
      enabled: boolean;
      apiKey: string;
    };
  };
  
  /**
   * API configuration
   */
  api: {
    /**
     * Base URL for the Qlik Cloud API
     */
    baseUrl: string;
    
    /**
     * Request timeout in milliseconds
     */
    timeout: number;
    
    /**
     * Retry configuration
     */
    retry: {
      /**
       * Maximum number of retries
       */
      maxRetries: number;
      
      /**
       * Backoff factor for retries
       */
      backoffFactor: number;
      
      /**
       * Initial delay for retries in milliseconds
       */
      initialDelay: number;
    };
  };
  
  /**
   * Webhook configuration
   */
  webhook: {
    /**
     * Webhook secret for signature validation
     */
    secret: string;
    
    /**
     * Notification configuration
     */
    notifications: {
      /**
       * Slack webhook URL (optional)
       */
      slackWebhookUrl?: string;
      
      /**
       * Email recipients (optional)
       */
      emailRecipients?: string[];
    };
    
    /**
     * Email configuration (optional)
     */
    email?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      from: string;
    };
  };
  
  /**
   * Logging configuration
   */
  log: {
    /**
     * Log level
     */
    level: 'error' | 'warn' | 'info' | 'debug';
    
    /**
     * Log format
     */
    format: 'json' | 'simple';
  };
}

/**
 * Default server configuration
 */
export const defaultConfig: ServerConfig = {
  port: 3000,
  host: '0.0.0.0',
  baseUrl: 'http://localhost:3000',
  auth: {
    oauth2: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      tokenUrl: ''
    },
    jwt: {
      enabled: false,
      key: '',
      algorithm: 'HS256',
      issuer: '',
      expiresIn: 3600
    },
    apiKey: {
      enabled: false,
      apiKey: ''
    }
  },
  api: {
    baseUrl: '',
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

/**
 * Load server configuration from config manager
 * @param configManager Configuration manager
 * @returns Server configuration
 */
export function loadServerConfig(configManager: ConfigManager): ServerConfig {
  // Start with default configuration
  const config: ServerConfig = { ...defaultConfig };
  
  // Override with values from config manager
  config.port = configManager.get<number>('server.port', config.port);
  config.host = configManager.get<string>('server.host', config.host);
  config.baseUrl = configManager.get<string>('server.baseUrl', config.baseUrl);
  
  // Authentication configuration
  const oauth2Enabled = configManager.get<boolean>('auth.oauth2.enabled', false);
  if (oauth2Enabled) {
    config.auth.oauth2 = {
      enabled: true,
      clientId: configManager.get<string>('auth.oauth2.clientId', ''),
      clientSecret: configManager.get<string>('auth.oauth2.clientSecret', ''),
      tokenUrl: configManager.get<string>('auth.oauth2.tokenUrl', '')
    };
  } else {
    config.auth.oauth2 = undefined;
  }
  
  const jwtEnabled = configManager.get<boolean>('auth.jwt.enabled', false);
  if (jwtEnabled) {
    config.auth.jwt = {
      enabled: true,
      key: configManager.get<string>('auth.jwt.key', ''),
      algorithm: configManager.get<string>('auth.jwt.algorithm', 'HS256'),
      issuer: configManager.get<string>('auth.jwt.issuer', ''),
      expiresIn: configManager.get<number>('auth.jwt.expiresIn', 3600)
    };
  } else {
    config.auth.jwt = undefined;
  }
  
  const apiKeyEnabled = configManager.get<boolean>('auth.apiKey.enabled', false);
  if (apiKeyEnabled) {
    config.auth.apiKey = {
      enabled: true,
      apiKey: configManager.get<string>('auth.apiKey.apiKey', '')
    };
  } else {
    config.auth.apiKey = undefined;
  }
  
  // API configuration
  config.api.baseUrl = configManager.get<string>('api.baseUrl', config.api.baseUrl);
  config.api.timeout = configManager.get<number>('api.timeout', config.api.timeout);
  config.api.retry.maxRetries = configManager.get<number>('api.retry.maxRetries', config.api.retry.maxRetries);
  config.api.retry.backoffFactor = configManager.get<number>('api.retry.backoffFactor', config.api.retry.backoffFactor);
  config.api.retry.initialDelay = configManager.get<number>('api.retry.initialDelay', config.api.retry.initialDelay);
  
  // Webhook configuration
  config.webhook.secret = configManager.get<string>('webhook.secret', config.webhook.secret);
  
  const slackWebhookUrl = configManager.get<string>('webhook.notifications.slackWebhookUrl', '');
  if (slackWebhookUrl) {
    config.webhook.notifications.slackWebhookUrl = slackWebhookUrl;
  }
  
  const emailRecipients = configManager.get<string[]>('webhook.notifications.emailRecipients', []);
  if (emailRecipients.length > 0) {
    config.webhook.notifications.emailRecipients = emailRecipients;
  }
  
  const emailEnabled = configManager.get<boolean>('webhook.email.enabled', false);
  if (emailEnabled) {
    config.webhook.email = {
      host: configManager.get<string>('webhook.email.host', ''),
      port: configManager.get<number>('webhook.email.port', 587),
      secure: configManager.get<boolean>('webhook.email.secure', false),
      auth: {
        user: configManager.get<string>('webhook.email.auth.user', ''),
        pass: configManager.get<string>('webhook.email.auth.pass', '')
      },
      from: configManager.get<string>('webhook.email.from', '')
    };
  } else {
    config.webhook.email = undefined;
  }
  
  // Logging configuration
  config.log.level = configManager.get<'error' | 'warn' | 'info' | 'debug'>('log.level', config.log.level);
  config.log.format = configManager.get<'json' | 'simple'>('log.format', config.log.format);
  
  return config;
}

/**
 * Validate server configuration
 * @param config Server configuration
 * @throws Error if configuration is invalid
 */
export function validateServerConfig(config: ServerConfig): void {
  // Validate API configuration
  if (!config.api.baseUrl) {
    throw new Error('API base URL is required');
  }
  
  // Validate authentication configuration
  if (!config.auth.oauth2 && !config.auth.jwt && !config.auth.apiKey) {
    throw new Error('At least one authentication method must be enabled');
  }
  
  if (config.auth.oauth2?.enabled) {
    if (!config.auth.oauth2.clientId) {
      throw new Error('OAuth2 client ID is required');
    }
    if (!config.auth.oauth2.clientSecret) {
      throw new Error('OAuth2 client secret is required');
    }
    if (!config.auth.oauth2.tokenUrl) {
      throw new Error('OAuth2 token URL is required');
    }
  }
  
  if (config.auth.jwt?.enabled) {
    if (!config.auth.jwt.key) {
      throw new Error('JWT key is required');
    }
    if (!config.auth.jwt.issuer) {
      throw new Error('JWT issuer is required');
    }
  }
  
  if (config.auth.apiKey?.enabled) {
    if (!config.auth.apiKey.apiKey) {
      throw new Error('API key is required');
    }
  }
  
  // Validate webhook configuration
  if (!config.webhook.secret) {
    throw new Error('Webhook secret is required');
  }
  
  if (config.webhook.email) {
    if (!config.webhook.email.host) {
      throw new Error('Email host is required');
    }
    if (!config.webhook.email.auth.user) {
      throw new Error('Email user is required');
    }
    if (!config.webhook.email.auth.pass) {
      throw new Error('Email password is required');
    }
    if (!config.webhook.email.from) {
      throw new Error('Email from address is required');
    }
  }
}
