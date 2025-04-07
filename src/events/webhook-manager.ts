import crypto from 'crypto';
import { WebhookEvent, WebhookHandler, WebhookValidationError } from './types';
import { LogManager } from '../utils';

/**
 * Webhook manager configuration interface
 */
export interface WebhookManagerConfig {
  /**
   * Webhook secret for signature validation
   */
  secret: string;
}

/**
 * Webhook manager class
 * Manages webhook event processing
 */
export class WebhookManager {
  private secret: string;
  private handlers: WebhookHandler[];
  private logger: LogManager;
  
  /**
   * Constructor
   * @param config Webhook manager configuration
   * @param logger Log manager
   */
  constructor(config: WebhookManagerConfig, logger: LogManager) {
    this.secret = config.secret;
    this.handlers = [];
    this.logger = logger;
  }
  
  /**
   * Register a webhook handler
   * @param handler The webhook handler to register
   */
  registerHandler(handler: WebhookHandler): void {
    this.handlers.push(handler);
  }
  
  /**
   * Process a webhook request
   * @param body The request body
   * @param signature The request signature
   * @returns Promise resolving when the request is processed
   */
  async processWebhook(body: string, signature: string): Promise<void> {
    // Validate signature
    this.validateSignature(body, signature);
    
    // Parse event
    const event = this.parseEvent(body);
    
    // Log event
    this.logger.logger.info(`Processing webhook event: ${event.type}`, {
      eventId: event.id,
      eventType: event.type,
      eventSource: event.source,
      eventSubject: event.subject
    });
    
    // Find handlers for this event type
    const matchingHandlers = this.handlers.filter(handler => handler.canHandle(event.type));
    
    if (matchingHandlers.length === 0) {
      this.logger.logger.warn(`No handlers found for event type: ${event.type}`);
      return;
    }
    
    // Process event with all matching handlers
    const promises = matchingHandlers.map(handler => {
      return handler.handleEvent(event)
        .catch(error => {
          this.logger.logger.error(`Error handling event ${event.id} with handler ${handler.constructor.name}:`, error);
        });
    });
    
    await Promise.all(promises);
  }
  
  /**
   * Validate webhook signature
   * @param body The request body
   * @param signature The request signature
   * @throws WebhookValidationError if signature is invalid
   */
  private validateSignature(body: string, signature: string): void {
    if (!signature) {
      throw new WebhookValidationError('Missing webhook signature');
    }
    
    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new WebhookValidationError('Invalid webhook signature');
    }
  }
  
  /**
   * Parse webhook event
   * @param body The request body
   * @returns The parsed webhook event
   * @throws WebhookValidationError if event is invalid
   */
  private parseEvent(body: string): WebhookEvent {
    try {
      const event = JSON.parse(body);
      
      // Validate required fields
      if (!event.id) {
        throw new WebhookValidationError('Missing event ID');
      }
      
      if (!event.type) {
        throw new WebhookValidationError('Missing event type');
      }
      
      if (!event.timestamp) {
        throw new WebhookValidationError('Missing event timestamp');
      }
      
      return event;
    } catch (error) {
      if (error instanceof WebhookValidationError) {
        throw error;
      }
      
      throw new WebhookValidationError('Invalid webhook event format', {
        cause: error as Error
      });
    }
  }
}
