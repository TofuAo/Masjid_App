#!/bin/bash

# Quick deployment script for MyMasjidApp
# Automatically builds and deploys frontend changes

set -e

echo "🚀 Quick Deploy: Building and deploying frontend..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Rebuild and restart frontend container
echo "🐳 Rebuilding frontend container..."
docker-compose build frontend

echo "🔄 Restarting frontend service..."
docker-compose up -d frontend

# Verify deployment
echo "✅ Verifying deployment..."
sleep 3
docker-compose ps frontend

echo "✨ Deployment complete!"
echo "🌐 Frontend available at: http://localhost:3000"

