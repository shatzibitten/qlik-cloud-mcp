# Docker Deployment Guide

This guide provides detailed information on deploying the Qlik Cloud MCP server using Docker.

## Overview

Docker provides a convenient way to deploy the Qlik Cloud MCP server in a containerized environment. This approach ensures consistency across different environments and simplifies deployment.

## Prerequisites

Before deploying the Qlik Cloud MCP server with Docker, ensure you have:

- Docker installed (version 20.10.0 or later)
- Docker Compose installed (version 2.0.0 or later, optional but recommended)
- Access to a Qlik Cloud tenant with appropriate permissions
- API credentials (OAuth2 client credentials, JWT key, or API key)

## Docker Image

The Qlik Cloud MCP server is available as a Docker image on Docker Hub:

```
yourusername/qlik-cloud-mcp:latest
```

The image is based on Node.js 16 and includes all the dependencies required to run the MCP server.

## Running with Docker

### Basic Usage

The simplest way to run the MCP server with Docker is:

```bash
docker run -p 3000:3000 \
  -e MCP_AUTH_OAUTH2_ENABLED=true \
  -e MCP_AUTH_OAUTH2_CLIENT_ID=your-client-id \
  -e MCP_AUTH_OAUTH2_CLIENT_SECRET=your-client-secret \
  -e MCP_AUTH_OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token \
  -e MCP_API_BASE_URL=https://your-tenant.us.qlikcloud.com \
  -e MCP_WEBHOOK_SECRET=your-webhook-secret \
  yourusername/qlik-cloud-mcp
```

This will start the MCP server on port 3000 with OAuth2 authentication enabled.

### Using a Configuration File

You can also use a configuration file with Docker:

```bash
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

# Run the container with the configuration file
docker run -p 3000:3000 \
  -v ~/qlik-cloud-mcp/config:/app/config \
  yourusername/qlik-cloud-mcp
```

### Persisting Data

To persist data between container restarts, you can mount a volume for the logs directory:

```bash
docker run -p 3000:3000 \
  -v ~/qlik-cloud-mcp/config:/app/config \
  -v ~/qlik-cloud-mcp/logs:/app/logs \
  yourusername/qlik-cloud-mcp
```

## Docker Compose

For more complex deployments, you can use Docker Compose:

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
      - ./config:/app/config
      - ./logs:/app/logs
    restart: unless-stopped
```

Save this as `docker-compose.yml` and run:

```bash
docker-compose up -d
```

This will start the MCP server in detached mode.

## Environment Variables

You can configure the MCP server using environment variables. See the [Configuration Guide](./configuration.md) for a complete list of environment variables.

## Building the Docker Image

If you want to build the Docker image yourself:

```bash
# Clone the repository
git clone https://github.com/yourusername/qlik-cloud-mcp.git

# Navigate to the project directory
cd qlik-cloud-mcp

# Build the Docker image
docker build -t yourusername/qlik-cloud-mcp .
```

## Production Deployment

For production deployments, consider the following:

### Security

- Use HTTPS in production to protect data in transit
- Store sensitive information (client secrets, API keys) securely
- Use a reverse proxy (e.g., Nginx) to handle SSL termination
- Limit access to the MCP server using network security groups

### High Availability

- Deploy multiple instances of the MCP server behind a load balancer
- Use a container orchestration platform (e.g., Kubernetes) for automatic scaling and failover
- Monitor the MCP server for health and performance

### Example Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name mcp.example.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Example Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qlik-cloud-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: qlik-cloud-mcp
  template:
    metadata:
      labels:
        app: qlik-cloud-mcp
    spec:
      containers:
      - name: qlik-cloud-mcp
        image: yourusername/qlik-cloud-mcp
        ports:
        - containerPort: 3000
        env:
        - name: MCP_AUTH_OAUTH2_ENABLED
          value: "true"
        - name: MCP_AUTH_OAUTH2_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: qlik-cloud-mcp-secrets
              key: oauth2-client-id
        - name: MCP_AUTH_OAUTH2_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: qlik-cloud-mcp-secrets
              key: oauth2-client-secret
        - name: MCP_AUTH_OAUTH2_TOKEN_URL
          value: "https://your-tenant.us.qlikcloud.com/oauth/token"
        - name: MCP_API_BASE_URL
          value: "https://your-tenant.us.qlikcloud.com"
        - name: MCP_WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: qlik-cloud-mcp-secrets
              key: webhook-secret
```

## Troubleshooting

### Common Issues

#### Container Fails to Start

- Check the container logs: `docker logs <container-id>`
- Verify that all required environment variables are set
- Ensure that the configuration file is mounted correctly

#### Container Starts but API Requests Fail

- Check that the API base URL is correct
- Verify that the authentication credentials are valid
- Ensure that the container can access the Qlik Cloud API

#### Webhook Events Are Not Processed

- Check that the webhook secret is correct
- Verify that the webhook URL in Qlik Cloud is accessible from the internet
- Ensure that the container is running and accessible

## Next Steps

After deploying the Qlik Cloud MCP server with Docker, you can:

1. Configure authentication with your Qlik Cloud tenant
2. Set up webhook events in Qlik Cloud
3. Test API requests through the MCP server

For more information, see the following guides:

- [Configuration Guide](./configuration.md)
- [Authentication Guide](./authentication.md)
- [API Reference](./api-reference.md)
- [Webhook Events Guide](./webhook-events.md)
