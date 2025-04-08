# Qlik Cloud Model Context Protocol (MCP) Server

A comprehensive server implementation for managing model context in Qlik Cloud applications using the Model Context Protocol.

## Overview

The Qlik Cloud Model Context Protocol (MCP) Server provides a standardized way to manage model context across Qlik Cloud applications. It enables developers to create, manage, and synchronize analytical models with consistent state management, object tracking, and session handling.

Key features:
- Model context creation and management
- State persistence and restoration
- Object registry for tracking model objects
- Real-time WebSocket communication
- Integration with Qlik Cloud REST APIs
- Authentication with OAuth2, JWT, and API keys
- Docker support for easy deployment

## Architecture

The Qlik Cloud MCP Server is built with a modular architecture following SOLID and KISS principles:

- **Model Context Module**: Manages model state, object tracking, and session handling
- **Engine Communication Module**: Handles WebSocket connections to the Qlik Associative Engine
- **Authentication Module**: Provides secure access with multiple authentication methods
- **API Integration Module**: Connects with Qlik Cloud REST APIs
- **Server Module**: Exposes REST and WebSocket endpoints for client interaction

For more details, see the [Architecture Documentation](./docs/architecture.md).

## Installation

### Prerequisites

- Node.js 16 or later
- npm 7 or later
- Access to a Qlik Cloud tenant
- Qlik Cloud API key or OAuth2 credentials

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/shatzibitten/qlik-cloud-mcp.git
cd qlik-cloud-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Create a configuration file:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your Qlik Cloud tenant information and credentials.

5. Start the server:
```bash
npm start
```

For detailed installation instructions, see the [Installation Guide](./docs/installation.md).

### Docker Installation

1. Pull the Docker image:
```bash
docker pull shatzibitten/qlik-cloud-mcp:latest
```

2. Create a configuration file:
```bash
mkdir -p config
cp .env.example config/.env
```

3. Edit the `config/.env` file with your Qlik Cloud tenant information and credentials.

4. Run the container:
```bash
docker run -d -p 3000:3000 -v $(pwd)/config:/app/config --name qlik-cloud-mcp shatzibitten/qlik-cloud-mcp:latest
```

For more Docker options, see the [Docker Deployment Guide](./docs/docker-deployment.md).

## Usage

### Creating a Model Context

```javascript
// Using the REST API
const response = await fetch('http://localhost:3000/api/v1/model/contexts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    name: 'My Model Context',
    appId: 'YOUR_APP_ID',
    engineUrl: 'wss://your-tenant.us.qlikcloud.com/app/YOUR_APP_ID'
  })
});

const context = await response.json();
console.log('Created context:', context.id);
```

### Managing Model State

```javascript
// Save the current state
const saveResponse = await fetch(`http://localhost:3000/api/v1/model/contexts/${contextId}/state`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    name: 'My Saved State'
  })
});

const savedState = await saveResponse.json();
console.log('Saved state:', savedState.id);

// Restore a saved state
await fetch(`http://localhost:3000/api/v1/model/contexts/${contextId}/state/${savedState.id}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### WebSocket Communication

```javascript
const ws = new WebSocket(`ws://localhost:3000/api/v1/model/ws?token=YOUR_TOKEN`);

ws.onopen = () => {
  // Subscribe to context events
  ws.send(JSON.stringify({
    type: 'subscribe',
    contextId: 'YOUR_CONTEXT_ID'
  }));
  
  // Create an object
  ws.send(JSON.stringify({
    type: 'create-object',
    contextId: 'YOUR_CONTEXT_ID',
    objectType: 'GenericObject',
    properties: {
      qInfo: {
        qType: 'chart'
      },
      qHyperCubeDef: {
        qDimensions: [...],
        qMeasures: [...]
      }
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};
```

For more usage examples, see the [API Reference](./docs/api-reference.md).

## Documentation

- [Architecture](./docs/architecture.md)
- [Installation](./docs/installation.md)
- [Configuration](./docs/configuration.md)
- [Authentication](./docs/authentication.md)
- [API Reference](./docs/api-reference.md)
- [Model Context](./docs/model-context.md)
- [Docker Deployment](./docs/docker-deployment.md)
- [Development](./docs/development.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Qlik for providing the Qlik Cloud platform and APIs
- The enigma.js team for their excellent library
- All contributors who have helped with the development of this project
