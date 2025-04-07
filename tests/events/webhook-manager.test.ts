import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebhookManager } from '../../src/events/webhook-manager';
import { WebhookHandler } from '../../src/events/types';
import crypto from 'crypto';

describe('WebhookManager', () => {
  let webhookManager: WebhookManager;
  let mockHandler1: jest.Mocked<WebhookHandler>;
  let mockHandler2: jest.Mocked<WebhookHandler>;
  
  const config = {
    secret: 'test-webhook-secret',
    signatureHeader: 'X-Qlik-Signature'
  };

  beforeEach(() => {
    // Create mock handlers
    mockHandler1 = {
      canHandle: jest.fn(),
      handle: jest.fn()
    };
    
    mockHandler2 = {
      canHandle: jest.fn(),
      handle: jest.fn()
    };
    
    // Create webhook manager
    webhookManager = new WebhookManager({
      ...config,
      handlers: [mockHandler1, mockHandler2]
    });
  });

  describe('validateSignature', () => {
    it('should return true for a valid signature', () => {
      // Create event payload
      const payload = JSON.stringify({ id: 'test-event', type: 'test.event' });
      
      // Calculate expected signature
      const hmac = crypto.createHmac('sha256', config.secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');
      
      // Validate signature
      const result = webhookManager.validateSignature(payload, signature);
      
      // Verify result
      expect(result).toBe(true);
    });
    
    it('should return false for an invalid signature', () => {
      // Create event payload
      const payload = JSON.stringify({ id: 'test-event', type: 'test.event' });
      
      // Invalid signature
      const signature = 'invalid-signature';
      
      // Validate signature
      const result = webhookManager.validateSignature(payload, signature);
      
      // Verify result
      expect(result).toBe(false);
    });
  });

  describe('processEvent', () => {
    it('should process an event with the appropriate handler', async () => {
      // Create event
      const event = {
        id: 'test-event',
        type: 'test.event',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'test',
        data: { key: 'value' }
      };
      
      // Setup mock handlers
      mockHandler1.canHandle.mockReturnValueOnce(false);
      mockHandler2.canHandle.mockReturnValueOnce(true);
      mockHandler2.handle.mockResolvedValueOnce();
      
      // Process event
      await webhookManager.processEvent(event);
      
      // Verify handlers were checked
      expect(mockHandler1.canHandle).toHaveBeenCalledWith(event);
      expect(mockHandler2.canHandle).toHaveBeenCalledWith(event);
      
      // Verify correct handler was used
      expect(mockHandler1.handle).not.toHaveBeenCalled();
      expect(mockHandler2.handle).toHaveBeenCalledWith(event);
    });
    
    it('should throw an error if no handler can process the event', async () => {
      // Create event
      const event = {
        id: 'test-event',
        type: 'unknown.event',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'test',
        data: { key: 'value' }
      };
      
      // Setup mock handlers
      mockHandler1.canHandle.mockReturnValueOnce(false);
      mockHandler2.canHandle.mockReturnValueOnce(false);
      
      // Process event and expect it to throw
      await expect(webhookManager.processEvent(event))
        .rejects.toThrow('No handler found for event type: unknown.event');
      
      // Verify handlers were checked
      expect(mockHandler1.canHandle).toHaveBeenCalledWith(event);
      expect(mockHandler2.canHandle).toHaveBeenCalledWith(event);
      
      // Verify no handler was used
      expect(mockHandler1.handle).not.toHaveBeenCalled();
      expect(mockHandler2.handle).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should validate signature and process event', async () => {
      // Create event payload
      const event = {
        id: 'test-event',
        type: 'test.event',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'test',
        data: { key: 'value' }
      };
      const payload = JSON.stringify(event);
      
      // Calculate signature
      const hmac = crypto.createHmac('sha256', config.secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');
      
      // Setup mock handlers
      mockHandler1.canHandle.mockReturnValueOnce(true);
      mockHandler1.handle.mockResolvedValueOnce();
      
      // Handle webhook
      await webhookManager.handleWebhook(payload, signature);
      
      // Verify handler was used
      expect(mockHandler1.canHandle).toHaveBeenCalledWith(event);
      expect(mockHandler1.handle).toHaveBeenCalledWith(event);
    });
    
    it('should throw an error for invalid signature', async () => {
      // Create event payload
      const event = {
        id: 'test-event',
        type: 'test.event',
        timestamp: new Date().toISOString(),
        source: 'test',
        subject: 'test',
        data: { key: 'value' }
      };
      const payload = JSON.stringify(event);
      
      // Invalid signature
      const signature = 'invalid-signature';
      
      // Handle webhook and expect it to throw
      await expect(webhookManager.handleWebhook(payload, signature))
        .rejects.toThrow('Invalid webhook signature');
      
      // Verify no handler was used
      expect(mockHandler1.canHandle).not.toHaveBeenCalled();
      expect(mockHandler1.handle).not.toHaveBeenCalled();
      expect(mockHandler2.canHandle).not.toHaveBeenCalled();
      expect(mockHandler2.handle).not.toHaveBeenCalled();
    });
  });
});
