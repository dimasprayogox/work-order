#!/bin/bash

# Test script for VPS debugging
# Run this on VPS to test work order update

WORK_ORDER_ID="78037720-1364-4984-b02d-9f0e32c600e8"
TOKEN="eyJhbGciOiJIUzUxMiJ9.eyJ1c2VySWQiOiJmMTdlM2JmZi0zNWFiLTRiN2EtOGVmMC0xZjkxODJmNDFhYWUiLCJyb2xlIjoidGVjaG5pY2lhbiIsImlhdCI6MTc1NTg2Mzg1MiwiZXhwIjoxNzU1OTUwMjUyfQ.wXjBs8fBeJF5euFApUeDrz9rf_qlPtSMNZ7dSHZqyUi4yt3N6pKh8vPxnOXgWP-bWMtUEgcHM8GmL3adHS9RkQ"

echo "=== Testing work order update on VPS ==="
echo "Work Order ID: $WORK_ORDER_ID"

# Test 1: Simple update
echo -e "\n1. Testing simple notes and repairable update:"
curl -X PATCH "http://208.76.40.194:3100/api/technician/work-orders/$WORK_ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completed_at": "2025-08-22T15:30:00Z",
    "notes": "VPS DEBUG TEST - Should appear in DB",
    "repairable": true
  }' | jq .

echo -e "\n2. Testing with false repairable:"
curl -X PATCH "http://208.76.40.194:3100/api/technician/work-orders/$WORK_ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed", 
    "completed_at": "2025-08-22T15:31:00Z",
    "notes": "VPS DEBUG TEST 2 - repairable false",
    "repairable": false
  }' | jq .

echo -e "\n3. Testing with integer 1 for repairable:"
curl -X PATCH "http://208.76.40.194:3100/api/technician/work-orders/$WORK_ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completed_at": "2025-08-22T15:32:00Z", 
    "notes": "VPS DEBUG TEST 3 - repairable as int 1",
    "repairable": 1
  }' | jq .

echo -e "\n=== Test completed ==="
