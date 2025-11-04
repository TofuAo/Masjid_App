#!/bin/bash

# Database Initialization Script
# This script initializes the database outside of Docker

set -e

echo "🗄️  Initializing database..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo -e "${RED}[ERROR]${NC} backend/.env file not found!"
    exit 1
fi

DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-masjid_app}

echo -e "${GREEN}[INFO]${NC} Connecting to database: ${DB_NAME} on ${DB_HOST}"

# Check if MySQL client is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} MySQL client is not installed. Please install mysql-client."
    exit 1
fi

# Create database if it doesn't exist
echo -e "${GREEN}[INFO]${NC} Creating database if it doesn't exist..."
mysql -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD:+-p${DB_PASSWORD}} <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
EOF

# Import schema
if [ -f "database/masjid_app_schema.sql" ]; then
    echo -e "${GREEN}[INFO]${NC} Importing database schema..."
    mysql -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD:+-p${DB_PASSWORD}} ${DB_NAME} < database/masjid_app_schema.sql
    echo -e "${GREEN}✓${NC} Schema imported successfully"
else
    echo -e "${RED}[ERROR]${NC} database/masjid_app_schema.sql not found!"
    exit 1
fi

# Apply timestamp columns migration if needed
if [ -f "backend/scripts/add_timestamp_columns.sql" ]; then
    echo -e "${GREEN}[INFO]${NC} Applying timestamp columns migration..."
    mysql -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD:+-p${DB_PASSWORD}} ${DB_NAME} < backend/scripts/add_timestamp_columns.sql 2>/dev/null || {
        echo -e "${YELLOW}[WARNING]${NC} Timestamp migration may have already been applied"
    }
fi

echo ""
echo -e "${GREEN}✅ Database initialization completed!${NC}"

