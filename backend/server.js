import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database.js';
import routes from './routes/index.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Configure CORS to allow credentials from allowed origins
const defaultAllowedOrigins = [
  'http://localhost',
  'http://localhost:3000'
];
const configuredOrigin = process.env.FRONTEND_URL || '';
const allowedOrigins = configuredOrigin
  ? Array.from(new Set([...defaultAllowedOrigins, configuredOrigin]))
  : defaultAllowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools
    const isAllowed = allowedOrigins.includes(origin);
    return callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

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

app.use('/api', routes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", async () => {
  logger.success(`Server running on port ${theme.data(PORT)}`);
  logger.info(`Environment: ${theme.data(process.env.NODE_ENV || 'development')}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
