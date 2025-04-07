import { APIClient, APIClientConfig } from './api-client';
import { ResourceClient, BaseResourceClient } from './resource-client';
import { APIKey, APIKeyClient, App, AppClient, Audit, AuditClient } from './resource-clients';
import { APIManager, APIManagerConfig } from './api-manager';
import { 
  APIRequest, 
  APIResponse, 
  APIError, 
  RequestError, 
  ResponseError, 
  ResourceNotFoundError, 
  AuthorizationError, 
  ValidationError, 
  RateLimitError, 
  ServerError 
} from './types';

// Import Qlik Cloud specific exports
import {
  QlikCloudAPIManager,
  User, UserClient,
  Space, SpaceClient,
  DataConnection, DataConnectionClient,
  Extension, ExtensionClient,
  Theme, ThemeClient,
  Content, ContentClient,
  Collection, CollectionClient,
  Report, ReportClient,
  Automation, AutomationClient
} from './qlik-cloud';

export {
  // API Client
  APIClient,
  APIClientConfig,
  
  // Resource Client
  ResourceClient,
  BaseResourceClient,
  
  // Resource Clients
  APIKey,
  APIKeyClient,
  App,
  AppClient,
  Audit,
  AuditClient,
  
  // API Manager
  APIManager,
  APIManagerConfig,
  
  // Types
  APIRequest,
  APIResponse,
  
  // Errors
  APIError,
  RequestError,
  ResponseError,
  ResourceNotFoundError,
  AuthorizationError,
  ValidationError,
  RateLimitError,
  ServerError,
  
  // Qlik Cloud API Manager
  QlikCloudAPIManager,
  
  // Qlik Cloud Resource Types
  User,
  Space,
  DataConnection,
  Extension,
  Theme,
  Content,
  Collection,
  Report,
  Automation,
  
  // Qlik Cloud Resource Clients
  UserClient,
  SpaceClient,
  DataConnectionClient,
  ExtensionClient,
  ThemeClient,
  ContentClient,
  CollectionClient,
  ReportClient,
  AutomationClient
};
