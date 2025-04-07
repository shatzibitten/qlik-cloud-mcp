# API Reference

This guide provides detailed information on the API endpoints exposed by the Qlik Cloud MCP server and how to use them to interact with Qlik Cloud APIs.

## Overview

The Qlik Cloud MCP server provides a unified interface for all Qlik Cloud APIs. It handles authentication, request routing, and error handling, making it easier to integrate with Qlik Cloud.

## Base URL

All API endpoints are relative to the base URL of your MCP server:

```
http://localhost:3000
```

## Authentication

All API requests require authentication. You can specify the authentication type using the `X-Auth-Type` header:

```
X-Auth-Type: oauth2
```

Supported authentication types:
- `oauth2` (default)
- `jwt`
- `apiKey`

The MCP server will automatically use the stored token for the specified authentication type. If no token is available, you'll need to request one first.

## API Proxy

The MCP server acts as a proxy for Qlik Cloud APIs. You can make requests to any Qlik Cloud API endpoint through the MCP server by prefixing the path with `/api`.

### Example

To get the current user:

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "X-Auth-Type: oauth2"
```

This will proxy the request to `https://your-tenant.us.qlikcloud.com/v1/users/me` with the appropriate authentication.

## Resource Clients

The MCP server provides specialized clients for the following Qlik Cloud resources:

### Users

#### Get All Users

```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "X-Auth-Type: oauth2"
```

#### Get User by ID

```bash
curl -X GET http://localhost:3000/api/v1/users/{userId} \
  -H "X-Auth-Type: oauth2"
```

#### Get Current User

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "X-Auth-Type: oauth2"
```

#### Invite User

```bash
curl -X POST http://localhost:3000/api/v1/users/invite \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["AnalyticsConsumer"]
  }'
```

### Spaces

#### Get All Spaces

```bash
curl -X GET http://localhost:3000/api/v1/spaces \
  -H "X-Auth-Type: oauth2"
```

#### Get Space by ID

```bash
curl -X GET http://localhost:3000/api/v1/spaces/{spaceId} \
  -H "X-Auth-Type: oauth2"
```

#### Create Space

```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "name": "My Space",
    "description": "My space description",
    "type": "shared"
  }'
```

#### Get Space Members

```bash
curl -X GET http://localhost:3000/api/v1/spaces/{spaceId}/members \
  -H "X-Auth-Type: oauth2"
```

#### Add Member to Space

```bash
curl -X POST http://localhost:3000/api/v1/spaces/{spaceId}/members \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "userId": "user-id",
    "roles": ["Consumer"]
  }'
```

#### Remove Member from Space

```bash
curl -X DELETE http://localhost:3000/api/v1/spaces/{spaceId}/members/{userId} \
  -H "X-Auth-Type: oauth2"
```

### Apps

#### Get All Apps

```bash
curl -X GET http://localhost:3000/api/v1/apps \
  -H "X-Auth-Type: oauth2"
```

#### Get App by ID

```bash
curl -X GET http://localhost:3000/api/v1/apps/{appId} \
  -H "X-Auth-Type: oauth2"
```

#### Get App Metadata

```bash
curl -X GET http://localhost:3000/api/v1/apps/{appId}/metadata \
  -H "X-Auth-Type: oauth2"
```

#### Reload App

```bash
curl -X POST http://localhost:3000/api/v1/apps/{appId}/reload \
  -H "X-Auth-Type: oauth2"
```

### Data Connections

#### Get All Data Connections

```bash
curl -X GET http://localhost:3000/api/v1/data-connections \
  -H "X-Auth-Type: oauth2"
```

#### Get Data Connection by ID

```bash
curl -X GET http://localhost:3000/api/v1/data-connections/{connectionId} \
  -H "X-Auth-Type: oauth2"
```

#### Create Data Connection

```bash
curl -X POST http://localhost:3000/api/v1/data-connections \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "name": "My Connection",
    "type": "folder",
    "connectionString": "C:\\Data",
    "qConnectStatement": "CONNECT TO [folder];"
  }'
```

#### Test Data Connection

```bash
curl -X POST http://localhost:3000/api/v1/data-connections/{connectionId}/test \
  -H "X-Auth-Type: oauth2"
```

### Extensions

#### Get All Extensions

```bash
curl -X GET http://localhost:3000/api/v1/extensions \
  -H "X-Auth-Type: oauth2"
```

#### Get Extension by ID

```bash
curl -X GET http://localhost:3000/api/v1/extensions/{extensionId} \
  -H "X-Auth-Type: oauth2"
```

#### Upload Extension

```bash
curl -X POST http://localhost:3000/api/v1/extensions \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "file": "base64-encoded-file",
    "overwrite": true
  }'
```

### Themes

#### Get All Themes

```bash
curl -X GET http://localhost:3000/api/v1/themes \
  -H "X-Auth-Type: oauth2"
```

#### Get Theme by ID

```bash
curl -X GET http://localhost:3000/api/v1/themes/{themeId} \
  -H "X-Auth-Type: oauth2"
```

#### Apply Theme to App

```bash
curl -X POST http://localhost:3000/api/v1/themes/{themeId}/apply \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "appId": "app-id"
  }'
```

### Content

#### Get All Content

```bash
curl -X GET http://localhost:3000/api/v1/items \
  -H "X-Auth-Type: oauth2"
```

#### Get Content by ID

```bash
curl -X GET http://localhost:3000/api/v1/items/{itemId} \
  -H "X-Auth-Type: oauth2"
```

#### Search Content

```bash
curl -X POST http://localhost:3000/api/v1/items/search \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "query": "my search query",
    "resourceType": "app"
  }'
```

### Collections

#### Get All Collections

```bash
curl -X GET http://localhost:3000/api/v1/collections \
  -H "X-Auth-Type: oauth2"
```

#### Get Collection by ID

```bash
curl -X GET http://localhost:3000/api/v1/collections/{collectionId} \
  -H "X-Auth-Type: oauth2"
```

#### Get Collection Items

```bash
curl -X GET http://localhost:3000/api/v1/collections/{collectionId}/items \
  -H "X-Auth-Type: oauth2"
```

#### Add Item to Collection

```bash
curl -X POST http://localhost:3000/api/v1/collections/{collectionId}/items \
  -H "Content-Type: application/json" \
  -H "X-Auth-Type: oauth2" \
  -d '{
    "id": "item-id"
  }'
```

#### Remove Item from Collection

```bash
curl -X DELETE http://localhost:3000/api/v1/collections/{collectionId}/items/{itemId} \
  -H "X-Auth-Type: oauth2"
```

### Reports

#### Get All Reports

```bash
curl -X GET http://localhost:3000/api/v1/reports \
  -H "X-Auth-Type: oauth2"
```

#### Get Report by ID

```bash
curl -X GET http://localhost:3000/api/v1/reports/{reportId} \
  -H "X-Auth-Type: oauth2"
```

#### Generate Report

```bash
curl -X POST http://localhost:3000/api/v1/reports/{reportId}/generate \
  -H "X-Auth-Type: oauth2"
```

#### Get Report Executions

```bash
curl -X GET http://localhost:3000/api/v1/reports/{reportId}/executions \
  -H "X-Auth-Type: oauth2"
```

### Automations

#### Get All Automations

```bash
curl -X GET http://localhost:3000/api/v1/automations \
  -H "X-Auth-Type: oauth2"
```

#### Get Automation by ID

```bash
curl -X GET http://localhost:3000/api/v1/automations/{automationId} \
  -H "X-Auth-Type: oauth2"
```

#### Trigger Automation

```bash
curl -X POST http://localhost:3000/api/v1/automations/{automationId}/trigger \
  -H "X-Auth-Type: oauth2"
```

#### Get Automation Executions

```bash
curl -X GET http://localhost:3000/api/v1/automations/{automationId}/executions \
  -H "X-Auth-Type: oauth2"
```

## Error Handling

The MCP server provides consistent error handling for all API requests. Errors are returned as JSON objects with the following structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {
      "key": "value"
    }
  }
}
```

Common error codes:

- `AUTHENTICATION_FAILED`: Authentication failed
- `AUTHORIZATION_FAILED`: Authorization failed
- `RESOURCE_NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Validation error
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `SERVER_ERROR`: Server error

## Next Steps

After understanding the API reference, you can:

1. Integrate the MCP server with your applications
2. Implement custom event handlers for webhook events
3. Extend the MCP server with additional functionality

For more information, see the following guides:

- [Webhook Events Guide](./webhook-events.md)
- [Development Guide](./development.md)
- [Troubleshooting Guide](./troubleshooting.md)
