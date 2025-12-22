#!/bin/bash

# MyMasjidApp Production Deployment Script
# For use on production server (DigitalOcean, VPS, etc.)

set -e

echo "🚀 Starting MyMasjidApp Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Installing..."
    apt update
    apt install docker-compose-plugin -y
fi

# Create necessary directories
print_step "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p uploads
mkdir -p /opt/backups/mymasjidapp

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env not found. Creating from template..."
    if [ -f "backend/env.production" ]; then
        cp backend/env.production backend/.env
        print_warning "Please edit backend/.env with your actual configuration values."
        print_warning "Run: nano backend/.env"
        exit 1
    else
        print_error "backend/env.production template not found!"
        exit 1
    fi
fi

if [ ! -f ".env" ]; then
    print_warning ".env not found. Creating from template..."
    if [ -f "env.production" ]; then
        cp env.production .env
        print_warning "Please edit .env with your actual configuration values."
        print_warning "Run: nano .env"
        exit 1
    else
        print_error "env.production template not found!"
        exit 1
    fi
fi

# Check for SSL certificates
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    print_warning "SSL certificates not found in nginx/ssl/"
    print_warning "If using Let's Encrypt, copy certificates:"
    print_warning "  cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem"
    print_warning "  cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem"
    read -p "Continue without SSL? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Use production docker-compose if available
if [ -f "docker-compose.prod.yml" ]; then
    print_status "Using production docker-compose configuration..."
    cp docker-compose.prod.yml docker-compose.yml
fi

# Stop existing containers
print_step "Stopping existing containers..."
docker compose down --remove-orphans || true

# Build images
print_step "Building Docker images..."
docker compose build --no-cache

# Start services
print_step "Starting services..."
docker compose up -d

# Wait for services to be ready
print_step "Waiting for services to initialize..."
sleep 10

# Wait for MySQL to be ready
print_step "Waiting for MySQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        print_status "MySQL is ready!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done
echo

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    print_error "MySQL failed to start. Check logs: docker compose logs mysql"
    exit 1
fi

# Run database migrations
print_step "Running database migrations..."
docker compose exec -T backend npm run migrate || {
    print_warning "Migration may have already been run. Continuing..."
}

# Check service status
print_step "Checking service status..."
docker compose ps

# Display service URLs
echo ""
print_status "=========================================="
print_status "Deployment completed successfully!"
print_status "=========================================="
echo ""
print_status "Service Status:"
docker compose ps
echo ""
print_status "View logs:"
print_status "  docker compose logs -f"
print_status "  docker compose logs backend -f"
print_status "  docker compose logs frontend -f"
print_status "  docker compose logs nginx -f"
echo ""
print_status "Useful commands:"
print_status "  Restart services: docker compose restart"
print_status "  Stop services: docker compose down"
print_status "  View logs: docker compose logs -f"
echo ""

# Check if services are healthy
print_step "Checking service health..."
sleep 5

if docker compose ps | grep -q "Up"; then
    print_status "✅ Services are running!"
else
    print_error "❌ Some services may not be running. Check logs above."
fi

echo ""
print_warning "Next steps:"
print_warning "1. Verify your domain DNS points to this server"
print_warning "2. Test your application: https://yourdomain.com"
print_warning "3. Set up SSL certificates if not already done"
print_warning "4. Configure automatic backups"
print_warning "5. Set up monitoring"

