# Configuration Guide

This guide provides detailed information on configuring the Qlik Cloud MCP server.

## Configuration Methods

The Qlik Cloud MCP server supports multiple configuration methods:

1. Environment variables
2. Configuration files (JSON)
3. Command-line arguments

Configuration values are loaded in the following order, with later methods overriding earlier ones:

1. Default values
2. Configuration file
3. Environment variables
4. Command-line arguments

## Environment Variables

Environment variables are the most flexible way to configure the server, especially in containerized environments. All environment variables should be prefixed with `MCP_`.

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_SERVER_PORT` | Server port | `3000` |
| `MCP_SERVER_HOST` | Server host | `0.0.0.0` |
| `MCP_SERVER_BASE_URL` | Base URL for the server | `http://localhost:3000` |

### Authentication Configuration

#### OAuth2

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_AUTH_OAUTH2_ENABLED` | Enable OAuth2 authentication | `false` |
| `MCP_AUTH_OAUTH2_CLIENT_ID` | OAuth2 client ID | - |
| `MCP_AUTH_OAUTH2_CLIENT_SECRET` | OAuth2 client secret | - |
| `MCP_AUTH_OAUTH2_TOKEN_URL` | OAuth2 token URL | - |

#### JWT

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_AUTH_JWT_ENABLED` | Enable JWT authentication | `false` |
| `MCP_AUTH_JWT_KEY` | JWT signing key | - |
| `MCP_AUTH_JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `MCP_AUTH_JWT_ISSUER` | JWT issuer | - |
| `MCP_AUTH_JWT_EXPIRES_IN` | JWT expiration time in seconds | `3600` |

#### API Key

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_AUTH_API_KEY_ENABLED` | Enable API key authentication | `false` |
| `MCP_AUTH_API_KEY_API_KEY` | API key | - |

### API Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_API_BASE_URL` | Base URL for the Qlik Cloud API | - |
| `MCP_API_TIMEOUT` | Request timeout in milliseconds | `30000` |
| `MCP_API_RETRY_MAX_RETRIES` | Maximum number of retries | `3` |
| `MCP_API_RETRY_BACKOFF_FACTOR` | Backoff factor for retries | `2` |
| `MCP_API_RETRY_INITIAL_DELAY` | Initial delay for retries in milliseconds | `100` |

### Webhook Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_WEBHOOK_SECRET` | Webhook secret for signature validation | - |
| `MCP_WEBHOOK_NOTIFICATIONS_SLACK_WEBHOOK_URL` | Slack webhook URL for notifications | - |
| `MCP_WEBHOOK_NOTIFICATIONS_EMAIL_RECIPIENTS` | Email recipients for notifications (comma-separated) | - |

### Logging Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_LOG_LEVEL` | Log level (error, warn, info, debug) | `info` |
| `MCP_LOG_FORMAT` | Log format (json, simple) | `json` |

## Configuration File

You can also use a JSON configuration file. By default, the server looks for a file named `config.json` in the current directory or in a `config` subdirectory.

Example configuration file:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "baseUrl": "http://localhost:3000"
  },
  "auth": {
    "oauth2": {
      "enabled": true,
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "tokenUrl": "https://your-tenant.us.qlikcloud.com/oauth/token"
    },
    "jwt": {
      "enabled": false,
      "key": "",
      "algorithm": "HS256",
      "issuer": "",
      "expiresIn": 3600
    },
    "apiKey": {
      "enabled": false,
      "apiKey": ""
    }
  },
  "api": {
    "baseUrl": "https://your-tenant.us.qlikcloud.com",
    "timeout": 30000,
    "retry": {
      "maxRetries": 3,
      "backoffFactor": 2,
      "initialDelay": 100
    }
  },
  "webhook": {
    "secret": "your-webhook-secret",
    "notifications": {
      "slackWebhookUrl": "https://hooks.slack.com/services/your-slack-webhook-url",
      "emailRecipients": ["user1@example.com", "user2@example.com"]
    }
  },
  "log": {
    "level": "info",
    "format": "json"
  }
}
```

## Command-Line Arguments

When running the server, you can specify a configuration file using the `--config` flag:

```bash
qlik-cloud-mcp --config /path/to/config.json
```

## Configuration Validation

The server validates the configuration at startup and will exit with an error if the configuration is invalid. The following validations are performed:

- API base URL is required
- At least one authentication method must be enabled
- If OAuth2 is enabled, client ID, client secret, and token URL are required
- If JWT is enabled, key and issuer are required
- If API key is enabled, API key is required
- Webhook secret is required

## Environment-Specific Configuration

For different environments (development, staging, production), you can use different configuration files or environment variables.

### Development

```bash
# Use a development configuration file
qlik-cloud-mcp --config config.dev.json
```

### Staging

```bash
# Use a staging configuration file
qlik-cloud-mcp --config config.staging.json
```

### Production

```bash
# Use a production configuration file
qlik-cloud-mcp --config config.prod.json
```

## Sensitive Information

For sensitive information like client secrets and API keys, it's recommended to use environment variables instead of configuration files, especially in production environments.

```bash
# Set sensitive information as environment variables
export MCP_AUTH_OAUTH2_CLIENT_SECRET=your-client-secret
export MCP_WEBHOOK_SECRET=your-webhook-secret

# Start the server with non-sensitive configuration
qlik-cloud-mcp --config config.prod.json
```

## Next Steps

After configuring the Qlik Cloud MCP server, you should:

1. Set up authentication with your Qlik Cloud tenant
2. Configure webhook events in Qlik Cloud
3. Test API requests through the MCP server

For more information, see the following guides:

- [Authentication Guide](./authentication.md)
- [API Reference](./api-reference.md)
- [Webhook Events Guide](./webhook-events.md)
