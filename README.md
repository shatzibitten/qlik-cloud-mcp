# Qlik Cloud MCP (Model Context Protocol) Server

A Model Context Protocol server for the Qlik Cloud API that enables AI assistants to interact with Qlik Cloud resources and functionality.

## Overview

The Qlik Cloud MCP server implements the Model Context Protocol, allowing AI assistants like Claude Desktop and Cursor to access and manipulate Qlik Cloud resources. It provides a unified interface for managing model contexts, state persistence, and Qlik Cloud API integration.

Key features:
- **Model Context Management**: Create, retrieve, and manage model contexts for Qlik Cloud apps
- **State Persistence**: Save and restore model states across sessions
- **Qlik Cloud API Integration**: Access Qlik Cloud resources and functionality
- **Claude Desktop Integration**: Extend Claude Desktop with Qlik Cloud capabilities
- **Cursor AI Integration**: Use Qlik Cloud functionality directly from Cursor

## Installation

See the [Installation Guide](./docs/installation.md) for detailed instructions on installing and configuring the Qlik Cloud MCP server.

### Quick Start

```bash
# Install the package
npm install @qlik-cloud-mcp/server

# Create a configuration file
cp .env.example .env

# Edit the configuration file with your Qlik Cloud details
nano .env

# Start the server
npm start
```

## Docker

The Qlik Cloud MCP server can be run in a Docker container. See the [Docker Deployment Guide](./docs/docker-deployment.md) for details.

```bash
# Build and run with Docker
./docker-run.sh
```

## Documentation

- [Architecture](./docs/architecture.md): Overview of the system architecture
- [Model Context](./docs/model-context.md): Details on model context management
- [Authentication](./docs/authentication.md): Authentication methods and configuration
- [API Reference](./docs/api-reference.md): API endpoints and usage
- [Integrations](./docs/integrations.md): Claude Desktop and Cursor integration guide
- [Docker Deployment](./docs/docker-deployment.md): Running in Docker
- [Development](./docs/development.md): Development guide
- [Troubleshooting](./docs/troubleshooting.md): Common issues and solutions

## Integrations

### Claude Desktop

The Qlik Cloud MCP server can be integrated with Claude Desktop to provide Qlik Cloud functionality directly within Claude's interface. See the [Integrations Guide](./docs/integrations.md#claude-desktop-integration) for setup instructions.

### Cursor AI

The Qlik Cloud MCP server can be integrated with Cursor AI to provide Qlik Cloud functionality within Cursor's code editor. See the [Integrations Guide](./docs/integrations.md#cursor-ai-integration) for setup instructions.

## Development

See the [Development Guide](./docs/development.md) for information on developing and extending the Qlik Cloud MCP server.

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test Claude Desktop connectivity
./tests/claude-desktop-connectivity-test.sh

# Test Cursor connectivity
./tests/cursor-connectivity-test.sh
```

## License

MIT
