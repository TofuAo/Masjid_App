#!/bin/bash

# Setup Environment Files Script
# This script creates .env files from templates

set -e

echo "🔧 Setting up environment files..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backend .env from template if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[INFO]${NC} Creating backend/.env from template..."
    cp backend/env.production backend/.env
    echo -e "${GREEN}✓${NC} Created backend/.env"
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your production values!${NC}"
else
    echo -e "${GREEN}✓${NC} backend/.env already exists"
fi

# Create frontend .env from template if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[INFO]${NC} Creating .env from template..."
    cp env.production .env
    echo -e "${GREEN}✓${NC} Created .env"
    echo -e "${YELLOW}⚠️  Please edit .env with your production values!${NC}"
else
    echo -e "${GREEN}✓${NC} .env already exists"
fi

echo ""
echo "✅ Environment files setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit backend/.env with your database credentials and JWT secret"
echo "   2. Edit .env with your frontend API URL"
echo "   3. Run ./deploy.sh to deploy the application"

