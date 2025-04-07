/**
 * Webhook event interface
 */
export interface WebhookEvent {
  /**
   * Event ID
   */
  id: string;
  
  /**
   * Event type
   */
  type: string;
  
  /**
   * Event timestamp
   */
  timestamp: string;
  
  /**
   * Event source
   */
  source: string;
  
  /**
   * Event subject
   */
  subject: string;
  
  /**
   * Event data
   */
  data: Record<string, any>;
}

/**
 * Webhook handler interface
 * Defines the contract for webhook event handlers
 */
export interface WebhookHandler {
  /**
   * Handle a webhook event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  handleEvent(event: WebhookEvent): Promise<void>;
  
  /**
   * Check if the handler can handle an event type
   * @param eventType The event type
   * @returns Boolean indicating if the handler can handle the event type
   */
  canHandle(eventType: string): boolean;
}

/**
 * Webhook error class
 */
export class WebhookError extends Error {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Error details
   */
  details?: Record<string, any>;
  
  /**
   * Constructor
   * @param message Error message
   * @param options Error options
   */
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { cause: options?.cause });
    this.name = 'WebhookError';
    this.code = options?.code || 'WEBHOOK_ERROR';
    this.details = options?.details;
  }
}

/**
 * Webhook validation error class
 */
export class WebhookValidationError extends WebhookError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'WEBHOOK_VALIDATION_ERROR', details: options?.details, cause: options?.cause });
    this.name = 'WebhookValidationError';
  }
}

/**
 * Webhook processing error class
 */
export class WebhookProcessingError extends WebhookError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'WEBHOOK_PROCESSING_ERROR', details: options?.details, cause: options?.cause });
    this.name = 'WebhookProcessingError';
  }
}

/**
 * Webhook notification error class
 */
export class WebhookNotificationError extends WebhookError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'WEBHOOK_NOTIFICATION_ERROR', details: options?.details, cause: options?.cause });
    this.name = 'WebhookNotificationError';
  }
}
