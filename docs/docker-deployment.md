# Docker Deployment Guide

This guide provides detailed instructions for deploying the Qlik Cloud Model Context Protocol (MCP) server using Docker.

## Prerequisites

Before deploying the MCP server with Docker, ensure you have the following:

- **Docker**: Version 20.10.0 or later
- **Docker Compose**: Version 2.0.0 or later (optional, for Docker Compose deployment)
- **Qlik Cloud Tenant**: Access to a Qlik Cloud tenant
- **API Credentials**: Either an API key or OAuth2 credentials for your Qlik Cloud tenant

## Quick Start with Docker

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
cat > qlik-cloud-mcp/config/.env << EOL
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
EOL
```

Edit the `.env` file with your Qlik Cloud tenant information and credentials.

### 3. Create Data Directory

Create a directory for persistent data:

```bash
mkdir -p qlik-cloud-mcp/data
```

### 4. Run the Docker Container

```bash
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -v $(pwd)/qlik-cloud-mcp/config:/app/config \
  -v $(pwd)/qlik-cloud-mcp/data:/app/data \
  shatzibitten/qlik-cloud-mcp:latest
```

### 5. Verify the Deployment

Check that the container is running:

```bash
docker ps
```

Access the health endpoint to verify the server is working:

```bash
curl http://localhost:3000/health
```

## Deployment with Docker Compose

### 1. Create Docker Compose File

Create a `docker-compose.yml` file:

```bash
cat > docker-compose.yml << EOL
version: '3.8'

services:
  qlik-cloud-mcp:
    image: shatzibitten/qlik-cloud-mcp:latest
    container_name: qlik-cloud-mcp
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    environment:
      - NODE_ENV=production
EOL
```

### 2. Create Configuration

Create the configuration directory and `.env` file as described in the Quick Start section.

### 3. Start the Services

```bash
docker-compose up -d
```

### 4. Verify the Deployment

```bash
docker-compose ps
```

## Building a Custom Docker Image

If you want to build a custom Docker image:

### 1. Clone the Repository

```bash
git clone https://github.com/shatzibitten/qlik-cloud-mcp.git
cd qlik-cloud-mcp
```

### 2. Customize the Dockerfile

The Dockerfile is already configured for optimal deployment, but you can customize it if needed:

```dockerfile
FROM node:16-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:16-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Create directories
RUN mkdir -p config data
VOLUME ["/app/config", "/app/data"]

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 3. Build the Docker Image

```bash
docker build -t qlik-cloud-mcp:custom .
```

### 4. Run the Custom Image

```bash
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/data:/app/data \
  qlik-cloud-mcp:custom
```

## Advanced Docker Configuration

### Environment Variables

All configuration options can be set using environment variables in the Docker run command:

```bash
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -e PORT=3000 \
  -e LOG_LEVEL=info \
  -e NODE_ENV=production \
  -e QLIK_CLOUD_BASE_URL=https://your-tenant.us.qlikcloud.com \
  -e QLIK_CLOUD_TENANT_ID=your-tenant-id \
  -e QLIK_CLOUD_AUTH_TYPE=oauth2 \
  -e OAUTH2_CLIENT_ID=your-client-id \
  -e OAUTH2_CLIENT_SECRET=your-client-secret \
  -e OAUTH2_TOKEN_URL=https://your-tenant.us.qlikcloud.com/oauth/token \
  shatzibitten/qlik-cloud-mcp:latest
```

### Docker Networking

To isolate the MCP server in its own network:

```bash
# Create a network
docker network create qlik-cloud-network

# Run the container in the network
docker run -d \
  --name qlik-cloud-mcp \
  --network qlik-cloud-network \
  -p 3000:3000 \
  -v $(pwd)/qlik-cloud-mcp/config:/app/config \
  -v $(pwd)/qlik-cloud-mcp/data:/app/data \
  shatzibitten/qlik-cloud-mcp:latest
```

### Docker Compose with Multiple Services

For a more complex setup with additional services:

```yaml
version: '3.8'

services:
  qlik-cloud-mcp:
    image: shatzibitten/qlik-cloud-mcp:latest
    container_name: qlik-cloud-mcp
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    environment:
      - NODE_ENV=production
    networks:
      - qlik-cloud-network

  # Optional Redis for caching
  redis:
    image: redis:alpine
    container_name: qlik-cloud-redis
    restart: unless-stopped
    networks:
      - qlik-cloud-network

networks:
  qlik-cloud-network:
    driver: bridge
```

## Production Deployment Considerations

### Security

For production deployments, consider the following security measures:

1. **Use HTTPS**: Deploy behind a reverse proxy like Nginx or Traefik with SSL/TLS.
2. **Secure Secrets**: Use Docker secrets or a vault service for sensitive information.
3. **Non-Root User**: The Docker image already runs as a non-root user.
4. **Network Isolation**: Use Docker networks to isolate services.
5. **Resource Limits**: Set memory and CPU limits for the container.

Example with resource limits:

```bash
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -v $(pwd)/qlik-cloud-mcp/config:/app/config \
  -v $(pwd)/qlik-cloud-mcp/data:/app/data \
  --memory="512m" \
  --cpus="0.5" \
  shatzibitten/qlik-cloud-mcp:latest
```

### High Availability

For high availability:

1. **Multiple Instances**: Run multiple instances behind a load balancer.
2. **Health Checks**: Use Docker health checks to monitor container health.
3. **Automatic Restart**: Configure restart policies for containers.
4. **External State Storage**: Use external storage for state persistence.

### Monitoring

For monitoring:

1. **Container Logs**: Collect logs using Docker's logging drivers.
2. **Metrics**: Expose metrics for Prometheus.
3. **Health Checks**: Regularly check the `/health` endpoint.

Example with log configuration:

```bash
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -v $(pwd)/qlik-cloud-mcp/config:/app/config \
  -v $(pwd)/qlik-cloud-mcp/data:/app/data \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  shatzibitten/qlik-cloud-mcp:latest
```

## Troubleshooting

### Common Docker Issues

#### Container Fails to Start

Check the container logs:

```bash
docker logs qlik-cloud-mcp
```

#### Configuration Issues

Verify your configuration file:

```bash
docker exec -it qlik-cloud-mcp cat /app/config/.env
```

#### Permission Issues

Check volume permissions:

```bash
docker exec -it qlik-cloud-mcp ls -la /app/data
```

#### Network Issues

Check if the container can reach the Qlik Cloud tenant:

```bash
docker exec -it qlik-cloud-mcp ping your-tenant.us.qlikcloud.com
```

#### Resource Constraints

Check if the container is hitting resource limits:

```bash
docker stats qlik-cloud-mcp
```

For more troubleshooting information, see the [Troubleshooting Guide](./troubleshooting.md).

## Updating the MCP Server

To update to a new version of the MCP server:

```bash
# Pull the latest image
docker pull shatzibitten/qlik-cloud-mcp:latest

# Stop and remove the current container
docker stop qlik-cloud-mcp
docker rm qlik-cloud-mcp

# Run a new container with the latest image
docker run -d \
  --name qlik-cloud-mcp \
  -p 3000:3000 \
  -v $(pwd)/qlik-cloud-mcp/config:/app/config \
  -v $(pwd)/qlik-cloud-mcp/data:/app/data \
  shatzibitten/qlik-cloud-mcp:latest
```

With Docker Compose:

```bash
docker-compose pull
docker-compose up -d
```

## Next Steps

After deploying with Docker, you may want to:

1. [Configure authentication](./authentication.md)
2. [Learn about model context](./model-context.md)
3. [Explore the API reference](./api-reference.md)
4. [Set up monitoring and logging](./troubleshooting.md)
