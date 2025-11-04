#!/bin/bash

# SSL Certificate Setup Script using Certbot
# This script automates SSL certificate setup with Let's Encrypt

set -e

echo "🔒 Setting up SSL certificates..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}[ERROR]${NC} Please run as root (use sudo)"
    exit 1
fi

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}[ERROR]${NC} Usage: sudo ./setup-ssl.sh yourdomain.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@${DOMAIN}}

echo -e "${GREEN}[INFO]${NC} Domain: ${DOMAIN}"
echo -e "${GREEN}[INFO]${NC} Email: ${EMAIL}"

# Check if Certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily if using system nginx
if systemctl is-active --quiet nginx; then
    echo -e "${YELLOW}[INFO]${NC} Stopping system Nginx..."
    systemctl stop nginx
fi

# Update nginx configuration with domain before getting certificates
if [ -f "nginx/nginx.conf" ]; then
    echo -e "${GREEN}[INFO]${NC} Updating nginx configuration with domain..."
    sed -i "s/yourdomain.com/${DOMAIN}/g" nginx/nginx.conf
    sed -i "s/www.yourdomain.com/www.${DOMAIN}/g" nginx/nginx.conf
fi

# Copy nginx config to system if not using Docker
if [ ! -d "/etc/nginx/sites-available" ]; then
    echo -e "${YELLOW}[INFO]${NC} Nginx sites-available directory not found. Using Docker setup."
    DOCKER_SETUP=true
else
    DOCKER_SETUP=false
    cp nginx/nginx.conf /etc/nginx/sites-available/masjid-app
    ln -sf /etc/nginx/sites-available/masjid-app /etc/nginx/sites-enabled/
    nginx -t
    systemctl start nginx
fi

# Obtain SSL certificate
echo -e "${GREEN}[INFO]${NC} Obtaining SSL certificate from Let's Encrypt..."

if [ "$DOCKER_SETUP" = true ]; then
    # For Docker setup, use standalone mode
    certbot certonly --standalone \
        --preferred-challenges http \
        -d ${DOMAIN} \
        -d www.${DOMAIN} \
        --email ${EMAIL} \
        --agree-tos \
        --non-interactive \
        --expand
else
    # For system nginx setup
    certbot --nginx \
        -d ${DOMAIN} \
        -d www.${DOMAIN} \
        --email ${EMAIL} \
        --agree-tos \
        --non-interactive \
        --expand
fi

# Copy certificates to nginx/ssl directory for Docker
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo -e "${GREEN}[INFO]${NC} Copying certificates to nginx/ssl directory..."
    mkdir -p nginx/ssl
    cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem nginx/ssl/key.pem
    chmod 600 nginx/ssl/*.pem
    echo -e "${GREEN}✓${NC} Certificates copied"
fi

# Update nginx configuration with certificate paths
if [ -f "nginx/nginx.conf" ]; then
    echo -e "${GREEN}[INFO]${NC} Updating nginx configuration with certificate paths..."
    sed -i "s|/etc/nginx/ssl/cert.pem|nginx/ssl/cert.pem|g" nginx/nginx.conf
    sed -i "s|/etc/nginx/ssl/key.pem|nginx/ssl/key.pem|g" nginx/nginx.conf
fi

# Set up automatic renewal
echo -e "${GREEN}[INFO]${NC} Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'docker-compose restart nginx 2>/dev/null || systemctl reload nginx'") | crontab -

echo ""
echo -e "${GREEN}✅ SSL certificate setup completed!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Verify your nginx/nginx.conf has the correct domain and certificate paths"
echo "   2. Restart your Docker containers: docker-compose restart nginx"
echo "   3. Or reload system nginx: sudo systemctl reload nginx"
echo "   4. Test your SSL: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"

