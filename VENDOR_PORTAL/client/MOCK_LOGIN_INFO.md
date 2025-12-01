# Mock Login Credentials

For frontend testing without SAP backend, use the following dummy credentials:

## Valid Login Credentials

**Option 1:**
- Customer ID: `CUST001`
- Password: `demo123`

**Option 2:**
- Customer ID: `DEMO001`
- Password: `demo123`

## How to Use

1. Start the Angular development server:
   ```bash
   cd client
   npm start
   ```

2. Navigate to `http://localhost:4200`

3. Use either of the credentials above to log in

4. You'll see mock data for:
   - Dashboard with KPIs and tables
   - Profile information
   - Financials (invoices, aging chart, memos)

## Mock Data Overview

- **Profile**: Acme Corporation with complete company details
- **Inquiries**: 3 sample inquiries
- **Sales Orders**: 3 orders with different statuses
- **Deliveries**: 3 delivery records
- **Invoices**: 3 invoices (Paid, Pending, Partial)
- **Payment Aging**: 4 aging buckets (0-30, 31-60, 61-90, 90+ days)
- **Memos**: 3 credit/debit memos

## Switching to Real Backend

To connect to the actual SAP backend:

1. Edit `client/src/environments/environment.ts`
2. Set `useMock: false`
3. Make sure the backend server is running on port 4000
4. Configure SAP credentials in `server/.env`

