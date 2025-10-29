#!/bin/bash

# MyMasjidApp Backup Script
# This script creates backups of the database and application data

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

print_status "Creating backup in $BACKUP_DIR"

# Backup database
print_status "Backing up database..."
if docker-compose exec mysql mysqldump -u masjid_user -p masjid_app > "$BACKUP_DIR/database.sql" 2>/dev/null; then
    print_status "Database backup completed"
    gzip "$BACKUP_DIR/database.sql"
else
    print_error "Database backup failed"
fi

# Backup uploads directory
if [ -d "uploads" ]; then
    print_status "Backing up uploads directory..."
    tar -czf "$BACKUP_DIR/uploads.tar.gz" uploads/
    print_status "Uploads backup completed"
fi

# Backup configuration files
print_status "Backing up configuration files..."
tar -czf "$BACKUP_DIR/config.tar.gz" backend/.env .env nginx/ 2>/dev/null || true
print_status "Configuration backup completed"

# Backup docker-compose and deployment files
print_status "Backing up deployment files..."
tar -czf "$BACKUP_DIR/deployment.tar.gz" docker-compose.yml Dockerfile backend/Dockerfile deploy.sh monitor.sh 2>/dev/null || true
print_status "Deployment files backup completed"

# Create backup info file
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup created: $(date)
Database: masjid_app
Backup directory: $BACKUP_DIR
Files included:
- database.sql.gz (database dump)
- uploads.tar.gz (uploaded files)
- config.tar.gz (configuration files)
- deployment.tar.gz (deployment files)
EOF

print_status "Backup completed successfully!"
print_status "Backup location: $BACKUP_DIR"

# Clean up old backups (keep last 7 days)
print_status "Cleaning up old backups..."
find backups -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
print_status "Old backups cleaned up"
