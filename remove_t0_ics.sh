#!/bin/bash

echo "========================================"
echo "Removing Invalid T0-prefixed IC Numbers"
echo "========================================"
echo ""
echo "This will remove all IC numbers starting with 'T0' from the database."
echo "These are invalid phone-number format ICs."
echo ""
read -p "Press Enter to continue..."

echo "Running SQL cleanup script..."
docker-compose exec -T mysql mysql -u masjid_user -pmasjid_password masjid_app < database/remove_all_t0_ics.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "Cleanup completed successfully!"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "Error occurred during cleanup!"
    echo "========================================"
fi

