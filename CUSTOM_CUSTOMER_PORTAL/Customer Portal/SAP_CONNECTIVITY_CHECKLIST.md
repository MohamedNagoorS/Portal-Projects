# SAP Connectivity Testing Checklist

Use this checklist when troubleshooting SAP connectivity issues.

## Pre-Connection Checks

- [ ] **Network Reachability**
  - Can ping `172.17.19.24`?
  - Can telnet to port `8000`? (`telnet 172.17.19.24 8000`)
  - Is firewall blocking the connection?

- [ ] **SAP System Status**
  - Is SAP system running?
  - Is the ICF (Internet Communication Framework) service active?
  - Check in SAP: Transaction `SMICM` → Goto → Services

## Configuration Verification

- [ ] **Environment Variables**
  - `SAP_BASE_URL` is correct: `http://172.17.19.24:8000`
  - `SAP_CLIENT` matches your SAP client number (default: `100`)
  - `SAP_BASIC` is correctly Base64 encoded
  - Verify encoding: `echo -n "username:password" | base64`

- [ ] **ICF Service Configuration**
  - Verify ICF path pattern matches your setup
  - Single endpoint mode: Check `SAP_SINGLE_ENDPOINT` and `SAP_SINGLE_ENDPOINT_PATH`
  - Multiple endpoints: Verify function name mapping in `server.js` → `getSapEndpointPath()`

## Function Module Verification

- [ ] **RFC Function Modules Exist**
  - Verify these exist in SAP (Transaction `SE37`):
    - `ZFM_LOGIN_829` / `ZRFC_LOGIN_AUTH_829`
    - `ZFM_PROFILE_829` / `ZRFC_CUST_PROFILE_829`
    - `ZFM_INQUIRY_829` / `ZRFC_INQUIRY_829`
    - `ZFM_SALESORDER_829` / `ZRFC_SALESORDER_829`
    - `ZFM_LISTDELIVERIES_829` / `ZRFC_LISTDELIVERIES_829`
    - `ZFM_INVOICE_829` / `ZRFC_INVOICE_829`
    - `ZFM_PAYMENT_AGING_829` / `ZRFC_PAYMENTS_AGING_829`
    - `ZFM_MEMO_829` / `ZRFC_MEMO_829`
    - `ZFM_SALES_SUMMARY_829` / `ZFRC_SALES_SUMMARY_829`

- [ ] **RFC Authorization**
  - Does the SAP user have RFC authorization?
  - Check in SAP: Transaction `SU01` → User → Authorization Data
  - Required authorization object: `S_RFC`

## SOAP Configuration

- [ ] **SOAPAction Header**
  - Format: `urn:sap-com:document:sap:rfc:functions:<FUNCTION_NAME>`
  - Example: `urn:sap-com:document:sap:rfc:functions:ZFM_LOGIN_829`
  - Verify this matches SAP WSDL expectations

- [ ] **SOAP Envelope Structure**
  - Root element: `<tns:ZFM_<...>>`
  - Namespace: `urn:sap-com:document:sap:rfc:functions`
  - SOAP version: 1.1

- [ ] **WSDL Access**
  - Can you access WSDL? Try: `http://172.17.19.24:8000/sap/bc/srt/scs/sap/zrfc_login_auth_829?wsdl&sap-client=100`
  - Compare WSDL structure with your SOAP envelope

## Error Analysis

### If you receive a SOAP Fault:

1. **Extract Transaction ID (TID)**
   - Look in error response: `{ "error": "sap-fault", "fault": {...}, "tid": "..." }`
   - Provide TID to SAP BASIS team for debugging

2. **Check Fault Details**
   - `faultcode`: SAP error code
   - `faultstring`: Human-readable error message
   - `detail`: Additional error information

3. **Common Fault Codes:**
   - `SOAP-ENV:Client`: Client-side error (check request format)
   - `SOAP-ENV:Server`: Server-side error (SAP system issue)
   - `RFC_ERROR`: RFC-specific error (authorization, function not found)

### Questions to Ask SAP BASIS Team:

1. **If you see authentication errors:**
   - Is the user account active?
   - Does the user have RFC authorization?
   - Is the password correct?

2. **If you see "Function Module Not Found":**
   - Are the function modules deployed in client 100?
   - Are the function module names correct?
   - Is the ICF service configured for these RFCs?

3. **If you see "Authorization Error":**
   - What RFC authorizations does the user need?
   - Are there any additional authorization objects required?

4. **If you see connection timeouts:**
   - Is the SAP system under heavy load?
   - Are there network issues between server and SAP?
   - Is the ICF service responding?

5. **If you see SOAP Fault with TID:**
   - "Can you check transaction ID [TID] in SM21 (System Log) or ST22 (ABAP Dump Analysis)?"
   - "What does the error mean in the context of RFC [FUNCTION_NAME]?"

## Testing Steps

1. **Test Basic Connectivity:**
   ```bash
   curl -v http://172.17.19.24:8000/sap/bc/srt/scs/sap/zrfc_login_auth_829?wsdl&sap-client=100
   ```

2. **Test Login Endpoint:**
   ```bash
   curl -X POST http://localhost:4000/api/login \
     -H "Content-Type: application/json" \
     -d '{"CUSTOMER_ID":"TEST","PASSCODE":"test"}'
   ```

3. **Check Server Logs:**
   - Look for `[SAP CALL]` entries
   - Check for `[SOAP FAULT]` entries
   - Verify raw XML in error logs (credentials redacted)

4. **Enable Detailed Logging:**
   - Server logs include request/response details
   - Check console output for SOAP envelope structure
   - Verify SOAPAction header format

## Additional Resources

- SAP Transaction `SM59`: RFC Destinations
- SAP Transaction `SMICM`: ICF Services
- SAP Transaction `SE37`: Function Builder (test RFCs)
- SAP Transaction `SM21`: System Log (check for errors)
- SAP Transaction `ST22`: ABAP Dump Analysis

## Contact Information

When reporting issues to SAP BASIS, include:
- Transaction ID (TID) from error response
- Function module name
- Error message and fault code
- Timestamp of the error
- Customer ID used (if applicable)

