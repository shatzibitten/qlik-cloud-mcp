# Architecture

The Qlik Cloud Model Context Protocol (MCP) server follows a modular architecture designed with SOLID and KISS principles. This document outlines the core components and their interactions.

## System Architecture

The MCP server is structured around several key modules that work together to provide a comprehensive model context management solution:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Qlik Cloud MCP Server                        │
│                                                                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │  HTTP Server  │    │  WebSocket    │    │  API Router   │   │
│  │               │◄───┤  Handler      │◄───┤               │   │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘   │
│          │                    │                    │           │
│          │                    │                    │           │
│  ┌───────▼───────────────────▼───────────────────▼───────┐    │
│  │                                                        │    │
│  │                 Model Context Manager                  │    │
│  │                                                        │    │
│  └───────┬───────────────────┬───────────────────┬───────┘    │
│          │                   │                   │            │
│  ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐    │
│  │ Model Context │   │ Object        │   │ Model State   │    │
│  │               │   │ Registry      │   │ Management    │    │
│  └───────┬───────┘   └───────────────┘   └───────────────┘    │
│          │                                                     │
│  ┌───────▼───────┐                                             │
│  │ QIX Session   │                                             │
│  │ Management    │                                             │
│  └───────┬───────┘                                             │
│          │                                                     │
│  ┌───────▼───────┐   ┌───────────────┐   ┌───────────────┐    │
│  │ WebSocket     │   │ Authentication│   │ Qlik Cloud    │    │
│  │ Connection    │   │ Manager       │   │ API Client    │    │
│  └───────────────┘   └───────┬───────┘   └───────┬───────┘    │
│                              │                   │            │
└──────────────────────────────┼───────────────────┼────────────┘
                               │                   │
                      ┌────────▼──────┐   ┌────────▼──────┐
                      │ OAuth2/JWT/   │   │ Qlik Cloud    │
                      │ API Key       │   │ REST APIs     │
                      └───────────────┘   └───────────────┘
```

## Core Components

### 1. Model Context Module

The Model Context Module is the heart of the MCP server, responsible for managing model state, object tracking, and session handling.

**Key Components:**
- **ModelContext**: Central component for managing model state and sessions
- **ModelState**: Handles state persistence across sessions
- **ObjectRegistry**: Tracks objects and their handles

**Responsibilities:**
- Creating and managing model contexts
- Saving and restoring model state
- Tracking model objects and their properties
- Managing sessions with the Qlik Associative Engine

### 2. Engine Communication Module

The Engine Communication Module handles WebSocket connections to the Qlik Associative Engine, providing a reliable communication channel for model operations.

**Key Components:**
- **WebSocketConnection**: Manages WebSocket communication with the Qlik Engine
- **QixSession**: Provides a higher-level interface using enigma.js

**Responsibilities:**
- Establishing and maintaining WebSocket connections
- Handling JSON-RPC protocol communication
- Managing session lifecycle
- Executing methods on engine objects

### 3. Authentication Module

The Authentication Module provides secure access to the MCP server and Qlik Cloud resources with multiple authentication methods.

**Key Components:**
- **AuthManager**: Orchestrates authentication process
- **OAuth2Provider**: Handles OAuth2 authentication
- **JWTProvider**: Manages JWT-based authentication
- **APIKeyProvider**: Supports API key authentication

**Responsibilities:**
- Authenticating users and clients
- Managing authentication tokens
- Providing secure access to Qlik Cloud resources
- Handling token refresh and expiration

### 4. API Integration Module

The API Integration Module connects the MCP server with Qlik Cloud REST APIs, enabling seamless integration with Qlik Cloud resources.

**Key Components:**
- **QlikCloudAPIClient**: Base client for Qlik Cloud REST APIs
- **QlikCloudAppClient**: Client for app-related operations
- **QlikCloudSpaceClient**: Client for space-related operations
- **QlikCloudDataConnectionClient**: Client for data connection operations
- **QlikCloudModelContextIntegration**: Connects APIs with Model Context

**Responsibilities:**
- Retrieving and managing Qlik Cloud resources
- Synchronizing model context with Qlik apps
- Handling API authentication
- Managing API errors and retries

### 5. Server Module

The Server Module exposes REST and WebSocket endpoints for client interaction, providing a comprehensive API for model context operations.

**Key Components:**
- **Server**: HTTP server with middleware and routing
- **ModelContextRouter**: REST API endpoints for model context operations
- **WebSocketHandler**: WebSocket interface for real-time updates

**Responsibilities:**
- Exposing REST API endpoints
- Handling WebSocket connections
- Processing client requests
- Returning appropriate responses

## Data Flow

1. **Client Authentication**:
   - Client authenticates using OAuth2, JWT, or API key
   - AuthManager validates credentials and provides access token
   - Token is used for subsequent requests

2. **Model Context Creation**:
   - Client requests new model context via REST API
   - ModelContextRouter processes request
   - ModelContextManager creates new ModelContext
   - QixSession establishes connection to Qlik Engine

3. **Model Operations**:
   - Client performs operations on model via REST API or WebSocket
   - Server routes requests to appropriate handlers
   - ModelContext executes operations on Qlik Engine
   - Results are returned to client

4. **State Management**:
   - Client requests to save or restore state
   - ModelContext captures or applies state
   - ModelState persists or retrieves state data
   - State changes are synchronized with Qlik Cloud

5. **Qlik Cloud Integration**:
   - QlikCloudModelContextIntegration connects with Qlik Cloud
   - QlikCloudAPIClient communicates with REST APIs
   - Model context is synchronized with Qlik Cloud resources
   - Changes are reflected in model context

## Design Principles

The MCP server architecture follows these key design principles:

1. **Modularity**: Each component has a single responsibility and can be developed, tested, and maintained independently.

2. **Separation of Concerns**: Clear boundaries between components with well-defined interfaces.

3. **Dependency Injection**: Components receive their dependencies rather than creating them.

4. **Event-Driven Communication**: Components communicate through events to reduce coupling.

5. **Error Handling**: Comprehensive error handling at all levels with proper logging.

6. **Testability**: Components designed to be easily testable with mock dependencies.

7. **Scalability**: Architecture supports horizontal scaling for handling multiple clients.

## Technology Stack

- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **Express**: Web framework
- **WebSocket**: Real-time communication
- **enigma.js**: Qlik Engine API client
- **axios**: HTTP client for REST APIs
- **jsonwebtoken**: JWT handling
- **winston**: Logging
