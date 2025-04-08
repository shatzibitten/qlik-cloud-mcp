# API Reference

This document provides a comprehensive reference for the Qlik Cloud Model Context Protocol (MCP) server API.

## Authentication

All API requests must include authentication. The MCP server supports three authentication methods:

### Bearer Token (OAuth2/JWT)

```
Authorization: Bearer YOUR_TOKEN
```

### API Key

```
X-Qlik-API-Key: YOUR_API_KEY
```

## Base URL

All API endpoints are relative to the base URL of your MCP server:

```
http://localhost:3000
```

## Response Format

All responses are in JSON format. Successful responses typically include:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses include:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Health Endpoint

### Get Server Health

```
GET /health
```

Returns the health status of the server.

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 123
}
```

## Model Context Endpoints

### Create Model Context

```
POST /api/v1/model/contexts
```

Creates a new model context.

**Request Body:**

```json
{
  "name": "My Model Context",
  "description": "Description of the context",
  "appId": "APP_ID",
  "engineUrl": "wss://your-tenant.us.qlikcloud.com/app/APP_ID",
  "authType": "oauth2"  // oauth2, jwt, or apikey
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "CONTEXT_ID",
    "name": "My Model Context",
    "description": "Description of the context",
    "appId": "APP_ID",
    "engineUrl": "wss://your-tenant.us.qlikcloud.com/app/APP_ID",
    "authType": "oauth2",
    "created": "2025-04-08T01:00:00.000Z",
    "isConnected": false
  }
}
```

### List Model Contexts

```
GET /api/v1/model/contexts
```

Returns a list of all model contexts.

**Query Parameters:**

- `limit` (optional): Maximum number of contexts to return
- `offset` (optional): Offset for pagination

**Response:**

```json
{
  "success": true,
  "data": {
    "contexts": [
      {
        "id": "CONTEXT_ID",
        "name": "My Model Context",
        "description": "Description of the context",
        "appId": "APP_ID",
        "created": "2025-04-08T01:00:00.000Z",
        "isConnected": false
      }
    ],
    "total": 1
  }
}
```

### Get Model Context

```
GET /api/v1/model/contexts/{contextId}
```

Returns details for a specific model context.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "CONTEXT_ID",
    "name": "My Model Context",
    "description": "Description of the context",
    "appId": "APP_ID",
    "engineUrl": "wss://your-tenant.us.qlikcloud.com/app/APP_ID",
    "authType": "oauth2",
    "created": "2025-04-08T01:00:00.000Z",
    "lastActivity": "2025-04-08T01:30:00.000Z",
    "isConnected": true,
    "metadata": {
      "app": {
        "id": "APP_ID",
        "name": "My App",
        "description": "App description",
        "lastReloadTime": "2025-04-07T12:00:00.000Z",
        "createdDate": "2025-01-01T00:00:00.000Z",
        "modifiedDate": "2025-04-07T12:00:00.000Z",
        "owner": {
          "id": "USER_ID",
          "name": "User Name"
        },
        "spaceId": "SPACE_ID"
      }
    }
  }
}
```

### Delete Model Context

```
DELETE /api/v1/model/contexts/{contextId}
```

Deletes a model context.

**Response:**

```json
{
  "success": true
}
```

### Connect to Engine

```
POST /api/v1/model/contexts/{contextId}/connect
```

Connects the model context to the Qlik Associative Engine.

**Response:**

```json
{
  "success": true,
  "data": {
    "isConnected": true
  }
}
```

### Disconnect from Engine

```
POST /api/v1/model/contexts/{contextId}/disconnect
```

Disconnects the model context from the Qlik Associative Engine.

**Response:**

```json
{
  "success": true,
  "data": {
    "isConnected": false
  }
}
```

## State Management Endpoints

### Save State

```
POST /api/v1/model/contexts/{contextId}/state
```

Saves the current state of the model context.

**Request Body:**

```json
{
  "name": "My Saved State",
  "description": "Description of the state"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "STATE_ID",
    "name": "My Saved State",
    "description": "Description of the state",
    "timestamp": "2025-04-08T01:45:00.000Z"
  }
}
```

### List States

```
GET /api/v1/model/contexts/{contextId}/state
```

Returns a list of all saved states for a model context.

**Query Parameters:**

- `limit` (optional): Maximum number of states to return
- `offset` (optional): Offset for pagination

**Response:**

```json
{
  "success": true,
  "data": {
    "states": [
      {
        "id": "STATE_ID",
        "name": "My Saved State",
        "description": "Description of the state",
        "timestamp": "2025-04-08T01:45:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### Get State

```
GET /api/v1/model/contexts/{contextId}/state/{stateId}
```

Returns details for a specific saved state.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "STATE_ID",
    "name": "My Saved State",
    "description": "Description of the state",
    "timestamp": "2025-04-08T01:45:00.000Z",
    "metadata": {
      "app": {
        "id": "APP_ID",
        "name": "My App"
      }
    }
  }
}
```

### Restore State

```
PUT /api/v1/model/contexts/{contextId}/state/{stateId}
```

Restores a saved state.

**Response:**

```json
{
  "success": true
}
```

### Delete State

```
DELETE /api/v1/model/contexts/{contextId}/state/{stateId}
```

Deletes a saved state.

**Response:**

```json
{
  "success": true
}
```

## Object Management Endpoints

### Create Object

```
POST /api/v1/model/contexts/{contextId}/objects
```

Creates a new object in the model context.

**Request Body:**

```json
{
  "objectType": "GenericObject",
  "properties": {
    "qInfo": {
      "qType": "chart"
    },
    "qHyperCubeDef": {
      "qDimensions": [
        {
          "qDef": {
            "qFieldDefs": ["Country"]
          }
        }
      ],
      "qMeasures": [
        {
          "qDef": {
            "qDef": "Sum(Sales)"
          }
        }
      ]
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "handle": "OBJECT_HANDLE",
    "objectType": "GenericObject",
    "properties": { ... }
  }
}
```

### List Objects

```
GET /api/v1/model/contexts/{contextId}/objects
```

Returns a list of all objects in the model context.

**Query Parameters:**

- `limit` (optional): Maximum number of objects to return
- `offset` (optional): Offset for pagination
- `objectType` (optional): Filter by object type

**Response:**

```json
{
  "success": true,
  "data": {
    "objects": [
      {
        "handle": "OBJECT_HANDLE",
        "objectType": "GenericObject",
        "properties": { ... }
      }
    ],
    "total": 1
  }
}
```

### Get Object

```
GET /api/v1/model/contexts/{contextId}/objects/{objectHandle}
```

Returns details for a specific object.

**Response:**

```json
{
  "success": true,
  "data": {
    "handle": "OBJECT_HANDLE",
    "objectType": "GenericObject",
    "properties": { ... }
  }
}
```

### Delete Object

```
DELETE /api/v1/model/contexts/{contextId}/objects/{objectHandle}
```

Deletes an object.

**Response:**

```json
{
  "success": true
}
```

### Execute Method

```
POST /api/v1/model/contexts/{contextId}/objects/{objectHandle}/method
```

Executes a method on an object.

**Request Body:**

```json
{
  "method": "getLayout",
  "params": []
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "result": { ... }
  }
}
```

## Metadata Endpoints

### Get Metadata

```
GET /api/v1/model/contexts/{contextId}/metadata
```

Returns all metadata for a model context.

**Response:**

```json
{
  "success": true,
  "data": {
    "app": { ... },
    "appMetadata": { ... },
    "appVariables": [ ... ],
    "appDimensions": [ ... ],
    "appMeasures": [ ... ]
  }
}
```

### Get Specific Metadata

```
GET /api/v1/model/contexts/{contextId}/metadata/{key}
```

Returns specific metadata for a model context.

**Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

### Set Metadata

```
PUT /api/v1/model/contexts/{contextId}/metadata/{key}
```

Sets metadata for a model context.

**Request Body:**

```json
{
  "value": { ... }
}
```

**Response:**

```json
{
  "success": true
}
```

### Delete Metadata

```
DELETE /api/v1/model/contexts/{contextId}/metadata/{key}
```

Deletes metadata for a model context.

**Response:**

```json
{
  "success": true
}
```

## WebSocket API

The WebSocket API provides real-time communication with the MCP server.

### Connection

Connect to the WebSocket endpoint:

```
ws://localhost:3000/api/v1/model/ws?token=YOUR_TOKEN
```

### Message Format

All messages are in JSON format:

```json
{
  "type": "message-type",
  "contextId": "CONTEXT_ID",
  "data": { ... }
}
```

### Client Messages

#### Subscribe to Context

```json
{
  "type": "subscribe",
  "contextId": "CONTEXT_ID"
}
```

#### Unsubscribe from Context

```json
{
  "type": "unsubscribe",
  "contextId": "CONTEXT_ID"
}
```

#### Create Object

```json
{
  "type": "create-object",
  "contextId": "CONTEXT_ID",
  "objectType": "GenericObject",
  "properties": { ... }
}
```

#### Delete Object

```json
{
  "type": "delete-object",
  "contextId": "CONTEXT_ID",
  "objectHandle": "OBJECT_HANDLE"
}
```

#### Execute Method

```json
{
  "type": "execute-method",
  "contextId": "CONTEXT_ID",
  "objectHandle": "OBJECT_HANDLE",
  "method": "getLayout",
  "params": []
}
```

#### Save State

```json
{
  "type": "save-state",
  "contextId": "CONTEXT_ID",
  "name": "My Saved State",
  "description": "Description of the state"
}
```

#### Restore State

```json
{
  "type": "restore-state",
  "contextId": "CONTEXT_ID",
  "stateId": "STATE_ID"
}
```

### Server Messages

#### Object Created

```json
{
  "type": "object-created",
  "contextId": "CONTEXT_ID",
  "objectHandle": "OBJECT_HANDLE",
  "objectType": "GenericObject",
  "properties": { ... }
}
```

#### Object Deleted

```json
{
  "type": "object-deleted",
  "contextId": "CONTEXT_ID",
  "objectHandle": "OBJECT_HANDLE"
}
```

#### Method Result

```json
{
  "type": "method-result",
  "contextId": "CONTEXT_ID",
  "objectHandle": "OBJECT_HANDLE",
  "method": "getLayout",
  "result": { ... }
}
```

#### State Saved

```json
{
  "type": "state-saved",
  "contextId": "CONTEXT_ID",
  "stateId": "STATE_ID",
  "name": "My Saved State"
}
```

#### State Restored

```json
{
  "type": "state-restored",
  "contextId": "CONTEXT_ID",
  "stateId": "STATE_ID"
}
```

#### Notification

```json
{
  "type": "notification",
  "contextId": "CONTEXT_ID",
  "notification": { ... }
}
```

#### Error

```json
{
  "type": "error",
  "contextId": "CONTEXT_ID",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Not authorized to perform the operation |
| `CONTEXT_NOT_FOUND` | Model context not found |
| `CONTEXT_ALREADY_EXISTS` | Model context already exists |
| `CONTEXT_NOT_CONNECTED` | Model context not connected to engine |
| `STATE_NOT_FOUND` | State not found |
| `OBJECT_NOT_FOUND` | Object not found |
| `METHOD_NOT_FOUND` | Method not found |
| `INVALID_PARAMETERS` | Invalid parameters |
| `ENGINE_ERROR` | Error from the Qlik Associative Engine |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limiting

The API is rate limited to prevent abuse. Rate limits are applied per user and per IP address.

| Endpoint | Rate Limit |
|----------|------------|
| All endpoints | 100 requests per minute |
| WebSocket connections | 10 connections per minute |

When rate limited, the server will respond with a 429 status code and a Retry-After header.
