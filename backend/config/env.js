/**
 * Environment variable validation at startup.
 * Fails loudly if required variables are missing or invalid.
 * No mocks or defaults for secrets in production.
 */

// Required for startup: must be non-empty (no default secrets)
const requiredForStartup = {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || 'masjid_app',
  JWT_SECRET: process.env.JWT_SECRET,
};

const optional = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'mysql',
  DB_PORT: process.env.DB_PORT || '3306',
  FRONTEND_URL: process.env.FRONTEND_URL,
  BACKEND_URL: process.env.BACKEND_URL,
};

/**
 * Validate required environment variables at startup.
 * Throws with a clear message if any required var is missing or empty.
 */
export function validateEnv() {
  const missing = [];
  for (const [key, value] of Object.entries(requiredForStartup)) {
    if (value === undefined || value === null || String(value).trim() === '') {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    const msg = `Missing or empty required environment variables: ${missing.join(', ')}. ` +
      'Set them in .env or the environment (see backend/env.example).';
    throw new Error(msg);
  }

  const port = parseInt(optional.PORT, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${optional.PORT}. Must be 1-65535.`);
  }

  const dbPort = parseInt(optional.DB_PORT, 10);
  if (Number.isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error(`Invalid DB_PORT: ${optional.DB_PORT}. Must be 1-65535.`);
  }

  return { required: requiredForStartup, optional };
}

/**
 * Get validated env for use in app (after validateEnv has been called).
 */
export function getEnv() {
  return {
    ...requiredForStartup,
    ...optional,
    PORT: parseInt(optional.PORT, 10),
    DB_PORT: parseInt(optional.DB_PORT, 10),
  };
}
