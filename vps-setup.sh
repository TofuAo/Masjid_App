#!/bin/bash

# VPS Initial Setup Script for MyMasjidApp
# Run this on your VPS after first login

set -e

echo "🚀 Starting VPS setup for MyMasjidApp..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_status "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y

# Install essential tools
print_status "Installing essential tools..."
apt install -y git curl wget nano ufw htop unattended-upgrades

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    print_warning "Docker already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    docker-compose --version
else
    print_warning "Docker Compose already installed"
fi

# Install Certbot for SSL
print_status "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

# Set timezone to UTC
print_status "Setting timezone to UTC..."
timedatectl set-timezone UTC

# Configure automatic security updates
print_status "Configuring automatic security updates..."
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot-Time "02:00";' >> /etc/apt/apt.conf.d/50unattended-upgrades

# Create app user (optional but recommended)
print_status "Creating application user..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
    print_status "User 'deploy' created. You can switch using: su - deploy"
else
    print_warning "User 'deploy' already exists"
fi

# Add current user to docker group (if not root)
if [ "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    print_status "Added $SUDO_USER to docker group"
fi

# Optimize system
print_status "Optimizing system settings..."

# Increase file descriptor limits
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
EOF

# Optimize kernel parameters for web servers
cat >> /etc/sysctl.conf << EOF
# Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
EOF

sysctl -p

# Clean up
print_status "Cleaning up..."
apt autoremove -y
apt autoclean

# Display summary
echo ""
print_status "═══════════════════════════════════════════════════════════"
print_status "✅ VPS setup completed successfully!"
print_status "═══════════════════════════════════════════════════════════"
echo ""
print_status "Next steps:"
echo ""
print_status "1. Clone your application:"
echo "   git clone https://github.com/yourusername/MyMasjidApp.git"
echo "   cd MyMasjidApp"
echo ""
print_status "2. Configure environment:"
echo "   cp backend/env.production backend/.env"
echo "   nano backend/.env  # Edit configuration"
echo ""
print_status "3. Deploy application:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
echo ""
print_warning "Note: If you added a user to docker group, you may need to:"
print_warning "  - Log out and log back in, OR"
print_warning "  - Use: newgrp docker"
echo ""
print_status "Firewall Status:"
ufw status
echo ""
print_status "Docker Version:"
docker --version
docker-compose --version
echo ""

