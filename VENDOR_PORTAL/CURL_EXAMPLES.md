# cURL Examples for Kaar Customer Portal API

## Prerequisites

- Backend server running on `http://localhost:4000`
- Valid SAP credentials configured in `.env`

## Authentication

### Login

```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"CUSTOMER_ID\":\"CUST001\",\"PASSCODE\":\"password123\"}"
```

**Expected Response:**
```json
{
  "data": {
    "SUCCESS": "X",
    "MESSAGE": "Login successful"
  }
}
```

**Error Response (SOAP Fault):**
```json
{
  "error": "sap-fault",
  "fault": {
    "faultcode": "SOAP-ENV:Server",
    "faultstring": "Invalid credentials",
    "tid": "1234567890"
  },
  "tid": "1234567890"
}
```

## Customer Data Endpoints

### Get Profile

```bash
curl http://localhost:4000/api/profile/CUST001
```

### Get Inquiry

```bash
curl http://localhost:4000/api/inquiry/CUST001
```

### Get Sales Order

```bash
curl http://localhost:4000/api/salesorder/CUST001
```

### Get Deliveries

```bash
curl http://localhost:4000/api/deliveries/CUST001
```

### Get Invoices

```bash
curl http://localhost:4000/api/invoices/CUST001
```

### Get Payment Aging

```bash
curl http://localhost:4000/api/aging/CUST001
```

### Get Memos

```bash
curl http://localhost:4000/api/memos/CUST001
```

### Get Sales Summary

```bash
curl http://localhost:4000/api/sales-summary/CUST001
```

### Get Dashboard (Aggregated)

```bash
curl http://localhost:4000/api/dashboard/CUST001
```

## Health Check

```bash
curl http://localhost:4000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Windows PowerShell Examples

### Login (PowerShell)

```powershell
$body = @{
    CUSTOMER_ID = "CUST001"
    PASSCODE = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Get Profile (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/profile/CUST001" `
    -Method GET
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid input (e.g., Customer ID too long)
- `500 Internal Server Error`: Server error
- `502 Bad Gateway`: SAP SOAP Fault

For SOAP faults, the response includes:
- `error`: Always `"sap-fault"`
- `fault`: Object containing `faultcode`, `faultstring`, and optional `detail`
- `tid`: Transaction ID (if available) for SAP BASIS debugging

## Testing with Different Customer IDs

Replace `CUST001` with your actual customer ID in all examples above.

**Note:** Customer ID must be 10 characters or less.

