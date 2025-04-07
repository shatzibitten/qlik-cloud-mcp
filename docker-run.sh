# Docker Build and Run Script
# This script builds the Docker image and runs the container

#!/bin/bash
set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t qlik-cloud-mcp:latest .

# Check if the container is already running
if [ "$(docker ps -q -f name=qlik-cloud-mcp)" ]; then
  echo "Stopping existing container..."
  docker stop qlik-cloud-mcp
  docker rm qlik-cloud-mcp
fi

# Run the container
echo "Starting container..."
docker-compose up -d

# Show container status
echo "Container status:"
docker ps -f name=qlik-cloud-mcp

echo "Qlik Cloud MCP server is now running at http://localhost:3000"
echo "Check logs with: docker-compose logs -f"
