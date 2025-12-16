import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * API Request Signing Utility
 * Provides request signature verification for critical API endpoints
 * 
 * Use Cases:
 * - Payment webhooks (verify requests from payment gateway)
 * - Admin actions (ensure request hasn't been tampered)
 * - Critical data updates (verify integrity)
 * 
 * How it works:
 * 1. Client generates signature: HMAC-SHA256(request_body + timestamp + nonce, secret_key)
 * 2. Client sends signature in header: X-Signature
 * 3. Server verifies signature matches
 * 4. Server checks timestamp to prevent replay attacks
 */

const SIGNATURE_HEADER = 'x-signature';
const TIMESTAMP_HEADER = 'x-timestamp';
const NONCE_HEADER = 'x-nonce';
const SIGNATURE_VALIDITY_SECONDS = 300; // 5 minutes

// Store used nonces to prevent replay attacks
const usedNonces = new Set();
const MAX_NONCE_CACHE = 10000;

/**
 * Get API signing secret from environment
 */
function getSigningSecret() {
  const secret = process.env.API_SIGNING_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('API_SIGNING_SECRET or JWT_SECRET must be set in environment');
  }
  
  return secret;
}

/**
 * Generate signature for request
 * Use this on client side or for testing
 * 
 * @param {Object} payload - Request body
 * @param {string} timestamp - ISO timestamp
 * @param {string} nonce - Random nonce
 * @returns {string} HMAC signature (hex)
 */
export function generateSignature(payload, timestamp, nonce) {
  try {
    const secret = getSigningSecret();
    
    // Create message to sign: payload + timestamp + nonce
    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);
    
    const message = `${payloadString}${timestamp}${nonce}`;
    
    // Generate HMAC signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    
    return hmac.digest('hex');
  } catch (error) {
    console.error('Signature generation error:', error);
    throw new Error('Failed to generate signature');
  }
}

/**
 * Verify request signature
 * 
 * @param {Object} payload - Request body
 * @param {string} signature - Signature from header
 * @param {string} timestamp - Timestamp from header
 * @param {string} nonce - Nonce from header
 * @returns {boolean} True if signature is valid
 */
export function verifySignature(payload, signature, timestamp, nonce) {
  try {
    // Check if required parameters are present
    if (!signature || !timestamp || !nonce) {
      console.warn('Missing signature, timestamp, or nonce');
      return false;
    }
    
    // Check timestamp (prevent replay attacks)
    const requestTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime) / 1000; // seconds
    
    if (timeDiff > SIGNATURE_VALIDITY_SECONDS) {
      console.warn('Signature expired:', { timeDiff, maxAge: SIGNATURE_VALIDITY_SECONDS });
      return false;
    }
    
    // Check nonce (prevent replay attacks)
    if (usedNonces.has(nonce)) {
      console.warn('Nonce already used:', nonce);
      return false;
    }
    
    // Generate expected signature
    const expectedSignature = generateSignature(payload, timestamp, nonce);
    
    // Compare signatures (constant-time comparison to prevent timing attacks)
    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!signaturesMatch) {
      console.warn('Signature mismatch');
      return false;
    }
    
    // Mark nonce as used
    usedNonces.add(nonce);
    
    // Clean up old nonces if cache is too large
    if (usedNonces.size > MAX_NONCE_CACHE) {
      const noncesToDelete = Array.from(usedNonces).slice(0, usedNonces.size - MAX_NONCE_CACHE);
      noncesToDelete.forEach(n => usedNonces.delete(n));
    }
    
    return true;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Middleware to verify API request signature
 * Apply this to critical endpoints
 * 
 * Usage: app.post('/api/admin/critical', requireSignature, ...)
 */
export function requireSignature(req, res, next) {
  try {
    const signature = req.headers[SIGNATURE_HEADER];
    const timestamp = req.headers[TIMESTAMP_HEADER];
    const nonce = req.headers[NONCE_HEADER];
    
    // Get request body
    const payload = req.body;
    
    // Verify signature
    const isValid = verifySignature(payload, signature, timestamp, nonce);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired request signature'
      });
    }
    
    // Signature valid - continue
    next();
  } catch (error) {
    console.error('Signature verification middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify request signature'
    });
  }
}

/**
 * Optional signature verification
 * Verifies if signature is present, but doesn't fail if not
 * Use for endpoints that support both signed and unsigned requests
 */
export function optionalSignature(req, res, next) {
  try {
    const signature = req.headers[SIGNATURE_HEADER];
    
    // If signature is present, verify it
    if (signature) {
      const timestamp = req.headers[TIMESTAMP_HEADER];
      const nonce = req.headers[NONCE_HEADER];
      const payload = req.body;
      
      const isValid = verifySignature(payload, signature, timestamp, nonce);
      req.signatureVerified = isValid;
    } else {
      req.signatureVerified = false;
    }
    
    next();
  } catch (error) {
    console.error('Optional signature verification error:', error);
    req.signatureVerified = false;
    next();
  }
}

/**
 * Generate a random nonce
 * 
 * @returns {string} Random nonce
 */
export function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate signature headers for a request
 * Helper for client-side or testing
 * 
 * @param {Object} payload - Request body
 * @returns {Object} Headers object with signature, timestamp, nonce
 */
export function generateSignatureHeaders(payload) {
  const timestamp = new Date().toISOString();
  const nonce = generateNonce();
  const signature = generateSignature(payload, timestamp, nonce);
  
  return {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp,
    [NONCE_HEADER]: nonce
  };
}

/**
 * Verify webhook signature from external service (e.g., payment gateway)
 * 
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Signature from webhook
 * @param {string} secret - Webhook secret from provider
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(payload, signature, secret, algorithm = 'sha256') {
  try {
    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);
    
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');
    
    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Sign data for storage (e.g., sign audit logs to prevent tampering)
 * 
 * @param {Object} data - Data to sign
 * @returns {string} Signature
 */
export function signData(data) {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const secret = getSigningSecret();
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataString);
  
  return hmac.digest('hex');
}

/**
 * Verify signed data
 * 
 * @param {Object} data - Original data
 * @param {string} signature - Signature to verify
 * @returns {boolean} True if signature is valid
 */
export function verifySignedData(data, signature) {
  try {
    const expectedSignature = signData(data);
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Data signature verification error:', error);
    return false;
  }
}

export default {
  generateSignature,
  verifySignature,
  requireSignature,
  optionalSignature,
  generateNonce,
  generateSignatureHeaders,
  verifyWebhookSignature,
  signData,
  verifySignedData
};
