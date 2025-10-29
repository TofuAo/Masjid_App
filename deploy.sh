#!/bin/bash

# MyMasjidApp Deployment Script
# This script automates the deployment process

set -e

echo "🚀 Starting MyMasjidApp deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p uploads

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env not found. Creating from template..."
    cp backend/env.production backend/.env
    print_warning "Please edit backend/.env with your actual configuration values."
fi

if [ ! -f ".env" ]; then
    print_warning ".env not found. Creating from template..."
    cp env.production .env
    print_warning "Please edit .env with your actual configuration values."
fi

# Build and start services
print_status "Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."
docker-compose ps

# Run database migrations
print_status "Running database migrations..."
docker-compose exec backend node -e "
const { pool } = require('./config/database.js');
const fs = require('fs');
const sql = fs.readFileSync('/app/database/masjid_app_schema.sql', 'utf8');
pool.execute(sql).then(() => {
    console.log('Database schema created successfully');
    process.exit(0);
}).catch(err => {
    console.error('Database migration failed:', err);
    process.exit(1);
});
"

print_status "Deployment completed successfully!"
print_status "Frontend: http://localhost:3000"
print_status "Backend API: http://localhost:5000"
print_status "Database: localhost:3306"

print_warning "Don't forget to:"
print_warning "1. Update your domain name in nginx/nginx.conf"
print_warning "2. Obtain SSL certificates for HTTPS"
print_warning "3. Update environment variables with production values"
print_warning "4. Set up monitoring and logging"
