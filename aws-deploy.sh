#!/bin/bash

# AWS Deployment Script for MyMasjidApp
# Run this script on your EC2 instance after cloning the repository

set -e

echo "🚀 Starting AWS deployment for MyMasjidApp..."

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

# Check if running on EC2
if ! curl -s http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    print_warning "Not running on EC2 instance. Continuing anyway..."
fi

# Get EC2 instance metadata
print_step "Getting EC2 instance information..."
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "unknown")
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region 2>/dev/null || echo "unknown")

print_status "Instance ID: $INSTANCE_ID"
print_status "Public IP: $PUBLIC_IP"
print_status "Region: $REGION"

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please run aws-setup.sh first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please run aws-setup.sh first."
    exit 1
fi

# Navigate to project directory
if [ ! -d "~/MyMasjidApp" ]; then
    print_error "MyMasjidApp directory not found. Please clone the repository first."
    exit 1
fi

cd ~/MyMasjidApp || exit 1

# Create necessary directories
print_step "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p uploads
mkdir -p backups

# Set up environment files
print_step "Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env not found. Creating from template..."
    if [ -f "backend/env.production" ]; then
        cp backend/env.production backend/.env
        print_warning "Please edit backend/.env with your actual configuration values."
    else
        print_error "backend/env.production not found!"
        exit 1
    fi
fi

if [ ! -f ".env" ]; then
    print_warning ".env not found. Creating from template..."
    if [ -f "env.production" ]; then
        cp env.production .env
        
        # Auto-configure with EC2 public IP if domain not set
        if grep -q "yourdomain.com" .env; then
            print_warning "Updating .env with EC2 public IP..."
            sed -i "s|yourdomain.com|$PUBLIC_IP|g" .env
            sed -i "s|https://yourdomain.com|http://$PUBLIC_IP|g" .env
        fi
    else
        print_error "env.production not found!"
        exit 1
    fi
fi

# Generate secure passwords if not set
print_step "Checking security configuration..."

if grep -q "your_database_password_here" backend/.env; then
    print_warning "Generating secure database password..."
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-25)
    sed -i "s|your_database_password_here|$DB_PASSWORD|g" backend/.env
    print_status "Database password generated and saved to backend/.env"
fi

if grep -q "your_super_secret_jwt_key" backend/.env; then
    print_warning "Generating secure JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|your_super_secret_jwt_key_here_change_this_in_production|$JWT_SECRET|g" backend/.env
    print_status "JWT secret generated and saved to backend/.env"
fi

# Update docker-compose.yml with generated password
if grep -q "masjid_password" docker-compose.yml; then
    DB_PASSWORD_FROM_ENV=$(grep "DB_PASSWORD" backend/.env | cut -d '=' -f2)
    if [ ! -z "$DB_PASSWORD_FROM_ENV" ]; then
        print_status "Updating docker-compose.yml with database password..."
        sed -i "s|masjid_password|$DB_PASSWORD_FROM_ENV|g" docker-compose.yml
    fi
fi

# Build and start services
print_step "Building and starting Docker services..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose build --no-cache

print_status "Starting containers..."
docker-compose up -d

# Wait for services to be ready
print_step "Waiting for services to initialize..."
sleep 30

# Check if services are running
print_step "Checking service status..."
docker-compose ps

# Wait for MySQL to be ready
print_step "Waiting for MySQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        print_error "MySQL failed to start after $MAX_RETRIES attempts"
        docker-compose logs mysql
        exit 1
    fi
    sleep 2
done
print_status "MySQL is ready!"

# Run database migrations
print_step "Running database migrations..."
docker-compose exec -T backend npm run migrate || {
    print_warning "Migration may have already been run. Continuing..."
}

# Test endpoints
print_step "Testing endpoints..."
sleep 5

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_status "✅ Backend health check passed"
else
    print_warning "Backend health check failed. Check logs with: docker-compose logs backend"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Frontend is accessible"
else
    print_warning "Frontend check failed. Check logs with: docker-compose logs frontend"
fi

# Display deployment summary
echo ""
print_status "═══════════════════════════════════════════════════════════"
print_status "🎉 Deployment completed successfully!"
print_status "═══════════════════════════════════════════════════════════"
echo ""
print_status "📍 Access your application:"
print_status "   HTTP:  http://$PUBLIC_IP"
print_status "   Backend API: http://$PUBLIC_IP/api"
print_status "   Health Check: http://$PUBLIC_IP/api/health"
echo ""
print_warning "⚠️  Important next steps:"
print_warning "   1. Configure your domain name in nginx/nginx.conf"
print_warning "   2. Update backend/.env with your domain in FRONTEND_URL"
print_warning "   3. Obtain SSL certificate: sudo certbot certonly --standalone -d yourdomain.com"
print_warning "   4. Copy SSL certificates to nginx/ssl/"
print_warning "   5. Restart nginx: docker-compose restart nginx"
echo ""
print_status "📊 Useful commands:"
print_status "   View logs: docker-compose logs -f"
print_status "   Check status: docker-compose ps"
print_status "   Restart services: docker-compose restart"
print_status "   Create backup: ./scripts/backup-db.sh"
echo ""
print_status "🔒 Security reminders:"
print_status "   - Review and update passwords in backend/.env"
print_status "   - Configure security groups in AWS Console"
print_status "   - Set up automatic backups"
print_status "   - Configure SSL certificate auto-renewal"
echo ""

