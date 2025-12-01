# Kaar Customer Portal

Full-stack Customer Portal application connecting Angular frontend with SAP backend via Express SOAP/RFC proxy.

## Project Structure

```
Kaar-Customer-Portal/
├── client/          # Angular 20 frontend
├── server/          # Node.js/Express backend
└── README.md        # This file
```

## Prerequisites

- **Node.js** 24.x
- **npm** (comes with Node.js)
- **Angular CLI** 20.3.9 (`npm install -g @angular/cli@20.3.9`)
- Access to SAP system at `172.17.19.24:8000`

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   copy env.example .env
   # On Linux/Mac: cp env.example .env
   ```

4. Configure `.env` file with your SAP credentials:
   ```env
   SAP_BASE_URL=http://172.17.19.24:8000
   SAP_CLIENT=100
   SAP_BASIC=<base64_encoded_username:password>
   PORT=4000
   CLIENT_ORIGIN=http://localhost:4200
   USE_CACHE=true
   CACHE_TTL_MS=300000
   SAP_SINGLE_ENDPOINT=false
   ```

   **Important:** To generate `SAP_BASIC`, encode your SAP username:password in Base64:
   ```bash
   # Windows PowerShell:
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("username:password"))
   
   # Linux/Mac:
   echo -n "username:password" | base64
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:4000`

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   ng serve --proxy-config proxy.conf.json
   ```

   The application will be available at `http://localhost:4200`

4. (Optional) Mock mode is **enabled by default** for frontend testing. To use real SAP backend:
   - Edit `src/environments/environment.ts`
   - Set `useMock: false`
   - Ensure backend server is running with SAP credentials configured
   
   **Mock Login Credentials:**
   - Customer ID: `CUST001` or `DEMO001`
   - Password: `demo123`
   
   See `MOCK_LOGIN_INFO.md` for details.

## API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/login` - Authenticate customer
- `GET /api/profile/:id` - Get customer profile
- `GET /api/inquiry/:id` - Get customer inquiries
- `GET /api/salesorder/:id` - Get sales orders
- `GET /api/deliveries/:id` - Get deliveries
- `GET /api/invoices/:id` - Get invoices
- `GET /api/aging/:id` - Get payment aging
- `GET /api/memos/:id` - Get credit/debit memos
- `GET /api/sales-summary/:id` - Get sales summary
- `GET /api/dashboard/:id` - Get aggregated dashboard data

## Testing API Endpoints

### Using cURL

**Login Example:**
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"CUSTOMER_ID\":\"CUST001\",\"PASSCODE\":\"password123\"}"
```

**Get Profile Example:**
```bash
curl http://localhost:4000/api/profile/CUST001
```

### Using Postman

Import the provided `postman_collection.json` file into Postman for pre-configured requests.

## SAP Connectivity Checklist

If you encounter SOAP faults or connection issues, verify the following with your SAP BASIS team:

- [ ] **Network Connectivity**: Can the server reach `172.17.19.24:8000`?
- [ ] **ICF Service Activation**: Are the RFC services activated in SAP (SMICM)?
- [ ] **User Permissions**: Does the SAP user have RFC authorization?
- [ ] **Client Configuration**: Is client 100 correct for your environment?
- [ ] **SOAPAction Format**: Verify the SOAPAction header format matches SAP expectations
- [ ] **WSDL Availability**: Can you access the WSDL for the function modules?
- [ ] **Transaction ID (TID)**: If SOAP fault includes TID, provide it to BASIS for debugging
- [ ] **Single vs Multiple Endpoints**: Confirm if SAP uses one ICF path for all RFCs or separate paths

### Common SOAP Fault Scenarios

1. **Authentication Error**: Check `SAP_BASIC` encoding and user credentials
2. **Function Module Not Found**: Verify function module names match SAP system
3. **Authorization Error**: User may lack RFC permissions
4. **Client Mismatch**: Verify `SAP_CLIENT` matches your SAP client number

## Development

### Backend Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon (auto-reload)

### Frontend Scripts

- `npm start` - Start development server with proxy
- `npm run build` - Build for production
- `npm test` - Run unit tests

## Project Features

- **Authentication**: Customer login with SAP validation
- **Dashboard**: Overview of inquiries, sales orders, deliveries, and sales summary
- **Profile**: Customer profile information
- **Financials**: Invoices, payment aging charts, credit/debit memos
- **Responsive Design**: Mobile-friendly UI with teal/blue color scheme
- **Mock Data Support**: Develop UI without SAP connection
- **Caching**: Optional in-memory caching for SAP responses

## Security Notes

- **Never commit** `.env` file or real SAP credentials
- Backend sanitizes XML input to prevent injection
- For production: Use secrets manager and run backend in trusted network
- CORS is configured for development; adjust for production

## Troubleshooting

### Server won't start
- Check if port 4000 is available
- Verify `.env` file exists and has required variables
- Check Node.js version: `node --version` (should be 24.x)

### Frontend can't connect to backend
- Ensure backend is running on port 4000
- Check `proxy.conf.json` configuration
- Verify `CLIENT_ORIGIN` in backend `.env` matches frontend URL

### SAP connection errors
- Verify SAP host is reachable: `ping 172.17.19.24`
- Check SAP credentials in `.env`
- Review server logs for detailed error messages
- Contact SAP BASIS team with transaction ID (TID) from error response

## License

ISC

