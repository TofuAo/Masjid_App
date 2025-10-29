#!/bin/bash

# MyMasjidApp Monitoring Script
# This script monitors the health of the application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi

# Check container status
print_status "Checking container status..."
docker-compose ps

# Check if all containers are running
if ! docker-compose ps | grep -q "Up"; then
    print_error "Some containers are not running"
    exit 1
fi

# Check backend health
print_status "Checking backend health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    print_status "Backend is healthy"
else
    print_error "Backend health check failed (HTTP $BACKEND_HEALTH)"
fi

# Check frontend
print_status "Checking frontend..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    print_status "Frontend is healthy"
else
    print_error "Frontend health check failed (HTTP $FRONTEND_HEALTH)"
fi

# Check database
print_status "Checking database..."
if docker-compose exec mysql mysqladmin ping -h localhost --silent; then
    print_status "Database is healthy"
else
    print_error "Database health check failed"
fi

# Check disk space
print_status "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "Disk usage is high: ${DISK_USAGE}%"
else
    print_status "Disk usage is normal: ${DISK_USAGE}%"
fi

# Check memory usage
print_status "Checking memory usage..."
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    print_warning "Memory usage is high: ${MEMORY_USAGE}%"
else
    print_status "Memory usage is normal: ${MEMORY_USAGE}%"
fi

# Show recent logs
print_status "Recent application logs:"
docker-compose logs --tail=10

print_status "Monitoring completed"
