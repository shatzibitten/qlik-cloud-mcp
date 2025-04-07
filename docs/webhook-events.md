# Webhook Events Guide

This guide provides detailed information on the webhook event handling capabilities of the Qlik Cloud MCP server.

## Overview

The Qlik Cloud MCP server can process webhook events from Qlik Cloud, allowing you to react to changes in your Qlik Cloud environment. It validates event signatures, routes events to appropriate handlers, and can send notifications for important events.

## Supported Event Types

The MCP server supports the following event types:

### App Events

- `app.reload.succeeded`: An app reload succeeded
- `app.reload.failed`: An app reload failed
- `app.published`: An app was published
- `app.deleted`: An app was deleted

### User Events

- `user.created`: A user was created
- `user.updated`: A user was updated
- `user.deleted`: A user was deleted
- `user.login`: A user logged in

### System Events

- `system.maintenance.scheduled`: System maintenance was scheduled
- `system.maintenance.started`: System maintenance started
- `system.maintenance.completed`: System maintenance completed
- `system.alert`: A system alert was triggered

## Configuring Webhooks in Qlik Cloud

To receive webhook events from Qlik Cloud:

1. Log in to your Qlik Cloud tenant
2. Go to the Management Console
3. Navigate to Integrations > Webhooks
4. Click "Add Webhook"
5. Enter the MCP server webhook URL: `http://your-mcp-server:3000/webhooks/qlik`
6. Select the event types you want to receive
7. Enter a webhook secret (this will be used to validate the webhook signature)
8. Click "Create" to create the webhook

## Webhook Configuration

To configure webhook handling in the MCP server, set the following configuration:

```json
{
  "webhook": {
    "secret": "your-webhook-secret",
    "notifications": {
      "slackWebhookUrl": "https://hooks.slack.com/services/your-slack-webhook-url",
      "emailRecipients": ["user1@example.com", "user2@example.com"]
    },
    "email": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "user@example.com",
        "pass": "password"
      },
      "from": "noreply@example.com"
    }
  }
}
```

Or using environment variables:

```bash
export MCP_WEBHOOK_SECRET=your-webhook-secret
export MCP_WEBHOOK_NOTIFICATIONS_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-slack-webhook-url
export MCP_WEBHOOK_NOTIFICATIONS_EMAIL_RECIPIENTS=user1@example.com,user2@example.com
export MCP_WEBHOOK_EMAIL_HOST=smtp.example.com
export MCP_WEBHOOK_EMAIL_PORT=587
export MCP_WEBHOOK_EMAIL_SECURE=false
export MCP_WEBHOOK_EMAIL_AUTH_USER=user@example.com
export MCP_WEBHOOK_EMAIL_AUTH_PASS=password
export MCP_WEBHOOK_EMAIL_FROM=noreply@example.com
```

## Webhook Event Structure

Webhook events from Qlik Cloud have the following structure:

```json
{
  "id": "event-id",
  "type": "event-type",
  "timestamp": "2025-04-07T17:00:00.000Z",
  "source": "event-source",
  "subject": "event-subject",
  "data": {
    "key": "value"
  }
}
```

- `id`: Unique identifier for the event
- `type`: Type of the event (e.g., `app.reload.succeeded`)
- `timestamp`: Time when the event occurred
- `source`: Source of the event (e.g., `qlik-cloud`)
- `subject`: Subject of the event (e.g., `app-id`)
- `data`: Additional data specific to the event type

## Webhook Handlers

The MCP server includes several built-in webhook handlers:

### Notification Handler

The notification handler sends notifications for webhook events via Slack and email. It can handle all event types.

### App Event Handler

The app event handler processes app-related events:

- `app.reload.succeeded`: Logs the successful reload and updates app metadata
- `app.reload.failed`: Logs the failed reload and notifies administrators
- `app.published`: Logs the publication and updates app metadata
- `app.deleted`: Logs the deletion and cleans up related resources

### User Event Handler

The user event handler processes user-related events:

- `user.created`: Logs the creation and performs additional setup for new users
- `user.updated`: Logs the update and syncs user changes with other systems
- `user.deleted`: Logs the deletion and cleans up user resources
- `user.login`: Logs the login and tracks user activity

### System Event Handler

The system event handler processes system-related events:

- `system.maintenance.scheduled`: Logs the scheduled maintenance and prepares systems
- `system.maintenance.started`: Logs the maintenance start and pauses operations
- `system.maintenance.completed`: Logs the maintenance completion and resumes operations
- `system.alert`: Logs the alert and takes action based on the alert type

## Custom Webhook Handlers

You can implement custom webhook handlers to process events in specific ways. Custom handlers must implement the `WebhookHandler` interface:

```typescript
interface WebhookHandler {
  handleEvent(event: WebhookEvent): Promise<void>;
  canHandle(eventType: string): boolean;
}
```

Example custom handler:

```typescript
import { WebhookEvent, WebhookHandler } from 'qlik-cloud-mcp';

class CustomHandler implements WebhookHandler {
  async handleEvent(event: WebhookEvent): Promise<void> {
    console.log(`Processing event: ${event.type}`);
    // Custom event handling logic
  }

  canHandle(eventType: string): boolean {
    // Handle specific event types
    return eventType.startsWith('custom.');
  }
}
```

## Webhook Security

Webhook security is important to ensure that only legitimate events from Qlik Cloud are processed. The MCP server validates webhook signatures using the webhook secret.

### Signature Validation

When Qlik Cloud sends a webhook event, it includes a signature in the `X-Qlik-Signature` header. The MCP server validates this signature by:

1. Computing the HMAC-SHA256 of the request body using the webhook secret
2. Comparing the computed signature with the signature in the header
3. Rejecting the request if the signatures don't match

### Best Practices

- Use a strong, random webhook secret
- Store the webhook secret securely (e.g., using environment variables)
- Use HTTPS in production to protect webhook events in transit
- Validate webhook signatures to prevent unauthorized events

## Troubleshooting

### Common Issues

#### Webhook Signature Validation Failures

- Check that the webhook secret in the MCP server configuration matches the secret in Qlik Cloud
- Ensure that the webhook secret is correctly set in the environment variables or configuration file
- Verify that the webhook URL in Qlik Cloud is correct

#### Missing Webhook Events

- Check that the webhook is correctly configured in Qlik Cloud
- Verify that the event types you want to receive are selected in the webhook configuration
- Ensure that the MCP server is accessible from Qlik Cloud

#### Notification Failures

- Check that the Slack webhook URL is correct
- Verify that the email configuration is correct
- Ensure that the SMTP server is accessible from the MCP server

## Next Steps

After setting up webhook event handling, you can:

1. Implement custom webhook handlers for specific use cases
2. Configure notifications for important events
3. Integrate webhook events with your existing systems

For more information, see the following guides:

- [Development Guide](./development.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [API Reference](./api-reference.md)
