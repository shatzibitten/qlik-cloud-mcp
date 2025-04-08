# Installation Guide

This guide provides detailed instructions for installing and setting up the Qlik Cloud Model Context Protocol (MCP) server.

## Prerequisites

Before installing the Qlik Cloud MCP server, ensure you have the following:

- **Node.js**: Version 16 or later
- **npm**: Version 7 or later
- **Qlik Cloud Tenant**: Access to a Qlik Cloud tenant
- **API Credentials**: Either an API key or OAuth2 credentials for your Qlik Cloud tenant
- **Git**: For cloning the repository (optional)

## Standard Installation

### 1. Clone the Repository

```bash
git clone https://github.com/shatzibitten/qlik-cloud-mcp.git
cd qlik-cloud-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Server

Create a configuration file by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your Qlik Cloud tenant information and credentials:

```
# Server Configuration
PORT=3000
LOG_LEVEL=info
NODE_ENV=production

# Qlik Cloud Configuration
QLIK_CLOUD_BASE_URL=https://your-tenant.us.qlikcloud.com
QLIK_CLOUD_TENANT_ID=your-tenant-id
QLIK_CLOUD_AUTH_TYPE=oauth2  # oauth2, jwt, or apikey

# Authentication Configuration
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token

# JWT Configuration (if using JWT)
JWT_SECRET=your-jwt-secret
JWT_ISSUER=your-jwt-issuer
JWT_AUDIENCE=your-jwt-audience

# API Key Configuration (if using API key)
API_KEY=your-api-key
```

### 4. Build the Server

```bash
npm run build
```

### 5. Start the Server

```bash
npm start
```

The server will start on the configured port (default: 3000).

## Docker Installation

### 1. Pull the Docker Image

```bash
docker pull shatzibitten/qlik-cloud-mcp:latest
```

### 2. Create Configuration

Create a directory for configuration files:

```bash
mkdir -p qlik-cloud-mcp/config
```

Create a `.env` file in the config directory:

```bash
cp .env.example qlik-cloud-mcp/config/.env
```

Edit the `.env` file with your Qlik Cloud tenant information and credentials.

### 3. Run the Docker Container

```bash
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -v $(pwd)/qlik-cloud-mcp/config:/app/config \
  shatzibitten/qlik-cloud-mcp:latest
```

### 4. Verify the Installation

Check that the container is running:

```bash
docker ps
```

Access the health endpoint to verify the server is working:

```bash
curl http://localhost:3000/health
```

## Building from Source

If you want to build the Docker image yourself:

### 1. Clone the Repository

```bash
git clone https://github.com/shatzibitten/qlik-cloud-mcp.git
cd qlik-cloud-mcp
```

### 2. Build the Docker Image

```bash
docker build -t qlik-cloud-mcp .
```

### 3. Run the Docker Container

```bash
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  qlik-cloud-mcp
```

## Advanced Configuration

### Environment Variables

All configuration options can be set using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| LOG_LEVEL | Logging level (debug, info, warn, error) | info |
| NODE_ENV | Node environment | production |
| QLIK_CLOUD_BASE_URL | Qlik Cloud tenant URL | - |
| QLIK_CLOUD_TENANT_ID | Qlik Cloud tenant ID | - |
| QLIK_CLOUD_AUTH_TYPE | Authentication type | oauth2 |
| OAUTH2_CLIENT_ID | OAuth2 client ID | - |
| OAUTH2_CLIENT_SECRET | OAuth2 client secret | - |
| OAUTH2_TOKEN_URL | OAuth2 token URL | - |
| JWT_SECRET | JWT secret key | - |
| JWT_ISSUER | JWT issuer | - |
| JWT_AUDIENCE | JWT audience | - |
| API_KEY | API key | - |
| SESSION_TIMEOUT | Session timeout in seconds | 3600 |
| MAX_CONTEXTS | Maximum number of contexts per user | 10 |
| STATE_STORAGE_PATH | Path for state storage | ./data/states |

### Configuration File

Instead of using environment variables, you can create a `config.json` file in the config directory:

```json
{
  "server": {
    "port": 3000,
    "logLevel": "info",
    "nodeEnv": "production"
  },
  "qlikCloud": {
    "baseUrl": "https://your-tenant.us.qlikcloud.com",
    "tenantId": "your-tenant-id",
    "authType": "oauth2"
  },
  "auth": {
    "oauth2": {
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "tokenUrl": "https://your-tenant.us.qlikcloud.com/oauth/token"
    },
    "jwt": {
      "secret": "your-jwt-secret",
      "issuer": "your-jwt-issuer",
      "audience": "your-jwt-audience"
    },
    "apiKey": "your-api-key"
  },
  "session": {
    "timeout": 3600
  },
  "context": {
    "maxContexts": 10,
    "stateStoragePath": "./data/states"
  }
}
```

## Verifying the Installation

### 1. Check Server Status

Access the health endpoint:

```bash
curl http://localhost:3000/health
```

You should receive a response like:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 123
}
```

### 2. Create a Model Context

Use the API to create a model context:

```bash
curl -X POST \
  http://localhost:3000/api/v1/model/contexts \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "name": "Test Context",
    "appId": "YOUR_APP_ID",
    "engineUrl": "wss://your-tenant.us.qlikcloud.com/app/YOUR_APP_ID"
  }'
```

### 3. List Model Contexts

Verify that your context was created:

```bash
curl -X GET \
  http://localhost:3000/api/v1/model/contexts \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Troubleshooting

### Common Installation Issues

#### Connection Refused

If you see "Connection refused" errors:
- Verify the server is running
- Check that the port is not blocked by a firewall
- Ensure no other service is using the same port

#### Authentication Errors

If you see authentication errors:
- Verify your API credentials
- Check that your tenant URL is correct
- Ensure your OAuth2 client has the necessary permissions

#### Docker Issues

If you have issues with the Docker container:
- Check container logs: `docker logs qlik-cloud-mcp`
- Verify volume mounts are correct
- Ensure the configuration file is properly formatted

For more troubleshooting information, see the [Troubleshooting Guide](./troubleshooting.md).

## Next Steps

After installation, you may want to:

1. [Configure authentication](./authentication.md)
2. [Learn about model context](./model-context.md)
3. [Explore the API reference](./api-reference.md)
4. [Set up Docker deployment](./docker-deployment.md)
