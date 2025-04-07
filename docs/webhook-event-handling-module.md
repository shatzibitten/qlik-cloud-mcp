# Webhook Event Handling Module Design

## Overview

The Webhook Event Handling Module is responsible for processing events from Qlik Cloud. It provides a mechanism for receiving, validating, processing, and responding to webhook events.

## Components

### EventListener

The `EventListener` listens for incoming webhook events:

```typescript
class EventListener {
  private secret: string;
  private processor: EventProcessor;
  
  constructor(secret: string, processor: EventProcessor) {
    this.secret = secret;
    this.processor = processor;
  }
  
  /**
   * Handle an incoming webhook event
   * @param payload The event payload
   * @param signature The event signature
   * @returns Promise resolving when the event is processed
   */
  async handleEvent(payload: any, signature: string): Promise<void> {
    // Validate the event signature
    if (!this.validateSignature(payload, signature)) {
      throw new EventValidationError('Invalid event signature');
    }
    
    // Parse the event
    const event: WebhookEvent = {
      id: payload.id,
      type: payload.type,
      timestamp: payload.timestamp,
      tenantId: payload.tenantId,
      payload: payload.data
    };
    
    // Process the event
    await this.processor.processEvent(event);
  }
  
  /**
   * Validate the event signature
   * @param payload The event payload
   * @param signature The event signature
   * @returns Boolean indicating if the signature is valid
   */
  private validateSignature(payload: any, signature: string): boolean {
    // Create a HMAC SHA-256 hash using the secret
    const hmac = crypto.createHmac('sha256', this.secret);
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const calculatedSignature = hmac.update(payloadString).digest('hex');
    
    // Compare the calculated signature with the provided signature
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  }
}
```

### EventProcessor

The `EventProcessor` processes and routes events:

```typescript
class EventProcessor {
  private handlers: EventHandler[];
  
  constructor() {
    this.handlers = [];
  }
  
  /**
   * Register an event handler
   * @param handler The event handler to register
   */
  registerHandler(handler: EventHandler): void {
    this.handlers.push(handler);
  }
  
  /**
   * Process an event
   * @param event The event to process
   * @returns Promise resolving when the event is processed
   */
  async processEvent(event: WebhookEvent): Promise<void> {
    // Find handlers that can handle this event
    const matchingHandlers = this.handlers.filter(handler => handler.canHandle(event));
    
    if (matchingHandlers.length === 0) {
      console.warn(`No handlers found for event type: ${event.type}`);
      return;
    }
    
    // Process the event with all matching handlers
    await Promise.all(matchingHandlers.map(handler => handler.handle(event)));
  }
}
```

### EventHandler Interface

The `EventHandler` interface defines the contract for event handlers:

```typescript
interface EventHandler {
  /**
   * Check if this handler can handle the event
   * @param event The event to check
   * @returns Boolean indicating if the handler can handle the event
   */
  canHandle(event: WebhookEvent): boolean;
  
  /**
   * Handle the event
   * @param event The event to handle
   * @returns Promise resolving when the event is handled
   */
  handle(event: WebhookEvent): Promise<void>;
}
```

### Event-Specific Handlers

#### AppCreatedHandler

```typescript
class AppCreatedHandler implements EventHandler {
  private notificationManager: NotificationManager;
  
  constructor(notificationManager: NotificationManager) {
    this.notificationManager = notificationManager;
  }
  
  canHandle(event: WebhookEvent): boolean {
    return event.type === 'app.created';
  }
  
  async handle(event: WebhookEvent): Promise<void> {
    const appId = event.payload.id;
    const appName = event.payload.name;
    const createdBy = event.payload.createdBy;
    
    // Send notification
    await this.notificationManager.sendNotification({
      type: 'app.created',
      title: 'New App Created',
      message: `A new app "${appName}" was created by ${createdBy}`,
      data: {
        appId,
        appName,
        createdBy,
        timestamp: event.timestamp
      }
    });
    
    // Additional processing as needed
    console.log(`App created: ${appName} (${appId})`);
  }
}
```

#### UserAddedHandler

```typescript
class UserAddedHandler implements EventHandler {
  private notificationManager: NotificationManager;
  private emailService: EmailService;
  
  constructor(notificationManager: NotificationManager, emailService: EmailService) {
    this.notificationManager = notificationManager;
    this.emailService = emailService;
  }
  
  canHandle(event: WebhookEvent): boolean {
    return event.type === 'user.added';
  }
  
  async handle(event: WebhookEvent): Promise<void> {
    const userId = event.payload.id;
    const userEmail = event.payload.email;
    const userName = event.payload.name;
    
    // Send notification
    await this.notificationManager.sendNotification({
      type: 'user.added',
      title: 'New User Added',
      message: `A new user "${userName}" (${userEmail}) was added`,
      data: {
        userId,
        userEmail,
        userName,
        timestamp: event.timestamp
      }
    });
    
    // Send welcome email
    await this.emailService.sendEmail({
      to: userEmail,
      subject: 'Welcome to Qlik Cloud',
      body: `Hello ${userName},\n\nWelcome to Qlik Cloud! Your account has been created.`
    });
    
    // Additional processing as needed
    console.log(`User added: ${userName} (${userId})`);
  }
}
```

### NotificationManager

The `NotificationManager` manages notifications based on events:

```typescript
class NotificationManager {
  private channels: NotificationChannel[];
  
  constructor() {
    this.channels = [];
  }
  
  /**
   * Register a notification channel
   * @param channel The channel to register
   */
  registerChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }
  
  /**
   * Send a notification to all channels
   * @param notification The notification to send
   * @returns Promise resolving when the notification is sent
   */
  async sendNotification(notification: Notification): Promise<void> {
    await Promise.all(this.channels.map(channel => channel.sendNotification(notification)));
  }
}
```

### NotificationChannel Interface

The `NotificationChannel` interface defines the contract for notification channels:

```typescript
interface NotificationChannel {
  /**
   * Send a notification
   * @param notification The notification to send
   * @returns Promise resolving when the notification is sent
   */
  sendNotification(notification: Notification): Promise<void>;
}
```

### Notification Channels

#### SlackNotificationChannel

```typescript
class SlackNotificationChannel implements NotificationChannel {
  private webhookUrl: string;
  
  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }
  
  async sendNotification(notification: Notification): Promise<void> {
    // Format notification for Slack
    const slackMessage = {
      text: notification.title,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: notification.title
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: notification.message
          }
        }
      ]
    };
    
    // Send to Slack
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackMessage)
    });
  }
}
```

#### EmailNotificationChannel

```typescript
class EmailNotificationChannel implements NotificationChannel {
  private emailService: EmailService;
  private recipients: string[];
  
  constructor(emailService: EmailService, recipients: string[]) {
    this.emailService = emailService;
    this.recipients = recipients;
  }
  
  async sendNotification(notification: Notification): Promise<void> {
    // Send email to all recipients
    await Promise.all(this.recipients.map(recipient => 
      this.emailService.sendEmail({
        to: recipient,
        subject: notification.title,
        body: notification.message
      })
    ));
  }
}
```

## Data Models

### WebhookEvent

```typescript
interface WebhookEvent {
  /**
   * The event ID
   */
  id: string;
  
  /**
   * The event type
   */
  type: string;
  
  /**
   * The event timestamp
   */
  timestamp: string;
  
  /**
   * The tenant ID
   */
  tenantId: string;
  
  /**
   * The event payload
   */
  payload: any;
  
  /**
   * The event signature (optional)
   */
  signature?: string;
}
```

### Notification

```typescript
interface Notification {
  /**
   * The notification type
   */
  type: string;
  
  /**
   * The notification title
   */
  title: string;
  
  /**
   * The notification message
   */
  message: string;
  
  /**
   * Additional notification data
   */
  data?: Record<string, any>;
}
```

### Email

```typescript
interface Email {
  /**
   * The recipient email address
   */
  to: string;
  
  /**
   * The email subject
   */
  subject: string;
  
  /**
   * The email body
   */
  body: string;
  
  /**
   * Additional email options
   */
  options?: Record<string, any>;
}
```

## Services

### EmailService

```typescript
class EmailService {
  private transport: any; // Nodemailer transport
  private from: string;
  
  constructor(config: EmailServiceConfig) {
    // Initialize nodemailer transport
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      }
    });
    
    this.from = config.from;
  }
  
  /**
   * Send an email
   * @param email The email to send
   * @returns Promise resolving when the email is sent
   */
  async sendEmail(email: Email): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: email.to,
      subject: email.subject,
      text: email.body,
      ...email.options
    });
  }
}
```

## Configuration

The Webhook Event Handling Module is configured through environment variables or configuration files:

```typescript
interface WebhookConfig {
  /**
   * The webhook secret for signature validation
   */
  secret: string;
  
  /**
   * Notification channels configuration
   */
  notifications?: {
    /**
     * Slack webhook URL (optional)
     */
    slackWebhookUrl?: string;
    
    /**
     * Email notification recipients (optional)
     */
    emailRecipients?: string[];
  };
  
  /**
   * Email service configuration (optional)
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
```

## Error Handling

The Webhook Event Handling Module defines the following error types:

1. **EventValidationError**: Thrown when event validation fails.
2. **EventProcessingError**: Thrown when event processing fails.
3. **NotificationError**: Thrown when notification sending fails.

All errors include appropriate error codes, messages, and details to aid in troubleshooting.

## Security Considerations

1. **Signature Validation**: Always validate webhook signatures to ensure events are from Qlik Cloud.
2. **HTTPS**: Use HTTPS for all webhook endpoints.
3. **IP Filtering**: Optionally restrict webhook access to Qlik Cloud IP ranges.
4. **Rate Limiting**: Implement rate limiting to prevent abuse.
5. **Error Handling**: Handle errors without exposing sensitive information.

## Usage Example

```typescript
// Create notification manager
const notificationManager = new NotificationManager();

// Register notification channels
if (config.notifications?.slackWebhookUrl) {
  notificationManager.registerChannel(
    new SlackNotificationChannel(config.notifications.slackWebhookUrl)
  );
}

if (config.notifications?.emailRecipients && config.email) {
  const emailService = new EmailService(config.email);
  notificationManager.registerChannel(
    new EmailNotificationChannel(emailService, config.notifications.emailRecipients)
  );
}

// Create event processor
const eventProcessor = new EventProcessor();

// Register event handlers
eventProcessor.registerHandler(new AppCreatedHandler(notificationManager));
eventProcessor.registerHandler(new UserAddedHandler(notificationManager, emailService));

// Create event listener
const eventListener = new EventListener(config.secret, eventProcessor);

// Express route handler
app.post('/webhooks/qlik', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-qlik-signature'] as string;
    await eventListener.handleEvent(req.body, signature);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Invalid webhook event');
  }
});
```
