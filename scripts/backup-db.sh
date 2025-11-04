#!/bin/bash

# Database Backup Script
# This script creates a backup of the MySQL database

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/masjid_app_backup_${TIMESTAMP}.sql.gz"

echo "💾 Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Load environment variables if .env exists
if [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-masjid_app}
DB_USER=${DB_USER:-masjid_user}
DB_PASSWORD=${DB_PASSWORD:-masjid_password}

# Check if using Docker
if command -v docker &> /dev/null && docker ps --format "{{.Names}}" | grep -q "masjid_mysql"; then
    echo -e "${GREEN}[INFO]${NC} Backing up database from Docker container..."
    
    docker exec masjid_mysql mysqldump \
        -u ${DB_USER} \
        -p${DB_PASSWORD} \
        --single-transaction \
        --routines \
        --triggers \
        ${DB_NAME} | gzip > ${BACKUP_FILE}
    
    echo -e "${GREEN}✓${NC} Backup created: ${BACKUP_FILE}"
else
    # Backup from local MySQL
    if command -v mysql &> /dev/null; then
        echo -e "${GREEN}[INFO]${NC} Backing up database from local MySQL..."
        
        mysqldump \
            -u ${DB_USER} \
            ${DB_PASSWORD:+-p${DB_PASSWORD}} \
            --single-transaction \
            --routines \
            --triggers \
            ${DB_NAME} | gzip > ${BACKUP_FILE}
        
        echo -e "${GREEN}✓${NC} Backup created: ${BACKUP_FILE}"
    else
        echo -e "${RED}[ERROR]${NC} MySQL client not found and Docker container not running"
        exit 1
    fi
fi

# Get backup size
BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
echo -e "${GREEN}✓${NC} Backup size: ${BACKUP_SIZE}"

# Keep only last 7 days of backups
echo -e "${YELLOW}[INFO]${NC} Cleaning up old backups (keeping last 7 days)..."
find ${BACKUP_DIR} -name "masjid_app_backup_*.sql.gz" -mtime +7 -delete
echo -e "${GREEN}✓${NC} Cleanup completed"

# List all backups
echo ""
echo -e "${GREEN}📦 Available backups:${NC}"
ls -lh ${BACKUP_DIR}/masjid_app_backup_*.sql.gz 2>/dev/null | tail -5 || echo "  No backups found"

echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo ""
echo "To restore a backup, use:"
echo "  gunzip < ${BACKUP_FILE} | docker exec -i masjid_mysql mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME}"

