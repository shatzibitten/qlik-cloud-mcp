# Authentication Guide

This guide provides detailed information on authentication methods supported by the Qlik Cloud MCP server.

## Authentication Methods

The Qlik Cloud MCP server supports three authentication methods:

1. **OAuth2 (Machine-to-Machine)**: Recommended for server-to-server communication
2. **JWT (JSON Web Tokens)**: Useful for legacy embedding scenarios or user-specific tokens
3. **API Key**: Simplest method, but less secure and doesn't support token refresh

You can enable one or more authentication methods in the server configuration.

## OAuth2 Authentication

OAuth2 is the recommended authentication method for server-to-server communication with Qlik Cloud. It uses client credentials to obtain an access token.

### Configuration

To enable OAuth2 authentication, set the following configuration:

```json
{
  "auth": {
    "oauth2": {
      "enabled": true,
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "tokenUrl": "https://your-tenant.us.qlikcloud.com/oauth/token"
    }
  }
}
```

Or using environment variables:

```bash
export MCP_AUTH_OAUTH2_ENABLED=true
export MCP_AUTH_OAUTH2_CLIENT_ID=your-client-id
export MCP_AUTH_OAUTH2_CLIENT_SECRET=your-client-secret
export MCP_AUTH_OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token
```

### Obtaining Client Credentials

To obtain OAuth2 client credentials:

1. Log in to your Qlik Cloud tenant
2. Go to the Management Console
3. Navigate to Integrations > OAuth clients
4. Click "Create new" to create a new OAuth client
5. Select "Machine-to-Machine" as the client type
6. Enter a name and description for the client
7. Select the required scopes (permissions)
8. Click "Create" to create the client
9. Copy the client ID and client secret

### Requesting a Token

To request an OAuth2 token:

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"type": "oauth2", "grantType": "client_credentials"}'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA5MGY...",
  "refreshToken": "v1.MTo0MGRlOWM0Ny1kMjQwLTQ5ZDctYmU...",
  "expiresAt": 1712511600000,
  "tokenType": "Bearer",
  "scope": "user_default"
}
```

### Using the Token

To use the token for API requests:

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "X-Auth-Type: oauth2"
```

The MCP server will automatically use the stored token for the specified authentication type.

## JWT Authentication

JWT authentication is useful for legacy embedding scenarios or when you need to generate tokens for specific users.

### Configuration

To enable JWT authentication, set the following configuration:

```json
{
  "auth": {
    "jwt": {
      "enabled": true,
      "key": "your-signing-key",
      "algorithm": "HS256",
      "issuer": "your-issuer",
      "expiresIn": 3600
    }
  }
}
```

Or using environment variables:

```bash
export MCP_AUTH_JWT_ENABLED=true
export MCP_AUTH_JWT_KEY=your-signing-key
export MCP_AUTH_JWT_ALGORITHM=HS256
export MCP_AUTH_JWT_ISSUER=your-issuer
export MCP_AUTH_JWT_EXPIRES_IN=3600
```

### Requesting a Token

To request a JWT token:

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "type": "jwt",
    "subject": "user-id",
    "claims": {
      "name": "User Name",
      "email": "user@example.com"
    }
  }'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1712511600000,
  "tokenType": "Bearer"
}
```

### Using the Token

To use the token for API requests:

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "X-Auth-Type: jwt"
```

The MCP server will automatically use the stored token for the specified authentication type.

## API Key Authentication

API key authentication is the simplest method, but it's less secure and doesn't support token refresh.

### Configuration

To enable API key authentication, set the following configuration:

```json
{
  "auth": {
    "apiKey": {
      "enabled": true,
      "apiKey": "your-api-key"
    }
  }
}
```

Or using environment variables:

```bash
export MCP_AUTH_API_KEY_ENABLED=true
export MCP_AUTH_API_KEY_API_KEY=your-api-key
```

### Obtaining an API Key

To obtain an API key:

1. Log in to your Qlik Cloud tenant
2. Go to the Management Console
3. Navigate to Integrations > API keys
4. Click "Create new" to create a new API key
5. Enter a name and description for the key
6. Select the required scopes (permissions)
7. Click "Create" to create the key
8. Copy the API key

### Requesting a Token

To request an API key token:

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"type": "apiKey"}'
```

Response:

```json
{
  "accessToken": "your-api-key",
  "expiresAt": 1743961200000,
  "tokenType": "Bearer"
}
```

### Using the Token

To use the token for API requests:

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "X-Auth-Type: apiKey"
```

The MCP server will automatically use the stored token for the specified authentication type.

## Token Management

The MCP server manages tokens for you, including refreshing expired tokens when possible. You don't need to handle token refresh or expiration yourself.

### Token Revocation

To revoke a token:

```bash
curl -X POST http://localhost:3000/auth/revoke \
  -H "Content-Type: application/json" \
  -d '{"type": "oauth2"}'
```

This will revoke the token for the specified authentication type.

## Security Considerations

- Store client secrets, signing keys, and API keys securely
- Use environment variables for sensitive information instead of configuration files
- Use HTTPS in production to protect tokens in transit
- Limit the scopes (permissions) of your OAuth2 clients and API keys
- Regularly rotate client secrets and API keys

## Next Steps

After setting up authentication, you can:

1. Make API requests to Qlik Cloud through the MCP server
2. Configure webhook events in Qlik Cloud
3. Implement custom event handlers

For more information, see the following guides:

- [API Reference](./api-reference.md)
- [Webhook Events Guide](./webhook-events.md)
- [Development Guide](./development.md)
