#!/bin/bash
# Test environment setup script
# This script sets up the test environment for the Qlik Cloud MCP server

# Create test environment file
cat > .env.test << EOF
# Test Server Configuration
TEST_SERVER_HOST=localhost
TEST_SERVER_PORT=3000

# Test Authentication Configuration
# Fill these in with your test credentials
TEST_CLIENT_ID=
TEST_CLIENT_SECRET=
TEST_TOKEN_URL=

# Test API Configuration
# Fill this in with your test API base URL
TEST_API_BASE_URL=

# Test Webhook Configuration
TEST_WEBHOOK_SECRET=test-webhook-secret
EOF

echo "Test environment file created: .env.test"
echo "Please edit this file to add your test credentials"
echo "Then run the tests with: npm run test"
