# Development Guide

This guide provides information for developers who want to extend or modify the Qlik Cloud MCP server.

## Project Structure

The Qlik Cloud MCP server follows a modular architecture based on SOLID and KISS principles. The project structure is organized as follows:

```
qlik-cloud-mcp/
├── src/
│   ├── auth/           # Authentication module
│   │   ├── types.ts    # Authentication interfaces and types
│   │   ├── oauth2-provider.ts  # OAuth2 authentication provider
│   │   ├── jwt-provider.ts     # JWT authentication provider
│   │   ├── api-key-provider.ts # API key authentication provider
│   │   ├── token-store.ts      # Token storage
│   │   ├── auth-manager.ts     # Authentication manager
│   │   └── index.ts    # Module exports
│   │
│   ├── api/            # API module
│   │   ├── types.ts    # API interfaces and types
│   │   ├── api-client.ts       # Base API client
│   │   ├── resource-client.ts  # Resource client interface and base implementation
│   │   ├── resource-clients.ts # Specific resource clients
│   │   ├── qlik-cloud-clients.ts       # Qlik Cloud specific clients
│   │   ├── qlik-cloud-clients-additional.ts  # Additional Qlik Cloud clients
│   │   ├── api-manager.ts      # API manager
│   │   ├── qlik-cloud-api-manager.ts   # Qlik Cloud API manager
│   │   └── index.ts    # Module exports
│   │
│   ├── events/         # Webhook event module
│   │   ├── types.ts    # Event interfaces and types
│   │   ├── webhook-manager.ts  # Webhook manager
│   │   ├── notification-handler.ts     # Notification handler
│   │   ├── app-event-handler.ts        # App event handler
│   │   ├── user-event-handler.ts       # User event handler
│   │   ├── system-event-handler.ts     # System event handler
│   │   └── index.ts    # Module exports
│   │
│   ├── config/         # Configuration module
│   │   ├── config-manager.ts   # Configuration manager
│   │   ├── server-config.ts    # Server configuration
│   │   └── index.ts    # Module exports
│   │
│   ├── utils/          # Utility functions
│   │   ├── log-manager.ts      # Logging utilities
│   │   ├── helpers.ts  # Helper functions
│   │   └── index.ts    # Module exports
│   │
│   ├── server/         # Server core
│   │   ├── router.ts   # Request routing
│   │   ├── server.ts   # Server implementation
│   │   └── index.ts    # Module exports
│   │
│   └── server.ts       # Entry point
│
├── dist/               # Compiled JavaScript
├── docs/               # Documentation
├── tests/              # Tests
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── package.json        # Package configuration
└── tsconfig.json       # TypeScript configuration
```

## Development Environment Setup

### Prerequisites

- Node.js 16 or later
- npm 7 or later
- Git

### Setup Steps

1. Clone the repository:

```bash
git clone https://github.com/yourusername/qlik-cloud-mcp.git
cd qlik-cloud-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file for local development:

```bash
cat > .env << EOF
# Server Configuration
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_BASE_URL=http://localhost:3000

# Authentication Configuration
MCP_AUTH_OAUTH2_ENABLED=true
MCP_AUTH_OAUTH2_CLIENT_ID=your-client-id
MCP_AUTH_OAUTH2_CLIENT_SECRET=your-client-secret
MCP_AUTH_OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token

# API Configuration
MCP_API_BASE_URL=https://your-tenant.us.qlikcloud.com
MCP_API_TIMEOUT=30000

# Webhook Configuration
MCP_WEBHOOK_SECRET=your-webhook-secret
EOF
```

4. Build the project:

```bash
npm run build
```

5. Start the server in development mode:

```bash
npm run dev
```

## Development Workflow

### Making Changes

1. Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes to the source code
3. Build the project:

```bash
npm run build
```

4. Test your changes:

```bash
npm test
```

5. Start the server to test manually:

```bash
npm run dev
```

6. Commit your changes:

```bash
git add .
git commit -m "Add your feature description"
```

7. Push your changes:

```bash
git push origin feature/your-feature-name
```

### Code Style

The project uses ESLint and Prettier for code style and formatting:

- Run linting:

```bash
npm run lint
```

- Fix linting issues:

```bash
npm run lint -- --fix
```

- Format code:

```bash
npm run format
```

## Extending the MCP Server

### Adding a New Authentication Provider

To add a new authentication provider:

1. Create a new file in the `src/auth` directory (e.g., `src/auth/new-provider.ts`)
2. Implement the `AuthProvider` interface
3. Update the `AuthManager` to support the new provider
4. Update the server configuration to include the new provider

Example:

```typescript
import { AuthProvider, AuthToken } from './types';

export interface NewProviderConfig {
  // Configuration options
}

export class NewProvider implements AuthProvider {
  constructor(config: NewProviderConfig) {
    // Initialize provider
  }

  async authenticate(credentials: any): Promise<AuthToken> {
    // Implement authentication
  }

  async refreshToken(token: AuthToken): Promise<AuthToken> {
    // Implement token refresh
  }

  async revokeToken(token: AuthToken): Promise<void> {
    // Implement token revocation
  }

  isTokenValid(token: AuthToken): boolean {
    // Implement token validation
  }
}
```

### Adding a New Resource Client

To add a new resource client:

1. Create a new interface for the resource in the appropriate file
2. Implement a new client class that extends `BaseResourceClient`
3. Update the API manager to support the new client

Example:

```typescript
import { BaseResourceClient } from './resource-client';

export interface NewResource {
  id: string;
  name: string;
  // Other properties
}

export class NewResourceClient extends BaseResourceClient<NewResource> {
  constructor(apiClient: any, authType: string) {
    super(apiClient, '/v1/new-resources', authType);
  }

  // Add custom methods for the resource
  async customMethod(id: string): Promise<any> {
    const response = await this.apiClient.request({
      method: 'POST',
      path: `${this.basePath}/${id}/custom-method`
    }, this.authType);
    
    return response.body;
  }
}
```

### Adding a New Webhook Event Handler

To add a new webhook event handler:

1. Create a new file in the `src/events` directory (e.g., `src/events/new-event-handler.ts`)
2. Implement the `WebhookHandler` interface
3. Register the handler with the webhook manager

Example:

```typescript
import { WebhookEvent, WebhookHandler } from './types';
import { LogManager } from '../utils';

export class NewEventHandler implements WebhookHandler {
  private logger: LogManager;
  
  constructor(logger: LogManager) {
    this.logger = logger;
  }
  
  async handleEvent(event: WebhookEvent): Promise<void> {
    this.logger.logger.info(`Handling event: ${event.type}`);
    
    // Implement event handling logic
    switch (event.type) {
      case 'new.event.type':
        // Handle specific event type
        break;
      default:
        this.logger.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }
  
  canHandle(eventType: string): boolean {
    // Specify which event types this handler can handle
    return eventType.startsWith('new.');
  }
}
```

## Testing

The project uses Jest for testing:

- Run all tests:

```bash
npm test
```

- Run tests with coverage:

```bash
npm test -- --coverage
```

- Run specific tests:

```bash
npm test -- --testPathPattern=auth
```

### Writing Tests

Tests are located in the `tests` directory, mirroring the structure of the `src` directory.

Example test:

```typescript
import { OAuth2Provider } from '../src/auth/oauth2-provider';

describe('OAuth2Provider', () => {
  let provider: OAuth2Provider;
  
  beforeEach(() => {
    provider = new OAuth2Provider({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenUrl: 'https://example.com/oauth/token'
    });
  });
  
  test('should authenticate successfully', async () => {
    // Mock axios or use a testing library like nock
    // Test authentication
    const token = await provider.authenticate({
      grantType: 'client_credentials'
    });
    
    expect(token).toBeDefined();
    expect(token.accessToken).toBeDefined();
  });
  
  // More tests...
});
```

## Building for Production

To build the project for production:

```bash
npm run build
```

This will compile the TypeScript code to JavaScript in the `dist` directory.

## Creating a Release

To create a new release:

1. Update the version in `package.json`:

```bash
npm version patch # or minor or major
```

2. Build the project:

```bash
npm run build
```

3. Create a Docker image:

```bash
docker build -t yourusername/qlik-cloud-mcp:latest .
docker tag yourusername/qlik-cloud-mcp:latest yourusername/qlik-cloud-mcp:x.y.z
```

4. Push the Docker image:

```bash
docker push yourusername/qlik-cloud-mcp:latest
docker push yourusername/qlik-cloud-mcp:x.y.z
```

5. Create a GitHub release:

```bash
git push origin main --tags
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

## Next Steps

After understanding the development process, you can:

1. Implement custom authentication providers
2. Add new resource clients for specific Qlik Cloud APIs
3. Create custom webhook event handlers
4. Extend the MCP server with additional functionality

For more information, see the following guides:

- [API Reference](./api-reference.md)
- [Webhook Events Guide](./webhook-events.md)
- [Troubleshooting Guide](./troubleshooting.md)
