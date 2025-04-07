# API Integration Module Design

## Overview

The API Integration Module is responsible for handling communication with Qlik Cloud REST APIs. It provides a unified interface for making authenticated requests to various Qlik Cloud API endpoints.

## Components

### APIClient

The `APIClient` is the base client for making API requests:

```typescript
class APIClient {
  private baseUrl: string;
  private authManager: AuthManager;
  
  constructor(baseUrl: string, authManager: AuthManager) {
    this.baseUrl = baseUrl;
    this.authManager = authManager;
  }
  
  /**
   * Make an authenticated request to the API
   * @param request The API request
   * @param authType The authentication type to use
   * @returns Promise resolving to the API response
   */
  async request(request: APIRequest, authType: string): Promise<APIResponse> {
    // Get authentication token
    const token = await this.authManager.getToken(authType);
    
    // Prepare request with authentication
    const headers = {
      ...request.headers,
      'Authorization': `${token.tokenType} ${token.accessToken}`
    };
    
    // Make the request
    try {
      const response = await fetch(`${this.baseUrl}${request.path}`, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined
      });
      
      // Parse response
      const body = await response.json();
      
      return {
        statusCode: response.status,
        headers: this.extractHeaders(response),
        body
      };
    } catch (error) {
      throw new APIError('Request failed', { cause: error });
    }
  }
  
  /**
   * Extract headers from response
   * @param response The fetch response
   * @returns Record of headers
   */
  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }
}
```

### ResourceClient Interface

The `ResourceClient` interface defines the contract for resource-specific clients:

```typescript
interface ResourceClient<T> {
  /**
   * Get all resources
   * @param params Query parameters
   * @returns Promise resolving to an array of resources
   */
  getAll(params?: Record<string, string>): Promise<T[]>;
  
  /**
   * Get a resource by ID
   * @param id The resource ID
   * @returns Promise resolving to the resource
   */
  getById(id: string): Promise<T>;
  
  /**
   * Create a new resource
   * @param data The resource data
   * @returns Promise resolving to the created resource
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update a resource
   * @param id The resource ID
   * @param data The resource data
   * @returns Promise resolving to the updated resource
   */
  update(id: string, data: Partial<T>): Promise<T>;
  
  /**
   * Delete a resource
   * @param id The resource ID
   * @returns Promise resolving when the resource is deleted
   */
  delete(id: string): Promise<void>;
}
```

### BaseResourceClient

The `BaseResourceClient` provides a base implementation of the `ResourceClient` interface:

```typescript
abstract class BaseResourceClient<T> implements ResourceClient<T> {
  protected apiClient: APIClient;
  protected basePath: string;
  protected authType: string;
  
  constructor(apiClient: APIClient, basePath: string, authType: string) {
    this.apiClient = apiClient;
    this.basePath = basePath;
    this.authType = authType;
  }
  
  async getAll(params?: Record<string, string>): Promise<T[]> {
    const queryString = params ? this.buildQueryString(params) : '';
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}${queryString}`
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to get resources: ${response.body.message}`);
    }
    
    return response.body.data || [];
  }
  
  async getById(id: string): Promise<T> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}`
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to get resource: ${response.body.message}`);
    }
    
    return response.body;
  }
  
  async create(data: Partial<T>): Promise<T> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: this.basePath,
      body: data
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to create resource: ${response.body.message}`);
    }
    
    return response.body;
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    const response = await this.apiClient.request({
      method: 'PATCH',
      path: `${this.basePath}/${id}`,
      body: data
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to update resource: ${response.body.message}`);
    }
    
    return response.body;
  }
  
  async delete(id: string): Promise<void> {
    const response = await this.apiClient.request({
      method: 'DELETE',
      path: `${this.basePath}/${id}`
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to delete resource: ${response.body.message}`);
    }
  }
  
  /**
   * Build query string from parameters
   * @param params Query parameters
   * @returns Formatted query string
   */
  protected buildQueryString(params: Record<string, string>): string {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      queryParams.append(key, value);
    }
    return `?${queryParams.toString()}`;
  }
}
```

### Resource-Specific Clients

#### APIKeyClient

```typescript
interface APIKey {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  createdByUser: string;
  expiresAt?: string;
  lastUsedAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

class APIKeyClient extends BaseResourceClient<APIKey> {
  constructor(apiClient: APIClient, authType: string) {
    super(apiClient, '/v1/api-keys', authType);
  }
  
  /**
   * Revoke an API key
   * @param id The API key ID
   * @returns Promise resolving when the API key is revoked
   */
  async revoke(id: string): Promise<void> {
    await this.update(id, { status: 'revoked' });
  }
}
```

#### AppsClient

```typescript
interface App {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  lastReloadTime?: string;
  createdDate: string;
  modifiedDate: string;
  owner: string;
  published: boolean;
}

class AppsClient extends BaseResourceClient<App> {
  constructor(apiClient: APIClient, authType: string) {
    super(apiClient, '/v1/apps', authType);
  }
  
  /**
   * Get app metadata
   * @param id The app ID
   * @returns Promise resolving to the app metadata
   */
  async getMetadata(id: string): Promise<Record<string, any>> {
    const response = await this.apiClient.request({
      method: 'GET',
      path: `${this.basePath}/${id}/metadata`
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to get app metadata: ${response.body.message}`);
    }
    
    return response.body;
  }
  
  /**
   * Reload an app
   * @param id The app ID
   * @returns Promise resolving when the app is reloaded
   */
  async reload(id: string): Promise<void> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/reload`
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to reload app: ${response.body.message}`);
    }
  }
}
```

#### AuditsClient

```typescript
interface Audit {
  id: string;
  timestamp: string;
  action: string;
  objectType: string;
  objectId: string;
  userId: string;
  userType: string;
  tenantId: string;
  details: Record<string, any>;
}

class AuditsClient extends BaseResourceClient<Audit> {
  constructor(apiClient: APIClient, authType: string) {
    super(apiClient, '/v1/audits', authType);
  }
  
  /**
   * Search audits
   * @param query The search query
   * @returns Promise resolving to matching audits
   */
  async search(query: Record<string, any>): Promise<Audit[]> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/search`,
      body: query
    }, this.authType);
    
    if (response.statusCode >= 400) {
      throw new APIError(`Failed to search audits: ${response.body.message}`);
    }
    
    return response.body.data || [];
  }
}
```

### APIManager

The `APIManager` is a factory for creating and managing API clients:

```typescript
class APIManager {
  private apiClient: APIClient;
  private clients: Map<string, ResourceClient<any>>;
  
  constructor(baseUrl: string, authManager: AuthManager) {
    this.apiClient = new APIClient(baseUrl, authManager);
    this.clients = new Map();
  }
  
  /**
   * Get an API client for a specific resource
   * @param resourceType The resource type
   * @param authType The authentication type to use
   * @returns The resource client
   */
  getClient<T>(resourceType: string, authType: string): ResourceClient<T> {
    const key = `${resourceType}:${authType}`;
    
    if (!this.clients.has(key)) {
      this.clients.set(key, this.createClient(resourceType, authType));
    }
    
    return this.clients.get(key) as ResourceClient<T>;
  }
  
  /**
   * Create a new client for a resource type
   * @param resourceType The resource type
   * @param authType The authentication type to use
   * @returns The created client
   */
  private createClient(resourceType: string, authType: string): ResourceClient<any> {
    switch (resourceType) {
      case 'api-keys':
        return new APIKeyClient(this.apiClient, authType);
      case 'apps':
        return new AppsClient(this.apiClient, authType);
      case 'audits':
        return new AuditsClient(this.apiClient, authType);
      // Add more resource types as needed
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
  }
}
```

## Data Models

### APIRequest

```typescript
interface APIRequest {
  /**
   * The HTTP method
   */
  method: string;
  
  /**
   * The API path
   */
  path: string;
  
  /**
   * Query parameters (optional)
   */
  query?: Record<string, string>;
  
  /**
   * Request headers (optional)
   */
  headers?: Record<string, string>;
  
  /**
   * Request body (optional)
   */
  body?: any;
}
```

### APIResponse

```typescript
interface APIResponse {
  /**
   * The HTTP status code
   */
  statusCode: number;
  
  /**
   * Response headers
   */
  headers: Record<string, string>;
  
  /**
   * Response body
   */
  body: any;
}
```

## Error Handling

The API Integration Module defines the following error types:

1. **APIError**: Base error for API-related issues.
2. **RequestError**: Error during request preparation or sending.
3. **ResponseError**: Error processing the API response.
4. **ResourceNotFoundError**: Resource not found (404).
5. **AuthorizationError**: Authorization failed (401/403).
6. **ValidationError**: Request validation failed (400).
7. **RateLimitError**: Rate limit exceeded (429).
8. **ServerError**: Server-side error (500+).

All errors include appropriate error codes, messages, and details to aid in troubleshooting.

## Retry and Circuit Breaking

The API Integration Module includes retry logic and circuit breaking to handle transient failures:

```typescript
class RetryPolicy {
  private maxRetries: number;
  private backoffFactor: number;
  private initialDelay: number;
  
  constructor(maxRetries: number = 3, backoffFactor: number = 2, initialDelay: number = 100) {
    this.maxRetries = maxRetries;
    this.backoffFactor = backoffFactor;
    this.initialDelay = initialDelay;
  }
  
  /**
   * Execute a function with retry
   * @param fn The function to execute
   * @returns Promise resolving to the function result
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if this is the last attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Don't retry certain errors
        if (!this.isRetryable(error)) {
          break;
        }
        
        // Wait before retrying
        const delay = this.initialDelay * Math.pow(this.backoffFactor, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  /**
   * Check if an error is retryable
   * @param error The error to check
   * @returns Boolean indicating if the error is retryable
   */
  private isRetryable(error: any): boolean {
    // Retry network errors and 5xx errors
    if (error instanceof TypeError || error.message.includes('network')) {
      return true;
    }
    
    if (error instanceof APIError) {
      const statusCode = error.statusCode;
      return statusCode >= 500 || statusCode === 429;
    }
    
    return false;
  }
}
```

## Configuration

The API Integration Module is configured through environment variables or configuration files:

```typescript
interface APIManagerConfig {
  /**
   * Base URL for the Qlik Cloud API
   */
  baseUrl: string;
  
  /**
   * Retry policy configuration
   */
  retry?: {
    maxRetries: number;
    backoffFactor: number;
    initialDelay: number;
  };
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
}
```

## Usage Example

```typescript
// Create auth manager
const authManager = new AuthManager({
  oauth2: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    tokenUrl: 'https://your-tenant.us.qlikcloud.com/oauth/token'
  }
});

// Create API manager
const apiManager = new APIManager('https://your-tenant.us.qlikcloud.com/api', authManager);

// Get API keys client
const apiKeysClient = apiManager.getClient<APIKey>('api-keys', 'oauth2');

// Get all API keys
const apiKeys = await apiKeysClient.getAll();

// Create a new API key
const newApiKey = await apiKeysClient.create({
  title: 'My API Key',
  description: 'Created via MCP server'
});

// Get an app client
const appsClient = apiManager.getClient<App>('apps', 'oauth2');

// Get all apps
const apps = await appsClient.getAll();

// Get app by ID
const app = await appsClient.getById('app-id');

// Reload an app
await (appsClient as AppsClient).reload('app-id');
```
