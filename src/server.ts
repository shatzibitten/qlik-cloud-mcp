import dotenv from 'dotenv';
import { CompositeConfigManager, EnvConfigManager, loadServerConfig, validateServerConfig } from './config';
import { Server } from './server';

// Load environment variables from .env file
dotenv.config();

// Create configuration manager
const configManager = new CompositeConfigManager([
  new EnvConfigManager('MCP_')
]);

// Load server configuration
const config = loadServerConfig(configManager);

// Validate configuration
try {
  validateServerConfig(config);
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

// Create and start server
const server = new Server(config);

server.start()
  .then(() => {
    console.log('Qlik Cloud MCP server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await server.stop();
  process.exit(0);
});
