/**
 * Kaar Vendor Portal - Express Backend 
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
    'ZFM_VENDOR_LOGIN_829': 'zrfc_vendor_login_829',
    'ZFM_VENDOR_PROFILE_829': 'ZRFC_VENDR_PROFILE_829',
    'ZFM_VENDOR_QUOTATION_829': 'zfrc_vendor_quotation_829', // Note: User provided ZFRC, keeping as is or assuming typo? User said ZFRC.
    'ZFM_VENDOR_PURCHASE_ORDER_829': 'zrfc_vendor_purchase_order_829',
    'ZFM_VENDOR_GOODS_RECEIPT_829': 'zrfc_vendor_goods_receipts_829', // User said RECEIPTS plural in RFC
    'ZFM_VENDOR_INVOICE_829': 'zrfc_vendor_invoice_829',
    'ZFM_VENDOR_PAYAGE_829': 'zrfc_vendor_payage_829',
    'ZFM_VENDOR_MEMO_829': 'zrfc_vendor_memo_829',
    'ZFM_VENDOR_INVOICE__PDF_829': 'zrfc_vendor_invoice_pdf_829'
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

// --- API Routes (Vendor Portal) ---

// POST /api/login
app.post('/api/login', async (req, res) => {
  // Vendor Login uses VENDOR_ID and PASSCODE
  const { VENDOR_ID, PASSCODE } = req.body;
  const result = await callSap('ZFM_VENDOR_LOGIN_829', { VENDOR_ID, PASSCODE });

  // Check login status
  if (result && result.STATUS === 'Login Success') {
    res.json({ data: result });
  } else {
    res.status(401).json({ error: 'Invalid Vendor ID or Passcode' });
  }
});

// GET /api/profile/:id
app.get('/api/profile/:id', async (req, res) => {
  const vendorId = req.params.id;
  const result = await callSap('ZFM_VENDOR_PROFILE_829', { IV_VENDOR_ID: vendorId });
  res.json({ data: result });
});

// GET /api/quotations/:id (Mapped from Inquiry)
app.get('/api/quotations/:id', async (req, res) => {
  const vendorId = req.params.id;
  const result = await callSap('ZFM_VENDOR_QUOTATION_829', { IV_VENDOR_ID: vendorId });
  res.json({ data: result });
});

// GET /api/purchase-orders/:id (Mapped from Sales Order)
app.get('/api/purchase-orders/:id', async (req, res) => {
  const vendorId = req.params.id;
  const result = await callSap('ZFM_VENDOR_PURCHASE_ORDER_829', { IV_VENDOR_ID: vendorId });
  res.json({ data: result });
});

// GET /api/goods-receipts/:id (Mapped from Deliveries)
app.get('/api/goods-receipts/:id', async (req, res) => {
  const vendorId = req.params.id;
  const result = await callSap('ZFM_VENDOR_GOODS_RECEIPT_829', { IV_VENDOR_ID: vendorId });
  res.json({ data: result });
});

// GET /api/invoices/:id
app.get('/api/invoices/:id', async (req, res) => {
  const vendorId = req.params.id;
  const result = await callSap('ZFM_VENDOR_INVOICE_829', { IV_VENDOR_ID: vendorId });
  res.json({ data: result });
});

// GET /api/invoice/:vendorId/:invoiceId/pdf - return invoice PDF (base64)
app.get('/api/invoice/:vendorId/:invoiceId/pdf', async (req, res) => {
  const vendorId = req.params.vendorId;
  const invoiceId = req.params.invoiceId;

  try {
    // Use IV_DOC_NUM because SAP RFC expects document number in this field
    const result = await callSap('ZFM_VENDOR_INVOICE__PDF_829', { IV_VENDOR_ID: vendorId, IV_DOC_NUM: invoiceId });

    // Try common keys where PDF may be returned (support multiple possible tag names)
    const base64 = (result && (result.EV_PDF_BASE64 || result.EV_PDF || result.E_PDF || result.BASE64)) || null;

    if (base64) {
      res.json({ data: { base64 } });
    } else {
      // If SAP returned binary directly, forward as octet-stream - but here we normalize to base64
      res.status(404).json({ error: 'PDF not found in SAP response', data: result });
    }
  } catch (err) {
    console.error('Error fetching invoice PDF', err);
    res.status(500).json({ error: 'Failed to fetch invoice PDF' });
  }
});

// GET /api/payments/:id (Mapped from Aging)
app.get('/api/payments/:id', async (req, res) => {
  const vendorId = req.params.id;
  const result = await callSap('ZFM_VENDOR_PAYAGE_829', { IV_VENDOR_ID: vendorId });
  res.json({ data: result });
});

// GET /api/memos/:id
app.get('/api/memos/:id', async (req, res) => {
  const vendorId = req.params.id;
  const result = await callSap('ZFM_VENDOR_MEMO_829', { IV_VENDOR_ID: vendorId });
  res.json({ data: result });
});

// GET /api/dashboard/:id - Aggregates multiple endpoints
app.get('/api/dashboard/:id', async (req, res) => {
  const vendorId = req.params.id;

  const [quotations, purchaseOrders, goodsReceipts, invoices] = await Promise.all([
    callSap('ZFM_VENDOR_QUOTATION_829', { IV_VENDOR_ID: vendorId }),
    callSap('ZFM_VENDOR_PURCHASE_ORDER_829', { IV_VENDOR_ID: vendorId }),
    callSap('ZFM_VENDOR_GOODS_RECEIPT_829', { IV_VENDOR_ID: vendorId }),
    callSap('ZFM_VENDOR_INVOICE_829', { IV_VENDOR_ID: vendorId })
  ]);

  const result = {
    quotations,
    purchaseOrders,
    goodsReceipts,
    invoices
  };

  res.json({ data: result });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kaar Vendor Portal Server running on port ${PORT}`);
  console.log(`📡 SAP Base URL: ${process.env.SAP_BASE_URL || 'NOT CONFIGURED'}`);
  console.log(`🌐 CORS enabled for: ${CLIENT_ORIGIN}`);
  console.log(`💾 Cache: ${USE_CACHE ? 'ENABLED' : 'DISABLED'}`);
});