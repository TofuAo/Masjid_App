import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';
import routes from './routes/index.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { ensureCheckInTable } from './utils/ensureCheckInTable.js';
import { ensurePendingStatus } from './utils/ensurePendingStatus.js';
import { ensurePendingPicTable } from './utils/pendingPicChanges.js';
import { ensurePicRole } from './utils/ensurePicRole.js';
import { scheduleAnnualDatabaseBackup } from './schedulers/annualBackupJob.js';
import { scheduleAnnouncementCleanup } from './schedulers/announcementCleanupJob.js';

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

// Helmet.js - Security headers
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
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
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
                      origin.startsWith('https://localhost');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
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
  max: 500, // Increased limit: 500 requests per 15 minutes
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);

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

const PORT = process.env.PORT || 5001;

// Ensure check-in table and pending status exist before starting server
Promise.all([ensureCheckInTable(), ensurePendingStatus(), ensurePendingPicTable(), ensurePicRole()]).then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    logger.success(`Server running on port ${theme.data(PORT)}`);
    logger.info(`Environment: ${theme.data(process.env.NODE_ENV || 'development')}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    scheduleAnnualDatabaseBackup();
    scheduleAnnouncementCleanup();
  });
}).catch(err => {
  console.error('Failed to ensure database tables:', err);
  // Still start server, but log the error
  app.listen(PORT, "0.0.0.0", () => {
    logger.success(`Server running on port ${theme.data(PORT)}`);
    logger.info(`Environment: ${theme.data(process.env.NODE_ENV || 'development')}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    scheduleAnnualDatabaseBackup();
    scheduleAnnouncementCleanup();
  });
});

export default app;
