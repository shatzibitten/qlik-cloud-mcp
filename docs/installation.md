# Installation Guide

This guide provides detailed instructions for installing and setting up the Qlik Cloud MCP server.

## Prerequisites

Before installing the Qlik Cloud MCP server, ensure you have the following:

- **Node.js**: Version 16 or later
- **npm**: Version 7 or later
- **Qlik Cloud Access**: A Qlik Cloud tenant with appropriate permissions
- **API Credentials**: OAuth2 client credentials, JWT key, or API key for authentication

## Installation Methods

There are three ways to install and run the Qlik Cloud MCP server:

1. Using npm (for production use)
2. From source (for development or customization)
3. Using Docker (for containerized deployment)

## Method 1: Using npm

The simplest way to install the Qlik Cloud MCP server is using npm:

```bash
# Install the package globally
npm install -g qlik-cloud-mcp

# Create a configuration directory
mkdir -p ~/qlik-cloud-mcp/config

# Create a configuration file
cat > ~/qlik-cloud-mcp/config/config.json << EOF
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
    }
  },
  "api": {
    "baseUrl": "https://your-tenant.us.qlikcloud.com",
    "timeout": 30000
  },
  "webhook": {
    "secret": "your-webhook-secret"
  }
}
EOF

# Start the server
qlik-cloud-mcp --config ~/qlik-cloud-mcp/config/config.json
```

## Method 2: From Source

If you want to customize the server or contribute to its development, you can install from source:

```bash
# Clone the repository
git clone https://github.com/yourusername/qlik-cloud-mcp.git

# Navigate to the project directory
cd qlik-cloud-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Create a .env file
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

# Start the server
npm start
```

## Method 3: Using Docker

For containerized deployment, you can use Docker:

```bash
# Pull the Docker image
docker pull yourusername/qlik-cloud-mcp

# Create a configuration directory
mkdir -p ~/qlik-cloud-mcp/config

# Create a configuration file
cat > ~/qlik-cloud-mcp/config/config.json << EOF
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
    }
  },
  "api": {
    "baseUrl": "https://your-tenant.us.qlikcloud.com",
    "timeout": 30000
  },
  "webhook": {
    "secret": "your-webhook-secret"
  }
}
EOF

# Run the container
docker run -p 3000:3000 -v ~/qlik-cloud-mcp/config:/app/config yourusername/qlik-cloud-mcp
```

Alternatively, you can use environment variables with Docker:

```bash
# Run the container with environment variables
docker run -p 3000:3000 \
  -e MCP_AUTH_OAUTH2_ENABLED=true \
  -e MCP_AUTH_OAUTH2_CLIENT_ID=your-client-id \
  -e MCP_AUTH_OAUTH2_CLIENT_SECRET=your-client-secret \
  -e MCP_AUTH_OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token \
  -e MCP_API_BASE_URL=https://your-tenant.us.qlikcloud.com \
  -e MCP_WEBHOOK_SECRET=your-webhook-secret \
  yourusername/qlik-cloud-mcp
```

## Verifying the Installation

After installing and starting the server, you can verify that it's running correctly:

```bash
# Check the server status
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-04-07T17:00:00.000Z",
#   "version": "1.0.0"
# }
```

## Next Steps

After installing the Qlik Cloud MCP server, you should:

1. Configure authentication with your Qlik Cloud tenant
2. Set up webhook events in Qlik Cloud
3. Test API requests through the MCP server

For more information, see the following guides:

- [Configuration Guide](./configuration.md)
- [Authentication Guide](./authentication.md)
- [API Reference](./api-reference.md)
- [Webhook Events Guide](./webhook-events.md)
