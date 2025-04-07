import axios from 'axios';
import { WebhookEvent, WebhookHandler, WebhookNotificationError } from './types';
import { LogManager } from '../utils';

/**
 * Notification handler configuration interface
 */
export interface NotificationHandlerConfig {
  /**
   * Slack webhook URL (optional)
   */
  slackWebhookUrl?: string;
  
  /**
   * Email recipients (optional)
   */
  emailRecipients?: string[];
  
  /**
   * Email configuration (optional)
   */
  email?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
}

/**
 * Notification handler class
 * Handles sending notifications for webhook events
 */
export class NotificationHandler implements WebhookHandler {
  private config: NotificationHandlerConfig;
  private logger: LogManager;
  
  /**
   * Constructor
   * @param config Notification handler configuration
   * @param logger Log manager
   */
  constructor(config: NotificationHandlerConfig, logger: LogManager) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Handle a webhook event
   * @param event The webhook event
   * @returns Promise resolving when the event is handled
   */
  async handleEvent(event: WebhookEvent): Promise<void> {
    // Create notification message
    const message = this.createNotificationMessage(event);
    
    // Send notifications
    const promises: Promise<void>[] = [];
    
    if (this.config.slackWebhookUrl) {
      promises.push(this.sendSlackNotification(message, event));
    }
    
    if (this.config.emailRecipients && this.config.emailRecipients.length > 0 && this.config.email) {
      promises.push(this.sendEmailNotification(message, event));
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Check if the handler can handle an event type
   * @param eventType The event type
   * @returns Boolean indicating if the handler can handle the event type
   */
  canHandle(eventType: string): boolean {
    // This handler can handle all event types
    return true;
  }
  
  /**
   * Create notification message
   * @param event The webhook event
   * @returns The notification message
   */
  private createNotificationMessage(event: WebhookEvent): string {
    // Format timestamp
    const timestamp = new Date(event.timestamp).toLocaleString();
    
    // Create message
    let message = `*Qlik Cloud Event: ${event.type}*\n`;
    message += `*Time:* ${timestamp}\n`;
    message += `*Source:* ${event.source}\n`;
    message += `*Subject:* ${event.subject}\n`;
    
    // Add event data
    if (event.data) {
      message += `*Details:*\n\`\`\`\n${JSON.stringify(event.data, null, 2)}\n\`\`\``;
    }
    
    return message;
  }
  
  /**
   * Send Slack notification
   * @param message The notification message
   * @param event The webhook event
   * @returns Promise resolving when the notification is sent
   */
  private async sendSlackNotification(message: string, event: WebhookEvent): Promise<void> {
    try {
      await axios.post(this.config.slackWebhookUrl!, {
        text: message
      });
      
      this.logger.logger.info(`Sent Slack notification for event ${event.id}`);
    } catch (error: any) {
      throw new WebhookNotificationError(`Failed to send Slack notification: ${error.message}`, {
        cause: error
      });
    }
  }
  
  /**
   * Send email notification
   * @param message The notification message
   * @param event The webhook event
   * @returns Promise resolving when the notification is sent
   */
  private async sendEmailNotification(message: string, event: WebhookEvent): Promise<void> {
    try {
      // In a real implementation, you would use a library like nodemailer
      // This is a placeholder implementation
      this.logger.logger.info(`Would send email notification for event ${event.id} to ${this.config.emailRecipients!.join(', ')}`);
      
      /*
      const transporter = nodemailer.createTransport({
        host: this.config.email!.host,
        port: this.config.email!.port,
        secure: this.config.email!.secure,
        auth: {
          user: this.config.email!.auth.user,
          pass: this.config.email!.auth.pass
        }
      });
      
      await transporter.sendMail({
        from: this.config.email!.from,
        to: this.config.emailRecipients!.join(', '),
        subject: `Qlik Cloud Event: ${event.type}`,
        text: message.replace(/\*([^*]+)\*/g, '$1').replace(/`/g, ''),
        html: message.replace(/\*([^*]+)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>').replace(/```([\s\S]+?)```/g, '<pre>$1</pre>')
      });
      */
    } catch (error: any) {
      throw new WebhookNotificationError(`Failed to send email notification: ${error.message}`, {
        cause: error
      });
    }
  }
}
