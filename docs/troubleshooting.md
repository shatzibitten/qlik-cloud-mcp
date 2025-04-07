# Troubleshooting Guide

This guide provides solutions for common issues you might encounter when using the Qlik Cloud MCP server.

## General Troubleshooting

### Server Won't Start

**Symptoms:**
- The server fails to start
- Error messages in the console or logs

**Possible Causes and Solutions:**

1. **Configuration Issues**
   - Check that your configuration file is valid JSON
   - Verify that all required configuration values are set
   - Ensure environment variables are correctly formatted

   ```bash
   # Validate your JSON configuration
   cat config.json | jq
   ```

2. **Port Already in Use**
   - Another application might be using the configured port
   - Change the port in your configuration or stop the other application

   ```bash
   # Check if the port is in use
   lsof -i :3000
   
   # Change the port in your configuration
   export MCP_SERVER_PORT=3001
   ```

3. **Missing Dependencies**
   - Ensure all dependencies are installed
   - Try reinstalling dependencies

   ```bash
   # Reinstall dependencies
   npm ci
   ```

4. **Insufficient Permissions**
   - Ensure the user running the server has sufficient permissions
   - Check file permissions for configuration files and logs directory

   ```bash
   # Check permissions
   ls -la config/
   ls -la logs/
   ```

### Authentication Failures

**Symptoms:**
- Unable to obtain authentication tokens
- "Authentication failed" errors

**Possible Causes and Solutions:**

1. **Invalid Credentials**
   - Verify your client ID and client secret
   - Check that your OAuth2 token URL is correct
   - Ensure your JWT signing key is correct

   ```bash
   # Test OAuth2 authentication directly
   curl -X POST https://your-tenant.us.qlikcloud.com/oauth/token \
     -d "grant_type=client_credentials&client_id=your-client-id&client_secret=your-client-secret"
   ```

2. **Missing Scopes**
   - Ensure your OAuth2 client has the necessary scopes
   - Check that your API key has the required permissions

3. **Token URL Incorrect**
   - Verify the token URL for your Qlik Cloud tenant
   - Ensure the URL includes the correct tenant name

4. **Network Issues**
   - Check that the MCP server can access the Qlik Cloud API
   - Verify network connectivity and firewall rules

### API Request Failures

**Symptoms:**
- API requests return errors
- "Resource not found" or "Authorization failed" errors

**Possible Causes and Solutions:**

1. **Authentication Issues**
   - Ensure you have a valid token
   - Check that you're using the correct authentication type
   - Verify that your token has the necessary permissions

2. **Incorrect API Base URL**
   - Verify the API base URL for your Qlik Cloud tenant
   - Ensure the URL includes the correct tenant name

3. **Resource Does Not Exist**
   - Check that the resource ID is correct
   - Verify that the resource exists in your Qlik Cloud tenant

4. **Rate Limiting**
   - You might be making too many requests
   - Implement backoff and retry logic in your application

5. **Network Issues**
   - Check that the MCP server can access the Qlik Cloud API
   - Verify network connectivity and firewall rules

### Webhook Event Processing Failures

**Symptoms:**
- Webhook events are not being processed
- "Invalid webhook signature" errors

**Possible Causes and Solutions:**

1. **Webhook Secret Mismatch**
   - Ensure the webhook secret in the MCP server configuration matches the secret in Qlik Cloud
   - Check that the webhook secret is correctly set in the environment variables or configuration file

2. **Webhook URL Inaccessible**
   - Verify that the webhook URL is accessible from Qlik Cloud
   - Check network connectivity and firewall rules
   - Ensure the MCP server is running and accessible

3. **Event Handler Issues**
   - Check that the appropriate event handlers are registered
   - Verify that the event handlers can handle the event types you're receiving

4. **Malformed Events**
   - Ensure the events from Qlik Cloud are correctly formatted
   - Check the webhook configuration in Qlik Cloud

## Specific Error Messages

### "Authentication failed: Invalid client"

**Cause:** The OAuth2 client ID or client secret is incorrect.

**Solution:**
- Verify your client ID and client secret
- Check that your OAuth2 client is active in Qlik Cloud
- Ensure you're using the correct token URL for your tenant

### "Resource not found: App not found"

**Cause:** The app ID is incorrect or the app does not exist.

**Solution:**
- Verify the app ID
- Check that the app exists in your Qlik Cloud tenant
- Ensure your token has access to the app

### "Authorization failed: Insufficient permissions"

**Cause:** Your token does not have the necessary permissions.

**Solution:**
- Check the scopes of your OAuth2 client or API key
- Ensure your token has the required permissions for the operation
- Verify that the user associated with the token has access to the resource

### "Invalid webhook signature"

**Cause:** The webhook signature validation failed.

**Solution:**
- Ensure the webhook secret in the MCP server configuration matches the secret in Qlik Cloud
- Check that the webhook secret is correctly set in the environment variables or configuration file
- Verify that the webhook events are coming from Qlik Cloud

### "Rate limit exceeded"

**Cause:** You're making too many requests to the Qlik Cloud API.

**Solution:**
- Implement backoff and retry logic in your application
- Reduce the frequency of requests
- Consider caching responses where appropriate

## Logging and Debugging

### Enabling Debug Logging

To enable debug logging:

```bash
# Using environment variables
export MCP_LOG_LEVEL=debug

# Or in your configuration file
{
  "log": {
    "level": "debug"
  }
}
```

### Viewing Logs

Logs are written to the console and to the logs directory:

```bash
# View the latest logs
tail -f logs/mcp.log

# Search for specific errors
grep "error" logs/mcp.log
```

### Debugging API Requests

To debug API requests:

```bash
# Enable debug logging
export MCP_LOG_LEVEL=debug

# Make a request with curl and observe the logs
curl -v http://localhost:3000/api/v1/users/me \
  -H "X-Auth-Type: oauth2"
```

### Debugging Webhook Events

To debug webhook events:

```bash
# Enable debug logging
export MCP_LOG_LEVEL=debug

# Send a test webhook event
curl -v http://localhost:3000/webhooks/qlik \
  -H "Content-Type: application/json" \
  -H "X-Qlik-Signature: your-signature" \
  -d '{
    "id": "test-event",
    "type": "test.event",
    "timestamp": "2025-04-07T17:00:00.000Z",
    "source": "test",
    "subject": "test",
    "data": {}
  }'
```

## Common Deployment Issues

### Docker Container Issues

**Symptoms:**
- Container fails to start
- Container starts but API requests fail

**Possible Causes and Solutions:**

1. **Environment Variables**
   - Ensure all required environment variables are set
   - Check that environment variables are correctly formatted

   ```bash
   # Check environment variables in the container
   docker exec -it <container-id> env | grep MCP_
   ```

2. **Volume Mounts**
   - Verify that volume mounts are correctly configured
   - Check file permissions for mounted volumes

   ```bash
   # Check volume mounts
   docker inspect <container-id> | jq '.[0].Mounts'
   ```

3. **Network Issues**
   - Ensure the container can access the Qlik Cloud API
   - Check network connectivity and firewall rules

   ```bash
   # Check network connectivity from the container
   docker exec -it <container-id> curl -v https://your-tenant.us.qlikcloud.com
   ```

### Kubernetes Deployment Issues

**Symptoms:**
- Pods fail to start
- Pods start but API requests fail

**Possible Causes and Solutions:**

1. **Configuration**
   - Ensure all required environment variables and secrets are set
   - Check that ConfigMaps and Secrets are correctly mounted

   ```bash
   # Check pod configuration
   kubectl describe pod <pod-name>
   ```

2. **Resource Constraints**
   - Verify that the pod has sufficient resources
   - Check resource requests and limits

   ```bash
   # Check pod resource usage
   kubectl top pod <pod-name>
   ```

3. **Network Policies**
   - Ensure network policies allow the pod to access the Qlik Cloud API
   - Check ingress and egress rules

   ```bash
   # Check network policies
   kubectl get networkpolicies
   ```

## Getting Help

If you're still experiencing issues after trying the solutions in this guide, you can:

1. Check the [GitHub repository](https://github.com/yourusername/qlik-cloud-mcp) for known issues
2. Open a new issue on GitHub with detailed information about your problem
3. Contact the maintainers for support

When reporting issues, please include:

- The version of the MCP server you're using
- Your configuration (with sensitive information redacted)
- Relevant logs and error messages
- Steps to reproduce the issue

## Next Steps

After resolving any issues, you can:

1. Continue using the MCP server for your integration needs
2. Explore advanced features and customization options
3. Contribute to the project by fixing bugs or adding features

For more information, see the following guides:

- [API Reference](./api-reference.md)
- [Webhook Events Guide](./webhook-events.md)
- [Development Guide](./development.md)
