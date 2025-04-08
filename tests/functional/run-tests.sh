#!/bin/bash

# Test script for Qlik Cloud Model Context Protocol (MCP) server

# Set default values
SERVER_URL="http://localhost:3000"
TEST_DIR="./tests/functional"
OUTPUT_DIR="./test-results"
TOKEN=""

# Display banner
echo "=========================================="
echo "  Qlik Cloud Model Context Protocol (MCP)"
echo "  Functional Test Script"
echo "=========================================="
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if server is running
echo "Checking if MCP server is running..."
if ! curl -s "$SERVER_URL/health" > /dev/null; then
    echo "Error: MCP server is not running at $SERVER_URL"
    echo "Please start the server before running tests."
    exit 1
fi

# Get server health
echo "Getting server health..."
HEALTH_RESPONSE=$(curl -s "$SERVER_URL/health")
echo "Server health: $HEALTH_RESPONSE"
echo ""

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo "No authentication token provided."
    echo "Some tests may fail if authentication is required."
    echo ""
fi

# Function to run a test
run_test() {
    local test_name=$1
    local endpoint=$2
    local method=${3:-GET}
    local data=$4
    local expected_status=${5:-200}
    
    echo "Running test: $test_name"
    echo "  Endpoint: $endpoint"
    echo "  Method: $method"
    
    # Prepare curl command
    CURL_CMD="curl -s -X $method"
    
    # Add authentication if token is provided
    if [ ! -z "$TOKEN" ]; then
        CURL_CMD="$CURL_CMD -H \"Authorization: Bearer $TOKEN\""
    fi
    
    # Add content type for POST/PUT requests
    if [ "$method" == "POST" ] || [ "$method" == "PUT" ]; then
        CURL_CMD="$CURL_CMD -H \"Content-Type: application/json\""
    fi
    
    # Add data for POST/PUT requests
    if [ ! -z "$data" ]; then
        CURL_CMD="$CURL_CMD -d '$data'"
    fi
    
    # Add endpoint
    CURL_CMD="$CURL_CMD $SERVER_URL$endpoint"
    
    # Run the command and capture response
    RESPONSE=$(eval $CURL_CMD)
    STATUS=$?
    
    # Save response to file
    echo "$RESPONSE" > "$OUTPUT_DIR/${test_name}.json"
    
    # Check if command succeeded
    if [ $STATUS -ne 0 ]; then
        echo "  [FAIL] Command failed with status $STATUS"
        return 1
    fi
    
    # Check if response contains error
    if echo "$RESPONSE" | grep -q "\"error\""; then
        echo "  [FAIL] Response contains error"
        echo "  Response: $RESPONSE"
        return 1
    fi
    
    echo "  [PASS] Test passed"
    echo "  Response saved to $OUTPUT_DIR/${test_name}.json"
    return 0
}

# Run tests
echo "Starting tests..."
echo ""

# Test 1: Health check
run_test "health_check" "/health"

# Test 2: List contexts (may be empty)
run_test "list_contexts" "/api/v1/model/contexts"

# Test 3: Create context
if [ ! -z "$TOKEN" ]; then
    CONTEXT_DATA='{
        "name": "Test Context",
        "description": "Test context for functional testing",
        "appId": "test-app-id",
        "engineUrl": "wss://your-tenant.us.qlikcloud.com/app/test-app-id"
    }'
    run_test "create_context" "/api/v1/model/contexts" "POST" "$CONTEXT_DATA"
    
    # Extract context ID from response
    CONTEXT_ID=$(cat "$OUTPUT_DIR/create_context.json" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ ! -z "$CONTEXT_ID" ]; then
        echo "Created context with ID: $CONTEXT_ID"
        
        # Test 4: Get context
        run_test "get_context" "/api/v1/model/contexts/$CONTEXT_ID"
        
        # Test 5: Connect to engine
        run_test "connect_context" "/api/v1/model/contexts/$CONTEXT_ID/connect" "POST"
        
        # Test 6: Save state
        STATE_DATA='{
            "name": "Test State",
            "description": "Test state for functional testing"
        }'
        run_test "save_state" "/api/v1/model/contexts/$CONTEXT_ID/state" "POST" "$STATE_DATA"
        
        # Extract state ID from response
        STATE_ID=$(cat "$OUTPUT_DIR/save_state.json" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        
        if [ ! -z "$STATE_ID" ]; then
            echo "Created state with ID: $STATE_ID"
            
            # Test 7: List states
            run_test "list_states" "/api/v1/model/contexts/$CONTEXT_ID/state"
            
            # Test 8: Get state
            run_test "get_state" "/api/v1/model/contexts/$CONTEXT_ID/state/$STATE_ID"
            
            # Test 9: Restore state
            run_test "restore_state" "/api/v1/model/contexts/$CONTEXT_ID/state/$STATE_ID" "PUT"
            
            # Test 10: Delete state
            run_test "delete_state" "/api/v1/model/contexts/$CONTEXT_ID/state/$STATE_ID" "DELETE"
        fi
        
        # Test 11: Create object
        OBJECT_DATA='{
            "objectType": "GenericObject",
            "properties": {
                "qInfo": {
                    "qType": "test-object"
                },
                "testProperty": "test-value"
            }
        }'
        run_test "create_object" "/api/v1/model/contexts/$CONTEXT_ID/objects" "POST" "$OBJECT_DATA"
        
        # Extract object handle from response
        OBJECT_HANDLE=$(cat "$OUTPUT_DIR/create_object.json" | grep -o '"handle":"[^"]*' | cut -d'"' -f4)
        
        if [ ! -z "$OBJECT_HANDLE" ]; then
            echo "Created object with handle: $OBJECT_HANDLE"
            
            # Test 12: List objects
            run_test "list_objects" "/api/v1/model/contexts/$CONTEXT_ID/objects"
            
            # Test 13: Get object
            run_test "get_object" "/api/v1/model/contexts/$CONTEXT_ID/objects/$OBJECT_HANDLE"
            
            # Test 14: Execute method
            METHOD_DATA='{
                "method": "getProperties",
                "params": []
            }'
            run_test "execute_method" "/api/v1/model/contexts/$CONTEXT_ID/objects/$OBJECT_HANDLE/method" "POST" "$METHOD_DATA"
            
            # Test 15: Delete object
            run_test "delete_object" "/api/v1/model/contexts/$CONTEXT_ID/objects/$OBJECT_HANDLE" "DELETE"
        fi
        
        # Test 16: Disconnect from engine
        run_test "disconnect_context" "/api/v1/model/contexts/$CONTEXT_ID/disconnect" "POST"
        
        # Test 17: Delete context
        run_test "delete_context" "/api/v1/model/contexts/$CONTEXT_ID" "DELETE"
    fi
else
    echo "Skipping context creation tests because no token is provided."
fi

# Count passed and failed tests
PASSED=$(grep -c "\[PASS\]" "$OUTPUT_DIR/test_summary.txt" 2>/dev/null || echo 0)
FAILED=$(grep -c "\[FAIL\]" "$OUTPUT_DIR/test_summary.txt" 2>/dev/null || echo 0)
TOTAL=$((PASSED + FAILED))

# Print summary
echo ""
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo "Total tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "Some tests failed. Check $OUTPUT_DIR for details."
    exit 1
fi
