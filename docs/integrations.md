# Claude Desktop and Cursor Integration

This document provides detailed instructions for integrating the Qlik Cloud MCP server with Claude Desktop and Cursor AI.

## Table of Contents

- [Claude Desktop Integration](#claude-desktop-integration)
  - [Overview](#claude-desktop-overview)
  - [Configuration](#claude-desktop-configuration)
  - [Available Tools](#claude-desktop-available-tools)
  - [Troubleshooting](#claude-desktop-troubleshooting)
- [Cursor AI Integration](#cursor-ai-integration)
  - [Overview](#cursor-overview)
  - [Configuration](#cursor-configuration)
  - [Available Tools](#cursor-available-tools)
  - [Troubleshooting](#cursor-troubleshooting)

## Claude Desktop Integration <a name="claude-desktop-integration"></a>

### Overview <a name="claude-desktop-overview"></a>

Claude Desktop is Anthropic's desktop application for interacting with Claude AI models. It supports the Model Context Protocol (MCP), which allows it to be extended with custom functionality. The Qlik Cloud MCP server implements this protocol to provide Claude Desktop with access to Qlik Cloud resources and functionality.

With this integration, you can:
- Access Qlik Cloud apps directly from Claude Desktop
- Create and manage model contexts for Qlik apps
- Save and restore model states
- Execute Qlik app operations through Claude's interface

### Configuration <a name="claude-desktop-configuration"></a>

To integrate Claude Desktop with the Qlik Cloud MCP server:

1. **Install the Qlik Cloud MCP server**
   - Follow the [installation instructions](./installation.md) to set up the server
   - Make sure the server is running and accessible

2. **Configure Claude Desktop**
   - Locate your Claude Desktop configuration file:
     - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   
   - Add the following configuration to the file (create it if it doesn't exist):
   ```json
   {
     "qlik-cloud-mcp": {
       "command": "npx @qlik-cloud-mcp/server start --port 3000",
       "env": {
         "QLIK_CLOUD_BASE_URL": "https://your-tenant.us.qlikcloud.com",
         "QLIK_CLOUD_TENANT_ID": "your-tenant",
         "QLIK_CLOUD_AUTH_TYPE": "oauth2",
         "NODE_ENV": "production"
       }
     }
   }
   ```

   - Replace the following values:
     - `your-tenant.us.qlikcloud.com`: Your Qlik Cloud tenant URL
     - `your-tenant`: Your Qlik Cloud tenant ID
     - `oauth2`: Your preferred authentication method (oauth2, jwt, or apikey)

3. **Restart Claude Desktop**
   - Close and reopen Claude Desktop to load the new configuration

4. **Verify the integration**
   - In Claude Desktop, you should see a new tool available in the tools panel
   - Try using one of the Qlik Cloud tools to verify the integration is working

### Available Tools <a name="claude-desktop-available-tools"></a>

The following tools are available in Claude Desktop after integration:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `qlik_get_app` | Get a Qlik Cloud app by ID | `appId`: ID of the app to get |
| `qlik_list_apps` | List all Qlik Cloud apps | `limit`: Maximum number of apps to return (optional)<br>`offset`: Offset for pagination (optional) |
| `qlik_create_model_context` | Create a new model context for a Qlik Cloud app | `appId`: ID of the app to create a context for<br>`name`: Name of the context<br>`description`: Description of the context (optional) |
| `qlik_get_model_context` | Get a model context by ID | `contextId`: ID of the context to get |
| `qlik_list_model_contexts` | List all model contexts | `limit`: Maximum number of contexts to return (optional)<br>`offset`: Offset for pagination (optional) |
| `qlik_delete_model_context` | Delete a model context | `contextId`: ID of the context to delete |
| `qlik_save_model_state` | Save the current state of a model context | `contextId`: ID of the context to save state for<br>`name`: Name of the state<br>`description`: Description of the state (optional) |
| `qlik_restore_model_state` | Restore a saved state of a model context | `contextId`: ID of the context to restore state for<br>`stateId`: ID of the state to restore |

### Troubleshooting <a name="claude-desktop-troubleshooting"></a>

If you encounter issues with the Claude Desktop integration:

1. **Check the server logs**
   - Look for any error messages in the Qlik Cloud MCP server logs
   - Verify that the server is running and accessible

2. **Verify the configuration**
   - Make sure the Claude Desktop configuration file is correctly formatted
   - Check that the environment variables are set correctly

3. **Test the connection**
   - Run the Claude Desktop connectivity test script:
   ```bash
   ./tests/claude-desktop-connectivity-test.sh
   ```

4. **Common issues**
   - **Tool not appearing in Claude Desktop**: Restart Claude Desktop and check the configuration file
   - **Authentication errors**: Verify your Qlik Cloud credentials and authentication settings
   - **Connection refused**: Make sure the server is running on the specified port

## Cursor AI Integration <a name="cursor-ai-integration"></a>

### Overview <a name="cursor-overview"></a>

Cursor AI is a code editor with built-in AI capabilities. It supports integration with various AI providers, including Anthropic's Claude. The Qlik Cloud MCP server provides a custom Anthropic API-compatible endpoint that allows Cursor to access Qlik Cloud resources and functionality.

With this integration, you can:
- Access Qlik Cloud apps directly from Cursor AI
- Create and manage model contexts for Qlik apps
- Save and restore model states
- Execute Qlik app operations through Cursor's interface

### Configuration <a name="cursor-configuration"></a>

To integrate Cursor AI with the Qlik Cloud MCP server:

1. **Install the Qlik Cloud MCP server**
   - Follow the [installation instructions](./installation.md) to set up the server
   - Make sure the server is running and accessible

2. **Configure Cursor AI**
   - Open Cursor AI and go to Settings
   - Navigate to the "AI Models" or "Integrations" section
   - Find the Claude/Anthropic integration settings
   - Enter the following information:
     - API URL: `http://localhost:3000/anthropic` (replace with your server URL if different)
     - API Key: Your configured API key (default: see your .env file)
     - Model: `claude-3-sonnet-20240229` (or your preferred Claude model)

3. **Restart Cursor AI**
   - Restart Cursor AI to apply the new settings

4. **Verify the integration**
   - In Cursor AI, try using one of the Qlik Cloud tools to verify the integration is working

### Available Tools <a name="cursor-available-tools"></a>

The following tools are available in Cursor AI after integration:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `qlik_list_apps` | List all Qlik Cloud apps | None |
| `qlik_get_app` | Get a Qlik Cloud app by ID | `appId`: ID of the app to get |
| `qlik_create_model_context` | Create a new model context for a Qlik Cloud app | `appId`: ID of the app to create a context for<br>`name`: Name of the context<br>`description`: Description of the context (optional) |
| `qlik_get_model_context` | Get a model context by ID | `contextId`: ID of the context to get |
| `qlik_list_model_contexts` | List all model contexts | None |
| `qlik_delete_model_context` | Delete a model context | `contextId`: ID of the context to delete |
| `qlik_save_model_state` | Save the current state of a model context | `contextId`: ID of the context to save state for<br>`name`: Name of the state<br>`description`: Description of the state (optional) |
| `qlik_restore_model_state` | Restore a saved state of a model context | `contextId`: ID of the context to restore state for<br>`stateId`: ID of the state to restore |

### Troubleshooting <a name="cursor-troubleshooting"></a>

If you encounter issues with the Cursor AI integration:

1. **Check the server logs**
   - Look for any error messages in the Qlik Cloud MCP server logs
   - Verify that the server is running and accessible

2. **Verify the configuration**
   - Make sure the Cursor AI settings are correctly configured
   - Check that the API URL and API key are correct

3. **Test the connection**
   - Run the Cursor connectivity test script:
   ```bash
   ./tests/cursor-connectivity-test.sh
   ```

4. **Common issues**
   - **Authentication errors**: Verify your API key is correctly set in both Cursor and the server
   - **Connection refused**: Make sure the server is running on the specified port
   - **Tool execution failures**: Check the server logs for detailed error messages
