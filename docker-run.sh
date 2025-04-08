#!/bin/bash

# Docker build and run script for Qlik Cloud MCP server

# Set default values
IMAGE_NAME="qlik-cloud-mcp"
CONTAINER_NAME="qlik-cloud-mcp"
PORT=3000
CONFIG_DIR="./config"
DATA_DIR="./data"

# Display banner
echo "=========================================="
echo "  Qlik Cloud Model Context Protocol (MCP)"
echo "  Docker Build and Run Script"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Create directories if they don't exist
mkdir -p "$CONFIG_DIR" "$DATA_DIR"

# Check if .env file exists
if [ ! -f "$CONFIG_DIR/.env" ]; then
    if [ -f ".env.example" ]; then
        echo "No .env file found in $CONFIG_DIR. Creating from example..."
        cp .env.example "$CONFIG_DIR/.env"
        echo "Please edit $CONFIG_DIR/.env with your configuration before running the container."
        exit 1
    else
        echo "Error: No .env file found in $CONFIG_DIR and no .env.example to copy from."
        exit 1
    fi
fi

# Check if a container with the same name is already running
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container $CONTAINER_NAME already exists. Stopping and removing..."
    docker stop "$CONTAINER_NAME" > /dev/null
    docker rm "$CONTAINER_NAME" > /dev/null
fi

# Build the Docker image
echo "Building Docker image $IMAGE_NAME..."
docker build -t "$IMAGE_NAME" .

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Error: Docker build failed"
    exit 1
fi

# Run the container
echo "Starting container $CONTAINER_NAME..."
docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$PORT:3000" \
    -v "$(pwd)/$CONFIG_DIR:/app/config" \
    -v "$(pwd)/$DATA_DIR:/app/data" \
    --restart unless-stopped \
    "$IMAGE_NAME"

# Check if container started successfully
if [ $? -ne 0 ]; then
    echo "Error: Failed to start container"
    exit 1
fi

# Wait for container to initialize
echo "Waiting for container to initialize..."
sleep 5

# Check container status
CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME")
if [ "$CONTAINER_STATUS" != "running" ]; then
    echo "Error: Container is not running. Status: $CONTAINER_STATUS"
    echo "Container logs:"
    docker logs "$CONTAINER_NAME"
    exit 1
fi

# Get container IP
CONTAINER_IP=$(docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CONTAINER_NAME")

echo ""
echo "=========================================="
echo "  Qlik Cloud MCP Server is running!"
echo "=========================================="
echo "Container name: $CONTAINER_NAME"
echo "Container IP: $CONTAINER_IP"
echo "Local access: http://localhost:$PORT"
echo ""
echo "To view logs:"
echo "  docker logs $CONTAINER_NAME"
echo ""
echo "To stop the container:"
echo "  docker stop $CONTAINER_NAME"
echo ""
echo "To restart the container:"
echo "  docker start $CONTAINER_NAME"
echo "=========================================="
