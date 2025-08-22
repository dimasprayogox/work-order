#!/bin/bash

# Simple VPS test without jq
WORK_ORDER_ID="78037720-1364-4984-b02d-9f0e32c600e8"
TOKEN="eyJhbGciOiJIUzUxMiJ9.eyJ1c2VySWQiOiJmMTdlM2JmZi0zNWFiLTRiN2EtOGVmMC0xZjkxODJmNDFhYWUiLCJyb2xlIjoidGVjaG5pY2lhbiIsImlhdCI6MTc1NTg2Mzg1MiwiZXhwIjoxNzU1OTUwMjUyfQ.wXjBs8fBeJF5euFApUeDrz9rf_qlPtSMNZ7dSHZqyUi4yt3N6pKh8vPxnOXgWP-bWMtUEgcHM8GmL3adHS9RkQ"

echo "=== Testing work order update on VPS (without jq) ==="
echo "Work Order ID: $WORK_ORDER_ID"

echo -e "\n1. Testing simple notes and repairable update:"
curl -X PATCH "http://208.76.40.194:3100/api/technician/work-orders/$WORK_ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completed_at": "2025-08-22T16:00:00Z",
    "notes": "VPS TEST 1 - Should save in DB",
    "repairable": true
  }'

echo -e "\n\n2. Check database directly:"
mysql -u root -p workorder_db -e "SELECT id, notes, repairable, status, updated_at FROM work_orders WHERE id = '$WORK_ORDER_ID';"

echo -e "\n3. Test if debug code is deployed (look for debug field):"
curl -s -X PATCH "http://208.76.40.194:3100/api/technician/work-orders/$WORK_ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completed_at": "2025-08-22T16:01:00Z",
    "notes": "DEBUG TEST - Looking for debug output",
    "repairable": false
  }' | grep -o '"debug":[^}]*}' || echo "No debug field found - code not deployed yet"

echo -e "\n=== Test completed ==="
