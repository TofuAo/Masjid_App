#!/bin/bash

# AWS EC2 Initial Setup Script
# This script can be used as EC2 User Data or run manually after instance launch

set -e

echo "🚀 Starting AWS EC2 setup for MyMasjidApp..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential tools
echo "📦 Installing essential tools..."
sudo apt install -y git curl wget nano ufw htop

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER || sudo usermod -aG docker ubuntu
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create app directory
echo "📁 Creating application directory..."
mkdir -p ~/MyMasjidApp
cd ~/MyMasjidApp

# Set timezone (optional)
sudo timedatectl set-timezone UTC

# Enable automatic security updates
echo "🔒 Configuring automatic security updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

# Install CloudWatch agent (optional)
echo "📊 Installing CloudWatch agent..."
if ! command -v amazon-cloudwatch-agent &> /dev/null; then
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb
    sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb || true
fi

# Clean up
echo "🧹 Cleaning up..."
sudo apt autoremove -y
sudo apt autoclean

echo "✅ AWS EC2 setup completed!"
echo ""
echo "Next steps:"
echo "1. Clone your application: git clone <your-repo> ~/MyMasjidApp"
echo "2. Configure environment: cd ~/MyMasjidApp && cp backend/env.production backend/.env"
echo "3. Edit configuration files: nano backend/.env"
echo "4. Deploy: ./deploy.sh"

