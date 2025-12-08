#!/bin/bash
# Auto-deploy script for MyMasjidApp
# This ensures all changes are deployed to the running containers

echo "=========================================="
echo "Deploying Changes to Production"
echo "=========================================="

# Step 1: Build frontend for production
echo ""
echo "Step 1: Building frontend for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Step 2: Rebuild frontend Docker container
echo ""
echo "Step 2: Rebuilding frontend Docker container..."
docker-compose build frontend

if [ $? -ne 0 ]; then
    echo "❌ Frontend container build failed!"
    exit 1
fi

# Step 3: Restart frontend container
echo ""
echo "Step 3: Restarting frontend container..."
docker-compose up -d frontend

if [ $? -ne 0 ]; then
    echo "❌ Frontend container restart failed!"
    exit 1
fi

# Step 4: Restart backend container (for backend changes)
echo ""
echo "Step 4: Restarting backend container..."
docker-compose restart backend

if [ $? -ne 0 ]; then
    echo "❌ Backend container restart failed!"
    exit 1
fi

# Step 5: Verify deployment
echo ""
echo "Step 5: Verifying deployment..."
sleep 3
docker-compose ps

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Services status:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}"

