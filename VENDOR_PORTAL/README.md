# Kaar Vendor Portal

This project is a Vendor Portal application built with Angular (Client) and Node.js/Express (Server). It interacts with SAP backend via RFC calls.

## Project Structure

- `client/`: Angular frontend application.
- `server/`: Node.js Express backend acting as a middleware between Client and SAP.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- SAP Backend connectivity (VPN or local network)

### Installation

1. **Server**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in `server/` based on `env.example` and configure your SAP credentials.

2. **Client**
   ```bash
   cd client
   npm install
   ```

## Running the Application

1. **Start the Server**
   ```bash
   cd server
   node server.js
   ```
   Server runs on `http://localhost:4000`.

2. **Start the Client**
   ```bash
   cd client
   ng serve
   ```
   Client runs on `http://localhost:4200`.

## Features
- **Login**: Vendor authentication using `VENDOR_ID` and `PASSCODE`.
- **Dashboard**: Overview of Quotations, Purchase Orders, Goods Receipts, and Invoices.
- **Profile**: View Vendor profile details.
- **Financials**: View Invoices, Payments/Aging, and Credit/Debit Memos.

## SAP Integration
The application uses the following SAP Function Modules (FMs) and RFCs:
- **Login**: `ZFM_VENDOR_LOGIN_829` (RFC: `ZRFC_VENDOR_LOGIN_829`)
- **Profile**: `ZFM_VENDOR_PROFILE_829` (RFC: `ZRFC_VENDOR_PROFILE_829`)
- **Quotation**: `ZFM_VENDOR_QUOTATION_829` (RFC: `ZFRC_VENDOR_QUOTATION_829`)
- **Purchase Order**: `ZFM_VENDOR_PURCHASE_ORDER_829` (RFC: `ZRFC_VENDOR_PURCHASE_ORDER_829`)
- **Goods Receipt**: `ZFM_VENDOR_GOODS_RECEIPT_829` (RFC: `ZRFC_VENDOR_GOODS_RECEIPTS_829`)
- **Invoice**: `ZFM_VENDOR_INVOICE_829` (RFC: `ZRFC_VENDOR_INVOICE_829`)
- **Payment**: `ZFM_VENDOR_PAYAGE_829` (RFC: `ZRFC_VENDOR_PAYAGE_829`)
- **Memo**: `ZFM_VENDOR_MEMO_829` (RFC: `ZRFC_VENDOR_MEMO_829`)
