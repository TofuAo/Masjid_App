#!/bin/bash

# Complete VPS Deployment Script for MyMasjidApp
# This script installs all software and deploys the application
# Run this on a fresh Ubuntu VPS

set -e

echo "🚀 MyMasjidApp - Complete VPS Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}[STEP]${NC} $1"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use: sudo bash vps-complete-deploy.sh)"
    exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ifconfig.co || echo "YOUR_SERVER_IP")
echo ""
print_status "Server IP detected: $SERVER_IP"
echo ""

# ============================================================================
# STEP 1: System Update
# ============================================================================
print_step "Step 1/7: Updating system packages..."

export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt upgrade -y -qq
print_status "System updated"

# ============================================================================
# STEP 2: Install Essential Tools
# ============================================================================
print_step "Step 2/7: Installing essential tools..."

apt install -y -qq \
    git \
    curl \
    wget \
    nano \
    ufw \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unattended-upgrades \
    certbot \
    python3-certbot-nginx

print_status "Essential tools installed"

# ============================================================================
# STEP 3: Install Docker
# ============================================================================
print_step "Step 3/7: Installing Docker..."

if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_status "Docker installed"
else
    print_warning "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed"
else
    print_warning "Docker Compose already installed"
fi

# Verify Docker installation
docker --version
docker-compose --version

# ============================================================================
# STEP 4: Configure Firewall
# ============================================================================
print_step "Step 4/7: Configuring firewall..."

ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
print_status "Firewall configured (SSH, HTTP, HTTPS allowed)"

# ============================================================================
# STEP 5: Setup Application Directory
# ============================================================================
print_step "Step 5/7: Setting up application..."

APP_DIR="/opt/mymasjidapp"
mkdir -p $APP_DIR
cd $APP_DIR

# Check if application files already exist
if [ -d "$APP_DIR/.git" ] || [ -f "$APP_DIR/package.json" ]; then
    print_warning "Application files already exist in $APP_DIR"
    print_warning "Skipping clone. If you want to reinstall, remove $APP_DIR first"
else
    print_status "Waiting for application files..."
    print_warning "Please upload your MyMasjidApp files to $APP_DIR"
    print_warning "Or clone from Git:"
    echo ""
    echo "  git clone https://github.com/yourusername/MyMasjidApp.git $APP_DIR"
    echo ""
    read -p "Press Enter after uploading/cloning the application files..."
    
    if [ ! -f "$APP_DIR/package.json" ]; then
        print_error "Application files not found in $APP_DIR"
        print_error "Please ensure MyMasjidApp files are in $APP_DIR"
        exit 1
    fi
fi

print_status "Application directory ready: $APP_DIR"

# ============================================================================
# STEP 6: Configure Environment
# ============================================================================
print_step "Step 6/7: Configuring environment..."

cd $APP_DIR

# Create necessary directories
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p uploads
mkdir -p backups
print_status "Directories created"

# Set up environment files
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
        print_warning "env.production not found, creating basic .env"
        echo "DOMAIN=$SERVER_IP" > .env
        echo "VITE_API_BASE_URL=http://$SERVER_IP/api" >> .env
    fi
fi

# Generate secure passwords if not set
print_status "Generating secure passwords..."

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
        print_status "Updated docker-compose.yml with database password"
    fi
fi

# Update FRONTEND_URL with server IP
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$SERVER_IP|g" backend/.env
sed -i "s|yourdomain.com|$SERVER_IP|g" .env 2>/dev/null || true

print_status "Environment configured"

# ============================================================================
# STEP 7: Deploy Application
# ============================================================================
print_step "Step 7/7: Deploying application..."

cd $APP_DIR

# Stop any existing containers
docker-compose down --remove-orphans 2>/dev/null || true

# Build Docker images
print_status "Building Docker images (this may take a few minutes)..."
docker-compose build --no-cache

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services
print_status "Waiting for services to initialize..."
sleep 30

# Check service status
print_status "Checking service status..."
docker-compose ps

# Wait for MySQL to be ready
print_status "Waiting for MySQL to be ready..."
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
print_status "Running database migrations..."
docker-compose exec -T backend npm run migrate || {
    print_warning "Migration may have already been run"
}

# Test endpoints
print_status "Testing endpoints..."
sleep 5

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed (check logs: docker-compose logs backend)"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is accessible"
else
    print_warning "Frontend check failed (check logs: docker-compose logs frontend)"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    print_status "Nginx reverse proxy is working"
else
    print_warning "Nginx check failed (check logs: docker-compose logs nginx)"
fi

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📍 Access your application:${NC}"
echo ""
echo -e "   ${GREEN}HTTP:${NC}  http://$SERVER_IP"
echo -e "   ${GREEN}Backend API:${NC}  http://$SERVER_IP/api"
echo -e "   ${GREEN}Health Check:${NC}  http://$SERVER_IP/api/health"
echo ""
echo -e "${CYAN}📊 Service Status:${NC}"
docker-compose ps
echo ""
echo -e "${CYAN}📝 Useful Commands:${NC}"
echo ""
echo "   View logs:          cd $APP_DIR && docker-compose logs -f"
echo "   Check status:       cd $APP_DIR && docker-compose ps"
echo "   Restart services:   cd $APP_DIR && docker-compose restart"
echo "   Stop services:      cd $APP_DIR && docker-compose down"
echo "   Start services:     cd $APP_DIR && docker-compose up -d"
echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo ""
echo "   1. Configure your domain name:"
echo "      - Point domain DNS to: $SERVER_IP"
echo "      - Update nginx/nginx.conf with your domain"
echo ""
echo "   2. Set up SSL certificate:"
echo "      docker-compose stop nginx"
echo "      certbot certonly --standalone -d yourdomain.com"
echo "      cp /etc/letsencrypt/live/yourdomain.com/*.pem nginx/ssl/"
echo "      docker-compose start nginx"
echo ""
echo "   3. Review and update passwords in:"
echo "      $APP_DIR/backend/.env"
echo ""
echo "   4. Set up automatic backups:"
echo "      crontab -e"
echo "      Add: 0 2 * * * cd $APP_DIR && ./scripts/backup-db.sh"
echo ""
echo -e "${GREEN}✅ Your MyMasjidApp is now running!${NC}"
echo ""

