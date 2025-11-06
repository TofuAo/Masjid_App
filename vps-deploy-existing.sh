#!/bin/bash

# VPS Deployment Script for Existing Application
# Run this script when you already have MyMasjidApp files on the VPS

set -e

echo "🚀 MyMasjidApp - Deployment Script"
echo "==================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[→]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    print_error "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Get current directory
APP_DIR=$(pwd)
print_status "Application directory: $APP_DIR"

# Check if this is the application directory
if [ ! -f "package.json" ] && [ ! -f "docker-compose.yml" ]; then
    print_error "This doesn't appear to be the MyMasjidApp directory"
    print_error "Please run this script from the MyMasjidApp directory"
    exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ifconfig.co || echo "localhost")
print_status "Server IP: $SERVER_IP"

# Create necessary directories
print_step "Creating directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p uploads
mkdir -p backups
print_status "Directories created"

# Set up environment files
print_step "Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.production" ]; then
        cp backend/env.production backend/.env
        print_status "Created backend/.env from template"
    else
        print_error "backend/env.production not found"
        exit 1
    fi
fi

if [ ! -f ".env" ]; then
    if [ -f "env.production" ]; then
        cp env.production .env
        print_status "Created .env from template"
    else
        print_warning "Creating basic .env file"
        echo "DOMAIN=$SERVER_IP" > .env
        echo "VITE_API_BASE_URL=http://$SERVER_IP/api" >> .env
    fi
fi

# Generate secure passwords if needed
print_step "Generating secure passwords..."

# Generate DB password
if grep -q "your_database_password_here\|masjid_password" backend/.env; then
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-25)
    sed -i "s|your_database_password_here|$DB_PASSWORD|g" backend/.env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" backend/.env
    print_status "Database password generated"
fi

# Generate JWT secret
if grep -q "your_super_secret_jwt_key\|your_jwt_secret_here" backend/.env; then
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|your_super_secret_jwt_key.*|JWT_SECRET=$JWT_SECRET|g" backend/.env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" backend/.env
    print_status "JWT secret generated"
fi

# Update docker-compose.yml with generated password
if [ -f "docker-compose.yml" ]; then
    DB_PASSWORD_FROM_ENV=$(grep "^DB_PASSWORD=" backend/.env | cut -d '=' -f2)
    if [ ! -z "$DB_PASSWORD_FROM_ENV" ]; then
        sed -i "s|masjid_password|$DB_PASSWORD_FROM_ENV|g" docker-compose.yml
        print_status "Updated docker-compose.yml"
    fi
fi

# Update FRONTEND_URL with server IP
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$SERVER_IP|g" backend/.env
sed -i "s|yourdomain.com|$SERVER_IP|g" .env 2>/dev/null || true

# Stop existing containers
print_step "Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build Docker images
print_step "Building Docker images (this may take a few minutes)..."
docker-compose build --no-cache

# Start services
print_step "Starting services..."
docker-compose up -d

# Wait for services
print_step "Waiting for services to initialize..."
sleep 30

# Check service status
print_step "Checking service status..."
docker-compose ps

# Wait for MySQL
print_step "Waiting for MySQL..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        print_error "MySQL failed to start"
        docker-compose logs mysql
        exit 1
    fi
    sleep 2
done
print_status "MySQL is ready!"

# Run migrations
print_step "Running database migrations..."
docker-compose exec -T backend npm run migrate || {
    print_warning "Migration may have already been run"
}

# Test endpoints
print_step "Testing endpoints..."
sleep 5

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    print_status "Frontend/Nginx is accessible"
else
    print_warning "Frontend check failed"
fi

# Display summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📍 Access your application:"
echo -e "   ${GREEN}HTTP:${NC}  http://$SERVER_IP"
echo -e "   ${GREEN}API:${NC}  http://$SERVER_IP/api"
echo ""
echo -e "📊 Service Status:"
docker-compose ps
echo ""
echo -e "📝 Quick Commands:"
echo -e "   View logs:    docker-compose logs -f"
echo -e "   Restart:      docker-compose restart"
echo -e "   Stop:         docker-compose down"
echo -e "   Start:        docker-compose up -d"
echo ""

