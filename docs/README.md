# Qlik Cloud MCP Documentation

Welcome to the Qlik Cloud Message Control Protocol (MCP) server documentation. This comprehensive guide will help you understand, install, configure, and use the Qlik Cloud MCP server.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
5. [Authentication](#authentication)
6. [API Reference](#api-reference)
7. [Webhook Events](#webhook-events)
8. [Docker Deployment](#docker-deployment)
9. [Development Guide](#development-guide)
10. [Troubleshooting](#troubleshooting)

## Introduction

The Qlik Cloud MCP server is a middleware solution that provides a standardized interface for interacting with the Qlik Cloud APIs. It simplifies authentication, request handling, and webhook event processing, making it easier to integrate Qlik Cloud with your existing systems and workflows.

### Key Features

- **Multiple Authentication Methods**: Support for OAuth2, JWT, and API key authentication
- **Unified API Interface**: Consistent interface for all Qlik Cloud APIs
- **Webhook Event Processing**: Handle and respond to Qlik Cloud events
- **Notification System**: Send alerts and notifications for important events
- **Docker Support**: Easy deployment with Docker

### Use Cases

- **System Integration**: Connect Qlik Cloud with other enterprise systems
- **Automation**: Automate workflows based on Qlik Cloud events
- **Monitoring**: Monitor Qlik Cloud resources and activities
- **Custom Applications**: Build custom applications on top of Qlik Cloud

## Architecture Overview

The Qlik Cloud MCP server follows a modular architecture based on SOLID and KISS principles. The main components are:

1. **Authentication Module**: Handles authentication with Qlik Cloud
2. **API Module**: Manages API requests and responses
3. **Webhook Module**: Processes webhook events from Qlik Cloud
4. **Configuration Module**: Manages server configuration
5. **Server Core**: Ties everything together and provides the HTTP interface

For more details, see the [Architecture Documentation](./architecture.md).

## Installation Guide

### Prerequisites

- Node.js 16 or later
- npm 7 or later
- Access to Qlik Cloud with appropriate permissions

### Installation Steps

#### Option 1: Using npm

```bash
# Install the package globally
npm install -g qlik-cloud-mcp

# Start the server
qlik-cloud-mcp
```

#### Option 2: From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/qlik-cloud-mcp.git

# Navigate to the project directory
cd qlik-cloud-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

#### Option 3: Using Docker

```bash
# Pull the Docker image
docker pull yourusername/qlik-cloud-mcp

# Run the container
docker run -p 3000:3000 -v /path/to/config:/app/config yourusername/qlik-cloud-mcp
```

For more detailed installation instructions, see the [Installation Guide](./installation.md).

## Configuration

The Qlik Cloud MCP server can be configured using environment variables, configuration files, or a combination of both.

### Environment Variables

```
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
```

### Configuration File

You can also use a JSON configuration file:

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
```

For more configuration options, see the [Configuration Guide](./configuration.md).

## Authentication

The Qlik Cloud MCP server supports multiple authentication methods:

### OAuth2 (Machine-to-Machine)

OAuth2 is the recommended authentication method for server-to-server communication. It uses client credentials to obtain an access token.

```bash
# Request a token
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"type": "oauth2", "grantType": "client_credentials"}'
```

### JWT

JWT authentication is useful for legacy embedding scenarios or when you need to generate tokens for specific users.

```bash
# Request a token
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"type": "jwt", "subject": "user-id", "claims": {"name": "User Name"}}'
```

### API Key

API key authentication is the simplest method, but it's less secure and doesn't support token refresh.

```bash
# Request a token
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"type": "apiKey"}'
```

For more details on authentication, see the [Authentication Guide](./authentication.md).

## API Reference

The Qlik Cloud MCP server provides a unified interface for all Qlik Cloud APIs. You can make requests to any Qlik Cloud API endpoint through the MCP server.

### Making API Requests

```bash
# Make a request to the Qlik Cloud API
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "X-Auth-Type: oauth2"
```

### Available Resources

The MCP server provides specialized clients for the following Qlik Cloud resources:

- Users
- Spaces
- Apps
- Data Connections
- Extensions
- Themes
- Content
- Collections
- Reports
- Automations

For more details on the API, see the [API Reference](./api-reference.md).

## Webhook Events

The Qlik Cloud MCP server can process webhook events from Qlik Cloud. It validates the event signature, routes the event to the appropriate handler, and performs actions based on the event type.

### Supported Event Types

- **App Events**: app.reload.succeeded, app.reload.failed, app.published, app.deleted
- **User Events**: user.created, user.updated, user.deleted, user.login
- **System Events**: system.maintenance.scheduled, system.maintenance.started, system.maintenance.completed, system.alert

### Configuring Webhooks in Qlik Cloud

1. Go to the Qlik Cloud Management Console
2. Navigate to Integrations > Webhooks
3. Click "Add Webhook"
4. Enter the MCP server webhook URL: `http://your-mcp-server:3000/webhooks/qlik`
5. Select the event types you want to receive
6. Save the webhook

For more details on webhook events, see the [Webhook Events Guide](./webhook-events.md).

## Docker Deployment

The Qlik Cloud MCP server can be easily deployed using Docker. The Docker image includes everything needed to run the server.

### Running with Docker

```bash
# Run the container
docker run -p 3000:3000 \
  -e MCP_AUTH_OAUTH2_ENABLED=true \
  -e MCP_AUTH_OAUTH2_CLIENT_ID=your-client-id \
  -e MCP_AUTH_OAUTH2_CLIENT_SECRET=your-client-secret \
  -e MCP_AUTH_OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token \
  -e MCP_API_BASE_URL=https://your-tenant.us.qlikcloud.com \
  -e MCP_WEBHOOK_SECRET=your-webhook-secret \
  yourusername/qlik-cloud-mcp
```

### Docker Compose

You can also use Docker Compose for more complex deployments:

```yaml
version: '3'
services:
  qlik-cloud-mcp:
    image: yourusername/qlik-cloud-mcp
    ports:
      - "3000:3000"
    environment:
      - MCP_AUTH_OAUTH2_ENABLED=true
      - MCP_AUTH_OAUTH2_CLIENT_ID=your-client-id
      - MCP_AUTH_OAUTH2_CLIENT_SECRET=your-client-secret
      - MCP_AUTH_OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token
      - MCP_API_BASE_URL=https://your-tenant.us.qlikcloud.com
      - MCP_WEBHOOK_SECRET=your-webhook-secret
    volumes:
      - ./logs:/app/logs
```

For more details on Docker deployment, see the [Docker Deployment Guide](./docker-deployment.md).

## Development Guide

If you want to extend or modify the Qlik Cloud MCP server, this section provides guidance on the development process.

### Project Structure

```
qlik-cloud-mcp/
├── src/
│   ├── auth/           # Authentication module
│   ├── api/            # API module
│   ├── events/         # Webhook event module
│   ├── config/         # Configuration module
│   ├── utils/          # Utility functions
│   ├── server/         # Server core
│   └── server.ts       # Entry point
├── dist/               # Compiled JavaScript
├── docs/               # Documentation
├── tests/              # Tests
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── package.json        # Package configuration
└── tsconfig.json       # TypeScript configuration
```

### Development Workflow

1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes
4. Build the project: `npm run build`
5. Run tests: `npm test`
6. Start the server: `npm start`

For more details on development, see the [Development Guide](./development.md).

## Troubleshooting

If you encounter issues with the Qlik Cloud MCP server, this section provides guidance on troubleshooting common problems.

### Common Issues

#### Authentication Failures

- Check your client ID and client secret
- Verify that your OAuth2 token URL is correct
- Ensure that your client has the necessary permissions

#### API Request Failures

- Check that you're using the correct authentication type
- Verify that your API base URL is correct
- Ensure that your token has the necessary permissions

#### Webhook Event Processing Failures

- Check that your webhook secret is correct
- Verify that your webhook URL is accessible from Qlik Cloud
- Ensure that your event handlers are properly configured

For more troubleshooting tips, see the [Troubleshooting Guide](./troubleshooting.md).
