# Model Context

This document explains the core concepts of model context management in the Qlik Cloud Model Context Protocol (MCP) server.

## What is Model Context?

In the Qlik Cloud ecosystem, a model context represents the state, structure, and behavior of an analytical model. It encompasses:

- The connection to a Qlik Sense app
- The objects created within that app (visualizations, dimensions, measures)
- The current state of selections and filters
- The relationships between different objects
- Metadata about the model and its components

The Model Context Protocol (MCP) provides a standardized way to create, manage, and synchronize these model contexts across different applications and sessions.

## Key Concepts

### Model Context

A model context is the central concept in the MCP server. It represents a connection to a Qlik Sense app and manages the state and objects within that app. Each model context has:

- A unique identifier
- Configuration information (app ID, engine URL, etc.)
- A collection of objects
- State information
- Metadata

Model contexts are created, managed, and accessed through the MCP server API.

### Model State

Model state represents the current condition of a model context at a specific point in time. It includes:

- The current selections and filters
- The properties of all objects
- The layout of visualizations
- Any custom metadata

States can be saved and restored, allowing users to return to a specific point in their analysis or share a particular view with others.

### Object Registry

The object registry tracks all objects created within a model context. Each object has:

- A handle (unique identifier within the session)
- A type (e.g., GenericObject, HyperCube, ListObject)
- Properties that define its behavior and appearance
- Methods that can be called to interact with it

The object registry ensures that objects are properly tracked and managed throughout their lifecycle.

### QIX Session

A QIX session represents a connection to the Qlik Associative Engine through the QIX protocol. It provides:

- Authentication with the engine
- Communication through WebSocket
- Method execution on engine objects
- Event handling for engine notifications

The QIX session is the foundation for all interactions with the Qlik Associative Engine.

## Model Context Lifecycle

### Creation

1. A client requests a new model context through the MCP server API
2. The server creates a new ModelContext instance with the provided configuration
3. The context establishes a connection to the Qlik Associative Engine
4. The context is registered with the ModelContextManager
5. The client receives the context ID for future operations

### Usage

Once created, a model context can be used to:

- Create and manage objects (visualizations, dimensions, measures)
- Execute methods on those objects
- Save and restore state
- Retrieve and update metadata
- Synchronize with Qlik Cloud resources

### State Management

Model contexts support comprehensive state management:

1. **Saving State**: The current state of the model context can be saved with an optional name
2. **Listing States**: All saved states for a context can be listed
3. **Restoring State**: A previously saved state can be restored, returning the context to that point
4. **Exporting/Importing**: States can be exported and imported for sharing or backup

### Termination

When a model context is no longer needed:

1. The client requests to delete the context
2. The server disconnects from the Qlik Associative Engine
3. All resources associated with the context are released
4. The context is removed from the ModelContextManager

## Integration with Qlik Cloud

The MCP server integrates with Qlik Cloud to provide additional functionality:

### App Integration

- Retrieving app metadata
- Accessing app objects (sheets, dimensions, measures)
- Reloading apps
- Monitoring app changes

### Data Connection Integration

- Retrieving data connection information
- Managing data connections
- Establishing connections to data sources

### Space Integration

- Accessing space information
- Managing space content
- Controlling access to resources

## Using Model Context in Applications

### REST API

The MCP server provides a comprehensive REST API for working with model contexts:

```
POST /api/v1/model/contexts                 # Create a new context
GET /api/v1/model/contexts                  # List all contexts
GET /api/v1/model/contexts/{contextId}      # Get a specific context
DELETE /api/v1/model/contexts/{contextId}   # Delete a context

POST /api/v1/model/contexts/{contextId}/connect     # Connect to the engine
POST /api/v1/model/contexts/{contextId}/disconnect  # Disconnect from the engine

POST /api/v1/model/contexts/{contextId}/state       # Save the current state
GET /api/v1/model/contexts/{contextId}/state        # List all saved states
PUT /api/v1/model/contexts/{contextId}/state/{stateId}  # Restore a state

POST /api/v1/model/contexts/{contextId}/objects     # Create a new object
GET /api/v1/model/contexts/{contextId}/objects      # List all objects
DELETE /api/v1/model/contexts/{contextId}/objects/{objectId}  # Delete an object
POST /api/v1/model/contexts/{contextId}/objects/{objectId}/method  # Execute a method
```

### WebSocket API

For real-time communication, the MCP server provides a WebSocket API:

```javascript
// Connect to the WebSocket
const ws = new WebSocket('ws://localhost:3000/api/v1/model/ws?token=YOUR_TOKEN');

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

// Execute a method
ws.send(JSON.stringify({
  type: 'execute-method',
  contextId: 'YOUR_CONTEXT_ID',
  objectHandle: 'YOUR_OBJECT_HANDLE',
  method: 'getLayout',
  params: []
}));

// Listen for events
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};
```

## Best Practices

### Context Management

- Create separate contexts for different analytical tasks
- Use meaningful names and descriptions for contexts
- Delete contexts when they are no longer needed to free resources

### State Management

- Save states at significant points in the analysis
- Use descriptive names for saved states
- Implement regular state saving for recovery purposes
- Export important states for backup or sharing

### Object Management

- Create objects with clear types and properties
- Use the object registry to track all objects
- Clean up objects when they are no longer needed
- Use appropriate caching strategies for object layouts

### Performance Considerations

- Limit the number of active contexts per user
- Implement timeout mechanisms for inactive contexts
- Use pagination when retrieving large lists of objects
- Optimize object properties to reduce data transfer
- Implement appropriate error handling and retry mechanisms

## Troubleshooting

Common issues and their solutions:

### Connection Issues

- Verify that the Qlik Cloud tenant is accessible
- Check authentication credentials
- Ensure the app ID is correct
- Verify network connectivity to the Qlik Associative Engine

### State Management Issues

- Ensure the context is connected before saving or restoring state
- Verify that the state ID is valid when restoring
- Check for conflicts when multiple clients modify the same context

### Object Creation Issues

- Verify that the object type is supported
- Check that the properties are correctly formatted
- Ensure the context is connected before creating objects
- Verify that you have appropriate permissions for the operation

For more troubleshooting information, see the [Troubleshooting Guide](./troubleshooting.md).
