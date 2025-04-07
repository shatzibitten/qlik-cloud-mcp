import { WebhookEvent, WebhookHandler } from './types';
import { APIManager } from '../api';
import { LogManager } from '../utils';

/**
 * User event handler class
 * Handles user-related webhook events
 */
export class UserEventHandler implements WebhookHandler {
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
      case 'user.created':
        await this.handleUserCreated(event);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event);
        break;
      case 'user.login':
        await this.handleUserLogin(event);
        break;
      default:
        this.logger.logger.warn(`Unhandled user event type: ${event.type}`);
    }
  }
  
  /**
   * Check if the handler can handle an event type
   * @param eventType The event type
   * @returns Boolean indicating if the handler can handle the event type
   */
  canHandle(eventType: string): boolean {
    return eventType.startsWith('user.');
  }
  
  /**
   * Handle user created event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleUserCreated(event: WebhookEvent): Promise<void> {
    const userId = event.data.userId;
    
    this.logger.logger.info(`User ${userId} created`);
    
    // Example: Perform additional setup for new users
    try {
      const userClient = this.apiManager.getUserClient('oauth2');
      const user = await userClient.getById(userId);
      
      this.logger.logger.info(`User ${user.name} (${userId}) created at ${event.timestamp}`);
      
      // Example: Add user to default spaces or assign default roles
      // This would depend on your organization's specific requirements
    } catch (error) {
      this.logger.logger.error(`Error processing user created event:`, error);
    }
  }
  
  /**
   * Handle user updated event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleUserUpdated(event: WebhookEvent): Promise<void> {
    const userId = event.data.userId;
    
    this.logger.logger.info(`User ${userId} updated`);
    
    // Example: Sync user changes with other systems
    try {
      const userClient = this.apiManager.getUserClient('oauth2');
      const user = await userClient.getById(userId);
      
      this.logger.logger.info(`User ${user.name} (${userId}) updated at ${event.timestamp}`);
      
      // Example: Sync user changes with other systems
      // This would depend on your organization's specific requirements
    } catch (error) {
      this.logger.logger.error(`Error processing user updated event:`, error);
    }
  }
  
  /**
   * Handle user deleted event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleUserDeleted(event: WebhookEvent): Promise<void> {
    const userId = event.data.userId;
    
    this.logger.logger.info(`User ${userId} deleted`);
    
    // Example: Clean up user resources
    try {
      // Perform cleanup actions
      this.logger.logger.info(`Cleaned up resources for deleted user ${userId}`);
      
      // Example: Remove user from external systems
      // This would depend on your organization's specific requirements
    } catch (error) {
      this.logger.logger.error(`Error processing user deleted event:`, error);
    }
  }
  
  /**
   * Handle user login event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  private async handleUserLogin(event: WebhookEvent): Promise<void> {
    const userId = event.data.userId;
    
    this.logger.logger.info(`User ${userId} logged in`);
    
    // Example: Track user activity
    try {
      // Record login activity
      this.logger.logger.info(`Recorded login activity for user ${userId} at ${event.timestamp}`);
      
      // Example: Update user's last login timestamp in your system
      // This would depend on your organization's specific requirements
    } catch (error) {
      this.logger.logger.error(`Error processing user login event:`, error);
    }
  }
}
