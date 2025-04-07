import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotificationHandler } from '../../src/events/notification-handler';
import { WebhookEvent } from '../../src/events/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationHandler', () => {
  let notificationHandler: NotificationHandler;
  
  const config = {
    slack: {
      enabled: true,
      webhookUrl: 'https://hooks.slack.com/services/test-webhook-url'
    },
    email: {
      enabled: true,
      recipients: ['user1@example.com', 'user2@example.com'],
      smtpConfig: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test-user',
          pass: 'test-password'
        }
      }
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create notification handler
    notificationHandler = new NotificationHandler(config);
  });

  describe('canHandle', () => {
    it('should return true for notification events', () => {
      // Create notification event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'notification.alert',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'Test Alert',
        data: { message: 'Test notification message' }
      };
      
      // Check if handler can handle event
      const result = notificationHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(true);
    });
    
    it('should return false for non-notification events', () => {
      // Create non-notification event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'app.reload.success',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'App Reload',
        data: { appId: 'test-app-id' }
      };
      
      // Check if handler can handle event
      const result = notificationHandler.canHandle(event);
      
      // Verify result
      expect(result).toBe(false);
    });
  });

  describe('handle', () => {
    it('should send notifications to all configured channels', async () => {
      // Mock successful Slack response
      mockedAxios.post.mockResolvedValueOnce({ status: 200 });
      
      // Mock successful email sending
      const mockSendMail = jest.fn().mockResolvedValueOnce({ messageId: 'test-message-id' });
      jest.spyOn(notificationHandler as any, 'sendEmail').mockImplementationOnce(mockSendMail);
      
      // Create notification event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'notification.alert',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'Test Alert',
        data: { message: 'Test notification message', severity: 'high' }
      };
      
      // Handle event
      await notificationHandler.handle(event);
      
      // Verify Slack notification was sent
      expect(mockedAxios.post).toHaveBeenCalledWith(
        config.slack.webhookUrl,
        expect.objectContaining({
          text: expect.stringContaining('Test Alert'),
          blocks: expect.any(Array)
        })
      );
      
      // Verify email notification was sent
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Test Alert'),
          text: expect.stringContaining('Test notification message')
        })
      );
    });
    
    it('should handle Slack notification failure', async () => {
      // Mock failed Slack response
      mockedAxios.post.mockRejectedValueOnce(new Error('Slack API error'));
      
      // Mock successful email sending
      const mockSendMail = jest.fn().mockResolvedValueOnce({ messageId: 'test-message-id' });
      jest.spyOn(notificationHandler as any, 'sendEmail').mockImplementationOnce(mockSendMail);
      
      // Create notification event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'notification.alert',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'Test Alert',
        data: { message: 'Test notification message', severity: 'high' }
      };
      
      // Handle event (should not throw despite Slack error)
      await expect(notificationHandler.handle(event)).resolves.not.toThrow();
      
      // Verify Slack notification was attempted
      expect(mockedAxios.post).toHaveBeenCalledWith(
        config.slack.webhookUrl,
        expect.any(Object)
      );
      
      // Verify email notification was still sent
      expect(mockSendMail).toHaveBeenCalled();
    });
    
    it('should skip disabled notification channels', async () => {
      // Create notification handler with disabled channels
      notificationHandler = new NotificationHandler({
        slack: {
          enabled: false,
          webhookUrl: 'https://hooks.slack.com/services/test-webhook-url'
        },
        email: {
          enabled: false,
          recipients: ['user1@example.com'],
          smtpConfig: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
              user: 'test-user',
              pass: 'test-password'
            }
          }
        }
      });
      
      // Mock methods to verify they're not called
      mockedAxios.post.mockResolvedValueOnce({ status: 200 });
      const mockSendMail = jest.fn().mockResolvedValueOnce({ messageId: 'test-message-id' });
      jest.spyOn(notificationHandler as any, 'sendEmail').mockImplementationOnce(mockSendMail);
      
      // Create notification event
      const event: WebhookEvent = {
        id: 'test-event',
        type: 'notification.alert',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'Test Alert',
        data: { message: 'Test notification message', severity: 'high' }
      };
      
      // Handle event
      await notificationHandler.handle(event);
      
      // Verify no notifications were sent
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
