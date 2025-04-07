import { WebhookEvent, WebhookHandler } from './types';
import { APIManager } from '../api';
import { LogManager } from '../utils';

/**
 * App event handler class
 * Handles app-related webhook events
 */
export class AppEventHandler implements WebhookHandler {
  private apiManager: APIManager;
  private logger: LogManager;
  
  /**
   * Constructor
   * @param apiManager API manager
   * @param logger Log manager
   */
  constructor(apiManager: APIManager, logger: LogManager) {
    this.apiManager = apiManager;
    this.logger = logger;
  }
  
  /**
   * Handle a webhook event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  async handleEvent(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case 'app.reload.succeeded':
        await this.handleAppReloadSucceeded(event);
        break;
      case 'app.reload.failed':
        await this.handleAppReloadFailed(event);
        break;
      case 'app.published':
        await this.handleAppPublished(event);
        break;
      case 'app.deleted':
        await this.handleAppDeleted(event);
        break;
      default:
        this.logger.logger.warn(`Unhandled app event type: ${event.type}`);
    }
  }
  
  /**
   * Check if the handler can handle an event type
   * @param eventType The event type
   * @returns Boolean indicating if the handler can handle the event type
   */
  canHandle(eventType: string): boolean {
    return eventType.startsWith('app.');
  }
  
  /**
   * Handle app reload succeeded event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleAppReloadSucceeded(event: WebhookEvent): Promise<void> {
    const appId = event.data.appId;
    
    this.logger.logger.info(`App reload succeeded for app ${appId}`);
    
    // Example: Update app metadata or trigger additional actions
    try {
      const appClient = this.apiManager.getAppClient('oauth2');
      const app = await appClient.getById(appId);
      
      this.logger.logger.info(`App ${app.name} (${appId}) reloaded successfully at ${event.timestamp}`);
    } catch (error) {
      this.logger.logger.error(`Error processing app reload succeeded event:`, error);
    }
  }
  
  /**
   * Handle app reload failed event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleAppReloadFailed(event: WebhookEvent): Promise<void> {
    const appId = event.data.appId;
    const error = event.data.error;
    
    this.logger.logger.error(`App reload failed for app ${appId}: ${error}`);
    
    // Example: Log error details and notify administrators
    try {
      const appClient = this.apiManager.getAppClient('oauth2');
      const app = await appClient.getById(appId);
      
      this.logger.logger.error(`App ${app.name} (${appId}) reload failed at ${event.timestamp}: ${error}`);
    } catch (error) {
      this.logger.logger.error(`Error processing app reload failed event:`, error);
    }
  }
  
  /**
   * Handle app published event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleAppPublished(event: WebhookEvent): Promise<void> {
    const appId = event.data.appId;
    
    this.logger.logger.info(`App ${appId} published`);
    
    // Example: Update app metadata or trigger additional actions
    try {
      const appClient = this.apiManager.getAppClient('oauth2');
      const app = await appClient.getById(appId);
      
      this.logger.logger.info(`App ${app.name} (${appId}) published at ${event.timestamp}`);
    } catch (error) {
      this.logger.logger.error(`Error processing app published event:`, error);
    }
  }
  
  /**
   * Handle app deleted event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleAppDeletedEvent(event: WebhookEvent): Promise<void> {
    const appId = event.data.appId;
    
    this.logger.logger.info(`App ${appId} deleted`);
    
    // Example: Clean up related resources or trigger additional actions
    try {
      // Perform cleanup actions
      this.logger.logger.info(`Cleaned up resources for deleted app ${appId}`);
    } catch (error) {
      this.logger.logger.error(`Error processing app deleted event:`, error);
    }
  }
  
  /**
   * Handle app deleted event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleAppDeleted(event: WebhookEvent): Promise<void> {
    const appId = event.data.appId;
    
    this.logger.logger.info(`App ${appId} deleted`);
    
    // Example: Clean up related resources or trigger additional actions
    try {
      // Perform cleanup actions
      this.logger.logger.info(`Cleaned up resources for deleted app ${appId}`);
    } catch (error) {
      this.logger.logger.error(`Error processing app deleted event:`, error);
    }
  }
}
