import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, pool } from './config/database.js';
import routes from './routes/index.js';
import { handlePaymentWebhook } from './controllers/webhookController.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { ensureCheckInTable } from './utils/ensureCheckInTable.js';
import { ensurePendingStatus } from './utils/ensurePendingStatus.js';
import { ensurePendingPicTable } from './utils/pendingPicChanges.js';
import { ensurePicRole } from './utils/ensurePicRole.js';
import createArchivedStudentsTable from './scripts/create_archived_students_table.js';
import { ensureAdminAccounts } from './utils/ensureAdminAccounts.js';
import { ensureIbRole } from './utils/ensureIbRole.js';
import { scheduleAnnualDatabaseBackup } from './schedulers/annualBackupJob.js';
import { scheduleAnnouncementCleanup } from './schedulers/announcementCleanupJob.js';
import { schedulePaymentReconciliation } from './schedulers/paymentReconciliationJob.js';
import { scheduleAdminActionCleanup } from './schedulers/adminActionCleanupJob.js';
import { scheduleMonthlyFeeGeneration, scheduleFeeSyncJob } from './schedulers/monthlyFeeGenerationJob.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureLoginAttemptsTable } from './services/accountLockoutService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Simple logger for production
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`)
};

const theme = {
  data: (msg) => msg
};

// Load environment variables
dotenv.config();

const app = express();

// ==================== SECURITY MIDDLEWARE ====================

// Helmet.js - Enhanced Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
    force: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permissionsPolicy: {
    features: {
      geolocation: ["'self'"],
      camera: ["'none'"],
      microphone: ["'none'"]
    }
  }
}));

// Configure CORS FIRST - before rate limiting to handle preflight requests
const defaultAllowedOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://localhost:3000',
  'http://localhost:5173'
];
const configuredOrigin = process.env.FRONTEND_URL || '';
const allowedOrigins = configuredOrigin
  ? Array.from(new Set([...defaultAllowedOrigins, configuredOrigin]))
  : defaultAllowedOrigins;

// CORS configuration with proper handling
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('http://localhost') ||
                      origin.startsWith('https://localhost') ||
                      origin.includes('localhost');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Log blocked origin for debugging
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// More lenient rate limiter for preferences and profile endpoints (authenticated users only)
const preferencesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for preferences (very generous)
  message: 'Too many requests for preferences, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests (preflight)
    return req.method === 'OPTIONS';
  }
});

// Rate limiting - General API protection (exclude OPTIONS requests and preferences/profile endpoints)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit: 1000 requests per 15 minutes to handle multiple components
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests (preflight)
    if (req.method === 'OPTIONS') {
      return true;
    }
    // Skip rate limiting for preferences and profile endpoints (they're user-specific and low-risk)
    // Check multiple path properties to catch all variations
    const path = req.path || '';
    const originalUrl = req.originalUrl || '';
    const url = req.url || '';
    const baseUrl = req.baseUrl || '';
    const fullPath = baseUrl + path;
    
    // Check for preferences endpoints
    if (path.includes('/preferences') || 
        originalUrl.includes('/preferences') || 
        url.includes('/preferences') ||
        fullPath.includes('/preferences')) {
      return true;
    }
    
    // Check for profile/complete endpoint (also user-specific)
    if (path.includes('/profile/complete') || 
        originalUrl.includes('/profile/complete') || 
        url.includes('/profile/complete') ||
        fullPath.includes('/profile/complete')) {
      return true;
    }
    
    return false;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Note: Auth-specific rate limiters are defined in middleware/security.js
// and applied directly to auth routes

// Apply lenient rate limiting specifically to preferences and profile endpoints FIRST
// This ensures they get the lenient limiter before the general one
app.use('/api/auth/preferences', preferencesLimiter);
app.use('/api/auth/profile/complete', preferencesLimiter);

// Apply general rate limiting to all routes (after CORS and specific limiters)
app.use('/api', generalLimiter);

// Webhook endpoint (needs raw body for signature verification)
app.post('/api/webhook/payment', express.raw({ type: 'application/json', limit: '10mb' }), (req, res, next) => {
  // Parse JSON body after raw body is received
  try {
    req.body = JSON.parse(req.body.toString());
  } catch (e) {
    req.body = {};
  }
  next();
}, handlePaymentWebhook);

// Body parser with size limits to prevent DoS attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization to prevent XSS attacks
app.use(sanitizeInput);

// ==================== END SECURITY MIDDLEWARE ====================

// Test database connection on startup
try {
  await testConnection();
  logger.info(`✅ Connected to database: ${process.env.DB_NAME || "masjid_app"}`);
} catch (error) {
  logger.error(`❌ Database connection failed: ${error.message}`);
  process.exit(1);
}

// Health check endpoint with connection verification
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const [dbTest] = await pool.execute('SELECT 1 as test');
    const dbHealthy = dbTest && dbTest[0] && dbTest[0].test === 1;
    
    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for all requests (including images)
  const origin = req.headers.origin;
  
  // Always allow localhost origins for development
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  } else if (!origin) {
    // Allow requests with no origin (direct access)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers for all static file responses
    const origin = res.req?.headers?.origin;
    
    // Always allow localhost origins for development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // Prevent caching issues
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Masjid App API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

// Ensure check-in table exists on startup
ensureCheckInTable().catch(err => {
  console.error('Failed to ensure check-in table:', err);
});

// Ensure pending status exists in users table
ensurePendingStatus().catch(err => {
  console.error('Failed to ensure pending status:', err);
});

// Ensure pending PIC table exists
ensurePendingPicTable().catch(err => {
  console.error('Failed to ensure pending PIC table:', err);
});

// Ensure PIC role is present in users table
ensurePicRole().catch(err => {
  console.error('Failed to ensure PIC role:', err);
});

// Ensure archived_students table exists
createArchivedStudentsTable().catch(err => {
  console.error('Failed to ensure archived_students table:', err);
});

// Ensure admin accounts exist with correct passwords
ensureAdminAccounts().catch(err => {
  console.error('Failed to ensure admin accounts:', err);
});

// Ensure IB role and payment confirmation system exists
ensureIbRole().catch(err => {
  console.error('Failed to ensure IB role:', err);
});

const PORT = process.env.PORT || 5000;

// Ensure check-in table and pending status exist before starting server
Promise.all([
  ensureCheckInTable(), 
  ensurePendingStatus(), 
  ensurePendingPicTable(), 
  ensurePicRole(), 
  createArchivedStudentsTable(), 
  ensureAdminAccounts(), 
  ensureIbRole(), 
  ensureLoginAttemptsTable(),
  testConnection()
]).then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    logger.success(`Server running on port ${theme.data(PORT)}`);
    logger.info(`Environment: ${theme.data(process.env.NODE_ENV || 'development')}`);
    logger.info(`Database: ${process.env.DB_HOST || 'mysql'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'masjid_app'}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API Base: http://localhost:${PORT}/api`);
    scheduleAnnualDatabaseBackup();
    scheduleAnnouncementCleanup();
    schedulePaymentReconciliation();
    scheduleAdminActionCleanup();
    scheduleMonthlyFeeGeneration();
    scheduleFeeSyncJob();
  });
}).catch(err => {
  console.error('Failed to ensure database tables:', err);
  // Still start server, but log the error
  app.listen(PORT, "0.0.0.0", () => {
    logger.success(`Server running on port ${theme.data(PORT)}`);
    logger.info(`Environment: ${theme.data(process.env.NODE_ENV || 'development')}`);
    logger.info(`Database: ${process.env.DB_HOST || 'mysql'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'masjid_app'}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API Base: http://localhost:${PORT}/api`);
    logger.error('⚠️  Database connection may have issues - check logs above');
    scheduleAnnualDatabaseBackup();
    scheduleAnnouncementCleanup();
    schedulePaymentReconciliation();
    scheduleAdminActionCleanup();
    scheduleMonthlyFeeGeneration();
    scheduleFeeSyncJob();
  });
});

export default app;
