import { QlikCloudAPIManager } from './qlik-cloud-api-manager';
import { 
  User, UserClient,
  Space, SpaceClient,
  DataConnection, DataConnectionClient,
  Extension, ExtensionClient,
  Theme, ThemeClient
} from './qlik-cloud-clients';
import {
  Content, ContentClient,
  Collection, CollectionClient,
  Report, ReportClient,
  Automation, AutomationClient
} from './qlik-cloud-clients-additional';

// Update the exports from the API module
export {
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
