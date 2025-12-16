import { encrypt, decrypt, encryptObject, decryptObject } from '../utils/encryption.js';

/**
 * Encryption Middleware
 * Automatically encrypts sensitive fields in request/response data
 */

/**
 * Define sensitive fields that should always be encrypted
 * Add or remove fields based on your application's needs
 */
const SENSITIVE_FIELDS = {
  // Personal Identifiable Information (PII)
  user: ['ic', 'ic_number', 'telefon', 'phone', 'alamat', 'address'],
  student: ['ic', 'ic_number', 'telefon', 'phone', 'alamat', 'address', 'nama_wali', 'telefon_wali'],
  teacher: ['ic', 'ic_number', 'telefon', 'phone', 'alamat', 'address'],
  parent: ['ic', 'ic_number', 'telefon', 'phone', 'alamat', 'address'],
  
  // Payment information (partial)
  payment: ['provider_reference', 'proof_url'],
  
  // Contact information
  contact: ['telefon', 'phone', 'email']
};

/**
 * Middleware to encrypt sensitive fields in request body
 * Apply this BEFORE saving to database
 * 
 * Usage: app.post('/api/users', encryptRequestFields(['user']), ...)
 */
export function encryptRequestFields(entityTypes = []) {
  return (req, res, next) => {
    if (!req.body) return next();
    
    try {
      // Get all fields to encrypt based on entity types
      const fieldsToEncrypt = new Set();
      for (const entityType of entityTypes) {
        const fields = SENSITIVE_FIELDS[entityType] || [];
        fields.forEach(field => fieldsToEncrypt.add(field));
      }
      
      // Encrypt each sensitive field in request body
      for (const field of fieldsToEncrypt) {
        if (req.body[field] && req.body[field] !== null && req.body[field] !== '') {
          req.body[field] = encrypt(String(req.body[field]));
        }
      }
      
      next();
    } catch (error) {
      console.error('Encryption middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process request data'
      });
    }
  };
}

/**
 * Middleware to decrypt sensitive fields in response data
 * Apply this AFTER fetching from database
 * 
 * Usage: app.get('/api/users/:id', authenticateToken, decryptResponseFields(['user']), ...)
 */
export function decryptResponseFields(entityTypes = []) {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to decrypt before sending
    res.json = function(data) {
      try {
        // Get all fields to decrypt based on entity types
        const fieldsToDecrypt = new Set();
        for (const entityType of entityTypes) {
          const fields = SENSITIVE_FIELDS[entityType] || [];
          fields.forEach(field => fieldsToDecrypt.add(field));
        }
        
        // Decrypt data
        const decrypted = decryptData(data, Array.from(fieldsToDecrypt));
        
        return originalJson(decrypted);
      } catch (error) {
        console.error('Decryption middleware error:', error);
        return originalJson(data); // Return original data if decryption fails
      }
    };
    
    next();
  };
}

/**
 * Recursively decrypt data structure
 * Handles objects, arrays, and nested structures
 */
function decryptData(data, fields) {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => decryptData(item, fields));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const decrypted = { ...data };
    
    // Decrypt specified fields
    for (const field of fields) {
      if (decrypted[field] && decrypted[field] !== null) {
        try {
          // Only decrypt if it looks encrypted (has our format)
          if (typeof decrypted[field] === 'string' && decrypted[field].includes(':')) {
            decrypted[field] = decrypt(decrypted[field]);
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep original value if decryption fails
        }
      }
    }
    
    // Recursively decrypt nested objects
    for (const key in decrypted) {
      if (typeof decrypted[key] === 'object' && decrypted[key] !== null) {
        decrypted[key] = decryptData(decrypted[key], fields);
      }
    }
    
    return decrypted;
  }
  
  return data;
}

/**
 * Selective decryption middleware
 * Only decrypts for authorized users (e.g., admins can see full data)
 * 
 * Usage: app.get('/api/users', authenticateToken, selectiveDecrypt(['admin']), ...)
 */
export function selectiveDecrypt(allowedRoles = [], entityTypes = []) {
  return (req, res, next) => {
    // Check if user has required role
    const userRole = req.user?.activeRole || req.user?.role;
    const hasPermission = allowedRoles.length === 0 || 
                         allowedRoles.includes(userRole) ||
                         (req.user?.roles && req.user.roles.some(r => allowedRoles.includes(r)));
    
    if (!hasPermission) {
      // User doesn't have permission - mask sensitive data instead
      return maskResponseFields(entityTypes)(req, res, next);
    }
    
    // User has permission - decrypt data
    return decryptResponseFields(entityTypes)(req, res, next);
  };
}

/**
 * Mask sensitive fields instead of decrypting
 * Used for users without permission to view full data
 */
export function maskResponseFields(entityTypes = []) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      try {
        const fieldsToMask = new Set();
        for (const entityType of entityTypes) {
          const fields = SENSITIVE_FIELDS[entityType] || [];
          fields.forEach(field => fieldsToMask.add(field));
        }
        
        const masked = maskData(data, Array.from(fieldsToMask));
        return originalJson(masked);
      } catch (error) {
        console.error('Masking middleware error:', error);
        return originalJson(data);
      }
    };
    
    next();
  };
}

/**
 * Mask sensitive data (replace with asterisks)
 */
function maskData(data, fields) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => maskData(item, fields));
  }
  
  if (typeof data === 'object') {
    const masked = { ...data };
    
    for (const field of fields) {
      if (masked[field] && masked[field] !== null) {
        const value = String(masked[field]);
        // Mask: show first 2 and last 2 characters, rest as asterisks
        if (value.length > 4) {
          masked[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        } else {
          masked[field] = '*'.repeat(value.length);
        }
      }
    }
    
    for (const key in masked) {
      if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = maskData(masked[key], fields);
      }
    }
    
    return masked;
  }
  
  return data;
}

/**
 * Encrypt specific fields in database queries
 * Use this helper in controllers
 */
export function encryptFields(data, fields) {
  if (!data || !fields || fields.length === 0) return data;
  
  const encrypted = { ...data };
  for (const field of fields) {
    if (encrypted[field] && encrypted[field] !== null && encrypted[field] !== '') {
      encrypted[field] = encrypt(String(encrypted[field]));
    }
  }
  return encrypted;
}

/**
 * Decrypt specific fields from database results
 * Use this helper in controllers
 */
export function decryptFields(data, fields) {
  if (!data || !fields || fields.length === 0) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => decryptFields(item, fields));
  }
  
  const decrypted = { ...data };
  for (const field of fields) {
    if (decrypted[field] && decrypted[field] !== null) {
      try {
        if (typeof decrypted[field] === 'string' && decrypted[field].includes(':')) {
          decrypted[field] = decrypt(decrypted[field]);
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
      }
    }
  }
  return decrypted;
}

export default {
  encryptRequestFields,
  decryptResponseFields,
  selectiveDecrypt,
  maskResponseFields,
  encryptFields,
  decryptFields,
  SENSITIVE_FIELDS
};
