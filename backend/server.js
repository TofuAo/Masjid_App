import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database.js';
import routes from './routes/index.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger, theme } from '../logger.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test database connection on startup
try {
  await testConnection();
  logger.info(`✅ Connected to database: ${process.env.DB_NAME || "masjid_app"}`);
} catch (error) {
  logger.error(`❌ Database connection failed: ${error.message}`);
  process.exit(1);
}

app.use('/api', routes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", async () => {
  logger.success(`Server running on port ${theme.data(PORT)}`);
  logger.info(`Environment: ${theme.data(process.env.NODE_ENV || 'development')}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
