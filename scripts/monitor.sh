#!/bin/bash

# Monitoring Script for MyMasjidApp
# This script monitors the health of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 MyMasjidApp Health Check${NC}"
echo "=================================="
echo ""

# Check Docker containers
echo -e "${BLUE}🐳 Docker Containers:${NC}"
if command -v docker &> /dev/null; then
    if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "masjid|NAME"; then
        echo ""
        # Check each service
        SERVICES=("masjid_mysql" "masjid_backend" "masjid_frontend" "masjid_nginx")
        for SERVICE in "${SERVICES[@]}"; do
            if docker ps --format "{{.Names}}" | grep -q "^${SERVICE}$"; then
                STATUS=$(docker inspect --format='{{.State.Status}}' ${SERVICE})
                if [ "$STATUS" = "running" ]; then
                    echo -e "  ${GREEN}✓${NC} ${SERVICE}: ${STATUS}"
                else
                    echo -e "  ${RED}✗${NC} ${SERVICE}: ${STATUS}"
                fi
            else
                echo -e "  ${RED}✗${NC} ${SERVICE}: not found"
            fi
        done
    else
        echo -e "  ${RED}✗${NC} No containers found"
    fi
else
    echo -e "  ${RED}✗${NC} Docker not installed"
fi

echo ""

# Check Backend Health
echo -e "${BLUE}🔌 Backend API:${NC}"
if command -v curl &> /dev/null; then
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null || echo "000")
    if [ "$BACKEND_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Backend is healthy (HTTP ${BACKEND_STATUS})"
        curl -s http://localhost:5000/health | python3 -m json.tool 2>/dev/null || echo "  Response received"
    else
        echo -e "  ${RED}✗${NC} Backend is not responding (HTTP ${BACKEND_STATUS})"
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  curl not available, skipping health check"
fi

echo ""

# Check Database Connection
echo -e "${BLUE}🗄️  Database:${NC}"
if command -v docker &> /dev/null && docker ps --format "{{.Names}}" | grep -q "masjid_mysql"; then
    DB_CHECK=$(docker exec masjid_mysql mysqladmin ping -h localhost --silent 2>/dev/null && echo "OK" || echo "FAIL")
    if [ "$DB_CHECK" = "OK" ]; then
        echo -e "  ${GREEN}✓${NC} MySQL is running and accepting connections"
        
        # Get database size
        DB_SIZE=$(docker exec masjid_mysql mysql -u masjid_user -pmasjid_password -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='masjid_app';" 2>/dev/null | tail -1)
        if [ ! -z "$DB_SIZE" ]; then
            echo -e "  ${BLUE}  Database size: ${DB_SIZE} MB${NC}"
        fi
    else
        echo -e "  ${RED}✗${NC} MySQL is not responding"
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  MySQL container not found"
fi

echo ""

# Check Frontend
echo -e "${BLUE}🌐 Frontend:${NC}"
if command -v curl &> /dev/null; then
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "304" ]; then
        echo -e "  ${GREEN}✓${NC} Frontend is accessible (HTTP ${FRONTEND_STATUS})"
    else
        echo -e "  ${RED}✗${NC} Frontend is not responding (HTTP ${FRONTEND_STATUS})"
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  curl not available, skipping check"
fi

echo ""

# Check Nginx
echo -e "${BLUE}🔀 Nginx:${NC}"
if command -v curl &> /dev/null; then
    NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
    if [ "$NGINX_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Nginx is running and routing correctly"
    else
        echo -e "  ${YELLOW}⚠${NC}  Nginx health check returned HTTP ${NGINX_STATUS}"
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  curl not available, skipping check"
fi

echo ""

# Check Disk Space
echo -e "${BLUE}💾 System Resources:${NC}"
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}')
    echo -e "  ${BLUE}Disk usage: ${DISK_USAGE}${NC}"
fi

if command -v free &> /dev/null; then
    MEM_USAGE=$(free -h | grep Mem | awk '{print $3 "/" $2}')
    echo -e "  ${BLUE}Memory usage: ${MEM_USAGE}${NC}"
fi

echo ""

# Check Logs for Errors
echo -e "${BLUE}📝 Recent Errors (last 5 lines):${NC}"
if [ -f "nginx/logs/error.log" ]; then
    ERROR_COUNT=$(tail -100 nginx/logs/error.log | grep -i error | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "  ${YELLOW}⚠${NC}  Found ${ERROR_COUNT} errors in nginx error log"
        echo "  Last errors:"
        tail -5 nginx/logs/error.log | sed 's/^/    /'
    else
        echo -e "  ${GREEN}✓${NC} No recent errors in nginx logs"
    fi
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Health check completed!${NC}"
echo ""
echo "For detailed logs, run: docker-compose logs [service_name]"

