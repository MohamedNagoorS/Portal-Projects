/**
 * Kaar Customer Portal - Express Backend
 * Acts as a secure SOAP/RFC proxy to SAP
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

// In-memory cache (simple implementation)
const cache = new Map();
const USE_CACHE = process.env.USE_CACHE === 'true';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '300000', 10);

/**
 * Escape XML special characters to prevent injection
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
 * @param {string} functionName - SAP function module name (e.g., 'ZFM_LOGIN_829')
 * @param {Object} bodyFields - Fields to include in the function body
 * @returns {string} SOAP envelope XML
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
 * @param {string} functionName - Function module name
 * @returns {string} ICF path
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
    'ZFM_SALES_SUMMARY_829': 'zfrc_sales_summary_829'
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
 * Handles tables (arrays) and converts field names to camelCase where appropriate
 */
function normalizeSapResponse(parsedXml) {
  const envelope = parsedXml['soap:Envelope'] || 
                   parsedXml['soapenv:Envelope'] || 
                   parsedXml['soap-env:Envelope'];
  
  if (!parsedXml || !envelope) {
    console.warn('[NORMALIZE] No envelope found in parsed XML');
    return null;
  }

  const body = envelope['soap:Body'] || 
               envelope['soapenv:Body'] || 
               envelope['soap-env:Body'];
  
  if (!body || !body[0]) {
    console.warn('[NORMALIZE] No body found in envelope');
    return null;
  }

  const responseKeys = Object.keys(body[0]);
  if (responseKeys.length === 0) {
    console.warn('[NORMALIZE] No response keys found in body');
    return null;
  }

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
 * Call SAP RFC function via SOAP
 * @param {string} functionName - SAP function module name
 * @param {Object} bodyFields - Fields for the function call
 * @returns {Promise<Object>} Normalized response data
 */
async function callSap(functionName, bodyFields = {}) {
  const sapBaseUrl = process.env.SAP_BASE_URL;
  const sapBasic = process.env.SAP_BASIC;

  if (!sapBaseUrl || !sapBasic) {
    throw new Error('SAP_BASE_URL and SAP_BASIC must be configured in .env');
  }

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

  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': `"${soapAction}"`,
    'Authorization': `Basic ${sapBasic}`
  };

  try {
    console.log(`[SAP CALL] ${functionName} -> ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: soapEnvelope
    });

    const responseText = await response.text();
    
    let parsed;
    try {
      parsed = await parser.parseStringPromise(responseText);
    } catch (parseError) {
      if (!response.ok) {
        console.error(`[SAP ERROR] HTTP ${response.status}: ${response.statusText}`);
        console.error(`[SAP ERROR] URL: ${url}`);
        console.error(`[SAP ERROR] Response (first 1000 chars): ${responseText.substring(0, 1000)}`);
        throw { 
          type: 'HTTP_ERROR', 
          status: response.status, 
          statusText: response.statusText,
          details: { response: responseText.substring(0, 500) },
          url: url
        };
      }
      throw parseError;
    }

    if (!parsed) {
      console.error(`[SAP ERROR] ${functionName}: Received empty or non-XML response from SAP.`);
      console.error(`[SAP ERROR] Response (first 500 chars): ${responseText.substring(0, 500)}`);
      throw { 
        type: 'EMPTY_RESPONSE', 
        message: 'SAP returned an empty or non-XML response',
        details: responseText.substring(0, 500)
      };
    }

    const envelope = parsed['soap:Envelope'] || parsed['soapenv:Envelope'] || parsed['soap-env:Envelope'];
    if (envelope) {
      const body = envelope['soap:Body'] || envelope['soapenv:Body'] || envelope['soap-env:Body'];
      const faultElement = body && body[0] && (
        body[0]['soap:Fault'] || 
        body[0]['soapenv:Fault'] || 
        body[0]['soap-env:Fault'] ||
        body[0]['Fault']
      );
      
      if (faultElement) {
        const fault = faultElement[0];
        
        let faultstring = fault['soap:faultstring']?.[0] || fault['soapenv:faultstring']?.[0] || fault['soap-env:faultstring']?.[0] || fault['faultstring']?.[0];
        if (typeof faultstring === 'object' && faultstring._) {
          faultstring = faultstring._;
        }
        
        let tid = null;
        if (faultstring && typeof faultstring === 'string') {
          const tidMatch = faultstring.match(/Transaction ID ([A-F0-9]+)/i);
          if (tidMatch) {
            tid = tidMatch[1];
          }
        }
        
        const faultDetails = {
          faultcode: fault['soap:faultcode']?.[0] || fault['soapenv:faultcode']?.[0] || fault['soap-env:faultcode']?.[0] || fault['faultcode']?.[0],
          faultstring: faultstring,
          detail: fault['soap:detail'] || fault['soapenv:detail'] || fault['soap-env:detail'] || fault['detail'],
          tid: tid || fault['tid']?.[0] || fault['soap:tid']?.[0] || fault['soapenv:tid']?.[0],
          timestamp: fault['timestamp']?.[0] || fault['soap:timestamp']?.[0] || fault['soapenv:timestamp']?.[0]
        };
        
        console.error(`[SOAP FAULT] ${functionName}:`, faultDetails);
        console.error(`[SOAP FAULT] Full response:`, responseText);
        throw { type: 'SOAP_FAULT', fault: faultDetails, rawXml: responseText, httpStatus: response.status };
      }
    }
    
    if (!response.ok) {
      console.error(`[SAP ERROR] HTTP ${response.status}: ${response.statusText}`);
      console.error(`[SAP ERROR] URL: ${url}`);
      console.error(`[SAP ERROR] Response (first 1000 chars): ${responseText.substring(0, 1000)}`);
      console.error(`[SAP ERROR] Request Headers:`, JSON.stringify(headers, null, 2));
      console.error(`[SAP ERROR] SOAP Envelope:`, soapEnvelope);
      
      throw { 
        type: 'HTTP_ERROR', 
        status: response.status, 
        statusText: response.statusText,
        details: { parsed, response: responseText.substring(0, 500) },
        url: url
      };
    }

    const normalized = normalizeSapResponse(parsed);
    
    console.log(`[SAP RESPONSE] ${functionName} - Parsed:`, JSON.stringify(parsed, null, 2).substring(0, 1000));
    console.log(`[SAP RESPONSE] ${functionName} - Normalized:`, JSON.stringify(normalized, null, 2).substring(0, 1000));

    if (USE_CACHE && normalized) {
      cache.set(cacheKey, { data: normalized, timestamp: Date.now() });
    }

    return normalized || parsed || { success: true, message: 'Response received but could not be normalized' };

  } catch (error) {
    if (error.type === 'SOAP_FAULT' || error.type === 'EMPTY_RESPONSE') {
      throw error;
    }
    console.error(`[SAP CALL ERROR] ${functionName}:`, error.message);
    throw error;
  }
}

// Validation helpers
function validateCustomerId(customerId) {
  if (!customerId || typeof customerId !== 'string') {
    return { valid: false, error: 'Customer ID is required' };
  }
  if (customerId.length > 10) {
    return { valid: false, error: 'Customer ID must be 10 characters or less' };
  }
  return { valid: true };
}

// --- API Routes ---

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { CUSTOMER_ID, PASSCODE } = req.body;
    
    const validation = validateCustomerId(CUSTOMER_ID);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!PASSCODE) {
      return res.status(400).json({ error: 'PASSCODE is required' });
    }

    const result = await callSap('ZFM_LOGIN_829', { CUSTOMER_ID, PASSCODE });
    
    if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
      console.warn('[LOGIN] SAP returned empty/null response, but HTTP was successful');
      res.json({ data: { SUCCESS: 'X', MESSAGE: 'Login successful', CUSTOMER_ID: CUSTOMER_ID } });
    } else {
      res.json({ data: result });
    }
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid,
        message: error.fault.faultstring || 'SAP SOAP Fault occurred',
        httpStatus: error.httpStatus || 500
      });
    }
    if (error.type === 'HTTP_ERROR') {
      return res.status(502).json({ 
        error: 'sap-http-error',
        status: error.status,
        statusText: error.statusText,
        details: error.details,
        url: error.url,
        message: `SAP HTTP Error: ${error.status} ${error.statusText}`
      });
    }
    res.status(500).json({ error: error.message, type: error.type || 'unknown' });
  }
});

// GET /api/profile/:id
app.get('/api/profile/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_PROFILE_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inquiry/:id
app.get('/api/inquiry/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_INQUIRY_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/salesorder/:id
app.get('/api/salesorder/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_SALESORDER_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/deliveries/:id
app.get('/api/deliveries/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_LISTDELIVERIES_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_INVOICE_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/aging/:id
app.get('/api/aging/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_PAYMENT_AGING_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/memos/:id
app.get('/api/memos/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_MEMO_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sales-summary/:id
app.get('/api/sales-summary/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await callSap('ZFM_SALES_SUMMARY_829', { IV_CUSTOMER_ID: customerId });
    res.json({ data: result });
  } catch (error) {
    if (error.type === 'SOAP_FAULT') {
      return res.status(502).json({ 
        error: 'sap-fault', 
        fault: error.fault,
        tid: error.fault.tid 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/:id - Aggregates multiple endpoints
app.get('/api/dashboard/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const validation = validateCustomerId(customerId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const [inquiry, salesorder, deliveries, salesSummary] = await Promise.allSettled([
      callSap('ZFM_INQUIRY_829', { IV_CUSTOMER_ID: customerId }),
      callSap('ZFM_SALESORDER_829', { IV_CUSTOMER_ID: customerId }),
      callSap('ZFM_LISTDELIVERIES_829', { IV_CUSTOMER_ID: customerId }),
      callSap('ZFM_SALES_SUMMARY_829', { IV_CUSTOMER_ID: customerId })
    ]);

    const result = {
      inquiry: inquiry.status === 'fulfilled' ? inquiry.value : { error: inquiry.reason?.message },
      salesorder: salesorder.status === 'fulfilled' ? salesorder.value : { error: salesorder.reason?.message },
      deliveries: deliveries.status === 'fulfilled' ? deliveries.value : { error: deliveries.reason?.message },
      salesSummary: salesSummary.status === 'fulfilled' ? salesSummary.value : { error: salesSummary.reason?.message }
    };

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kaar Customer Portal Server running on port ${PORT}`);
  console.log(`📡 SAP Base URL: ${process.env.SAP_BASE_URL || 'NOT CONFIGURED'}`);
  console.log(`🌐 CORS enabled for: ${CLIENT_ORIGIN}`);
  console.log(`💾 Cache: ${USE_CACHE ? 'ENABLED' : 'DISABLED'}`);
});