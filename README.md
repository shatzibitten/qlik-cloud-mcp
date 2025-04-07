# Qlik Cloud MCP

Message Control Protocol server for the Qlik Cloud API. This server provides a standardized interface for interacting with Qlik Cloud APIs, simplifying authentication, request handling, and webhook event processing.

## Features

- **Multiple Authentication Methods**: Support for OAuth2, JWT, and API key authentication
- **Unified API Interface**: Consistent interface for all Qlik Cloud APIs
- **Webhook Event Processing**: Handle and respond to Qlik Cloud events
- **Notification System**: Send alerts and notifications for important events
- **Docker Support**: Easy deployment with Docker

## Documentation

For detailed documentation, see the [docs](./docs) directory:

- [Installation Guide](./docs/installation.md)
- [Configuration Guide](./docs/configuration.md)
- [Authentication Guide](./docs/authentication.md)
- [API Reference](./docs/api-reference.md)
- [Webhook Events Guide](./docs/webhook-events.md)
- [Docker Deployment Guide](./docs/docker-deployment.md)
- [Development Guide](./docs/development.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

## Quick Start

### Using Docker

The easiest way to get started is with Docker:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/qlik-cloud-mcp.git
   cd qlik-cloud-mcp
   ```

2. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   # Edit .env with your Qlik Cloud credentials
   ```

3. Build and run the container:
   ```bash
   ./docker-run.sh
   ```

4. The server will be available at http://localhost:3000

### From Source

To run from source:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/qlik-cloud-mcp.git
   cd qlik-cloud-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   # Edit .env with your Qlik Cloud credentials
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Testing

To run tests:

1. Set up the test environment:
   ```bash
   npm run test:setup
   # Edit .env.test with your test credentials
   ```

2. Run the tests:
   ```bash
   npm test
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
