/**
 * Kaar Customer Portal - Express Backend 
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: false });

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:4200';

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// In-memory cache
const cache = new Map();
const USE_CACHE = process.env.USE_CACHE === 'true';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '300000', 10);

/**
 * Escape XML special characters
 */
function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build SOAP 1.1 envelope for SAP RFC call
 */
function buildSoapEnvelope(functionName, bodyFields) {
  const fieldsXml = Object.entries(bodyFields)
    .map(([key, value]) => {
      const escapedValue = escapeXml(value);
      return `        <${key}>${escapedValue}</${key}>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:sap-com:document:sap:rfc:functions">
  <soapenv:Header/>
  <soapenv:Body>
    <tns:${functionName}>
${fieldsXml}
    </tns:${functionName}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Derive SAP endpoint path for a function
 */
function getSapEndpointPath(functionName) {
  const functionMap = {
    'ZFM_LOGIN_829': 'zrfc_login_authentication_829',
    'ZFM_PROFILE_829': 'zrfc_cust_profile_829',
    'ZFM_INQUIRY_829': 'zrfc_inquiry_829',
    'ZFM_SALESORDER_829': 'zrfc_salesorder_829',
    'ZFM_LISTDELIVERIES_829': 'zrfc_listdeliveries_829',
    'ZFM_INVOICE_829': 'zrfc_invoice_829',
    'ZFM_PAYMENT_AGING_829': 'zrfc_payments_aging_829',
    'ZFM_MEMO_829': 'zrfc_memo_829',
    'ZFM_SALES_SUMMARY_829': 'zfrc_sales_summary_829',
    'ZFM_GET_INVOICE_PDF_829': 'zrfc_invoice_pdf_829'
  };

  const rfcName = functionMap[functionName] || functionName.toLowerCase().replace(/zfm_/g, 'zrfc_');
  const sapClient = process.env.SAP_CLIENT || '100';

  if (process.env.SAP_SINGLE_ENDPOINT === 'true' && process.env.SAP_SINGLE_ENDPOINT_PATH) {
    return process.env.SAP_SINGLE_ENDPOINT_PATH;
  }

  return `/sap/bc/srt/scs/sap/${rfcName}?sap-client=${sapClient}`;
}

/**
 * Normalize SAP XML response to friendly JSON
 */
function normalizeSapResponse(parsedXml) {
  const envelope = parsedXml['soap:Envelope'] ||
    parsedXml['soapenv:Envelope'] ||
    parsedXml['soap-env:Envelope'];

  if (!parsedXml || !envelope) return null;

  const body = envelope['soap:Body'] ||
    envelope['soapenv:Body'] ||
    envelope['soap-env:Body'];

  if (!body || !body[0]) return null;

  const responseKeys = Object.keys(body[0]);
  if (responseKeys.length === 0) return null;

  const responseName = responseKeys[0];
  const responseData = body[0][responseName];
  const data = Array.isArray(responseData) ? (responseData[0] || {}) : (responseData || {});
  const normalized = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === '$') continue;

    if (Array.isArray(value) && value.length > 0) {
      if (typeof value[0] === 'object' && value[0] !== null) {
        normalized[key] = value;
      } else {
        if (value.length === 1 && value[0] === '') {
          normalized[key] = [];
        } else {
          normalized[key] = value.length === 1 ? value[0] : value;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      normalized[key] = [value];
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

/**
 * Call SAP RFC function via SOAP (Simplified: No Error Handling)
 */
async function callSap(functionName, bodyFields = {}) {
  const sapBaseUrl = process.env.SAP_BASE_URL;
  const sapBasic = process.env.SAP_BASIC;

  const cacheKey = `${functionName}:${JSON.stringify(bodyFields)}`;
  if (USE_CACHE && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[CACHE HIT] ${functionName}`);
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  const endpointPath = getSapEndpointPath(functionName);
  const url = `${sapBaseUrl}${endpointPath}`;
  const soapAction = `urn:sap-com:document:sap:rfc:functions:${functionName}`;
  const soapEnvelope = buildSoapEnvelope(functionName, bodyFields);
  console.log(`[SAP REQUEST] ${functionName} - Envelope:`, soapEnvelope.substring(0, 1000));
  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': `"${soapAction}"`,
    'Authorization': `Basic ${sapBasic}`
  };

  console.log(`[SAP CALL] ${functionName} -> ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: soapEnvelope
  });

  const responseText = await response.text();
  const parsed = await parser.parseStringPromise(responseText);
  const normalized = normalizeSapResponse(parsed);

  console.log(`[SAP RESPONSE] ${functionName} - Normalized:`, JSON.stringify(normalized, null, 2).substring(0, 1000));

  if (USE_CACHE && normalized) {
    cache.set(cacheKey, { data: normalized, timestamp: Date.now() });
  }

  return normalized || parsed;
}

// --- API Routes (Simplified: No Error Handling) ---

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { CUSTOMER_ID, PASSCODE } = req.body;
  const result = await callSap('ZFM_LOGIN_829', { CUSTOMER_ID, PASSCODE });

  // *** THIS IS THE NEW AUTHENTICATION CHECK ***
  if (result && result.STATUS === 'Login Sucess') {
    // If login is successful, send back the success status
    res.json({ data: result });
  } else {
    // If login fails (wrong password, etc.), send a 401 Unauthorized error
    res.status(401).json({ error: 'Invalid Customer ID or Passcode' });
  }
});

// GET /api/profile/:id
app.get('/api/profile/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_PROFILE_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/inquiry/:id
app.get('/api/inquiry/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_INQUIRY_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/salesorder/:id
app.get('/api/salesorder/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_SALESORDER_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/deliveries/:id
app.get('/api/deliveries/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_LISTDELIVERIES_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/invoices/:id
app.get('/api/invoices/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_INVOICE_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/aging/:id
app.get('/api/aging/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_PAYMENT_AGING_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/memos/:id
app.get('/api/memos/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_MEMO_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/sales-summary/:id
app.get('/api/sales-summary/:id', async (req, res) => {
  const customerId = req.params.id;
  const result = await callSap('ZFM_SALES_SUMMARY_829', { IV_CUSTOMER_ID: customerId });
  res.json({ data: result });
});

// GET /api/dashboard/:id - Aggregates multiple endpoints
app.get('/api/dashboard/:id', async (req, res) => {
  const customerId = req.params.id;

  const [inquiry, salesorder, deliveries, salesSummary] = await Promise.all([
    callSap('ZFM_INQUIRY_829', { IV_CUSTOMER_ID: customerId }),
    callSap('ZFM_SALESORDER_829', { IV_CUSTOMER_ID: customerId }),
    callSap('ZFM_LISTDELIVERIES_829', { IV_CUSTOMER_ID: customerId }),
    callSap('ZFM_SALES_SUMMARY_829', { IV_CUSTOMER_ID: customerId })
  ]);

  const result = {
    inquiry: inquiry,
    salesorder: salesorder,
    deliveries: deliveries,
    salesSummary: salesSummary
  };

  res.json({ data: result });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/invoice-pdf/:id', async (req, res) => {
  let invoiceId = req.params.id;

  // *** FIX: Pad with leading zeros to ensure 10 digits ***
  invoiceId = invoiceId.padStart(10, '0');

  console.log(`[PDF REQUEST] Invoice ID padded: ${invoiceId}`); // Debug log

  // Call the SAP function
  const result = await callSap('ZFM_GET_INVOICE_PDF_829', { IV_VBELN: invoiceId });

  // Check if we got a valid result
  // Note: Your Postman output shows the key is 'E_PDF', not 'EV_PDF_BASE64'
  // We should check for both just in case.
  const pdfData = result.E_PDF || result.EV_PDF_BASE64;

  if (pdfData) {
    res.json({
      data: {
        base64: pdfData,
        filename: `Invoice_${invoiceId}.pdf`
      }
    });
  } else {
    console.error('[PDF ERROR] SAP returned no PDF data:', result);
    res.status(404).json({ error: 'PDF not found' });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kaar Customer Portal Server running on port ${PORT}`);
  console.log(`📡 SAP Base URL: ${process.env.SAP_BASE_URL || 'NOT CONFIGURED'}`);
  console.log(`🌐 CORS enabled for: ${CLIENT_ORIGIN}`);
  console.log(`💾 Cache: ${USE_CACHE ? 'ENABLED' : 'DISABLED'}`);
});