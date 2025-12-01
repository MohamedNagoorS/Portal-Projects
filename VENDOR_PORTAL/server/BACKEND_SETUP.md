# Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy the example file
   copy env.example .env
   # On Linux/Mac: cp env.example .env
   ```

3. **Edit `.env` file** with your SAP credentials:
   ```env
   SAP_BASE_URL=http://172.17.19.24:8000
   SAP_CLIENT=100
   SAP_BASIC=<your_base64_encoded_credentials>
   PORT=4000
   CLIENT_ORIGIN=http://localhost:4200
   USE_CACHE=true
   CACHE_TTL_MS=300000
   SAP_SINGLE_ENDPOINT=false
   ```

4. **Generate SAP_BASIC** (Base64 encoded username:password):
   
   **Windows PowerShell:**
   ```powershell
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("username:password"))
   ```
   
   **Linux/Mac:**
   ```bash
   echo -n "username:password" | base64
   ```

5. **Start the Server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/login` - Customer authentication
- `GET /api/profile/:id` - Get customer profile
- `GET /api/inquiry/:id` - Get customer inquiries
- `GET /api/salesorder/:id` - Get sales orders
- `GET /api/deliveries/:id` - Get deliveries
- `GET /api/invoices/:id` - Get invoices
- `GET /api/aging/:id` - Get payment aging
- `GET /api/memos/:id` - Get credit/debit memos
- `GET /api/sales-summary/:id` - Get sales summary
- `GET /api/dashboard/:id` - Get aggregated dashboard data
- `GET /api/health` - Health check

## Testing the Backend

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Test Login (with curl)
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"CUSTOMER_ID\":\"CUST001\",\"PASSCODE\":\"password123\"}"
```

### Test Profile
```bash
curl http://localhost:4000/api/profile/CUST001
```

## Troubleshooting

### Server won't start
- Check if port 4000 is available
- Verify `.env` file exists and has all required variables
- Check Node.js version: `node --version` (should be 24.x)

### SAP Connection Errors
- Verify SAP host is reachable: `ping 172.17.19.24` or `telnet 172.17.19.24 8000`
- Check SAP credentials in `.env`
- Review server console logs for detailed error messages
- See `SAP_CONNECTIVITY_CHECKLIST.md` in project root

### Common Issues

1. **"SAP_BASE_URL and SAP_BASIC must be configured"**
   - Make sure `.env` file exists in the `server/` directory
   - Verify `SAP_BASE_URL` and `SAP_BASIC` are set

2. **"SAP HTTP Error: 401"**
   - Check `SAP_BASIC` encoding
   - Verify username and password are correct

3. **"SAP HTTP Error: 404"**
   - Verify ICF service paths in SAP
   - Check `getSapEndpointPath()` function mapping
   - Consider using `SAP_SINGLE_ENDPOINT=true` if SAP uses one path

4. **SOAP Fault Errors**
   - Check server logs for fault details
   - Note the Transaction ID (TID) for SAP BASIS team
   - Verify function module names match SAP system

## Configuration Options

### Single vs Multiple Endpoints

If your SAP system uses a single ICF path for all RFCs:

```env
SAP_SINGLE_ENDPOINT=true
SAP_SINGLE_ENDPOINT_PATH=/sap/bc/srt/scs/sap/zrfc_login_auth_829?sap-client=100
```

The SOAPAction header will differentiate between function calls.

### Caching

Disable caching for development:
```env
USE_CACHE=false
```

Adjust cache TTL (in milliseconds):
```env
CACHE_TTL_MS=300000  # 5 minutes
```

## Logs

The server logs:
- `[SAP CALL]` - When making SAP requests
- `[CACHE HIT]` - When serving from cache
- `[SOAP FAULT]` - When SAP returns a fault
- `[SAP ERROR]` - HTTP or connection errors

Check console output for detailed debugging information.

