# Staff Check-In/Check-Out Feature Setup

## Overview
This feature allows staff members (teachers and admins) to check in and check out with geolocation validation. Staff must be within 500 meters of the masjid to successfully check in or check out.

## Database Migration Required

**IMPORTANT**: You need to run the database migration before using this feature.

### Step 1: Run the Migration SQL

Run the following SQL file in your database:
```bash
database/migration_add_staff_checkin.sql
```

Or manually execute the SQL in your database management tool (phpMyAdmin, MySQL Workbench, etc.).

### Step 2: Configure Masjid Location

After running the migration, you need to set the masjid location coordinates in the settings table:

1. Go to Settings page in the admin panel
2. Update the following settings:
   - `masjid_latitude`: The latitude coordinate of the masjid (e.g., 3.8157)
   - `masjid_longitude`: The longitude coordinate of the masjid (e.g., 103.3239)
   - `masjid_checkin_radius`: Maximum distance in meters (default: 500)

Alternatively, you can update these directly in the database:
```sql
UPDATE settings SET setting_value = 'YOUR_LATITUDE' WHERE setting_key = 'masjid_latitude';
UPDATE settings SET setting_value = 'YOUR_LONGITUDE' WHERE setting_key = 'masjid_longitude';
UPDATE settings SET setting_value = '500' WHERE setting_key = 'masjid_checkin_radius';
```

## Features

### For Staff Members (Teachers & Admins)
1. **Check-In**: Staff can check in when they arrive at the masjid
   - Requires location permission
   - Must be within 500m radius of the masjid
   - Records timestamp and location coordinates
   - Can only check in once per day (must check out first)

2. **Check-Out**: Staff can check out when they leave
   - Requires location permission
   - Must be within 500m radius of the masjid
   - Records timestamp and location coordinates
   - Can only check out if they have checked in today

3. **View History**: Staff can view their own check-in history
   - Shows check-in and check-out times
   - Shows status (checked in / checked out)

### For Admins
- Can view all staff check-in records
- Can filter by staff member and date range
- Can see all check-in history

## API Endpoints

### POST `/api/staff-checkin/check-in`
Check in for the day
- **Body**: `{ latitude: number, longitude: number }`
- **Response**: Check-in record with distance from masjid

### POST `/api/staff-checkin/check-out`
Check out for the day
- **Body**: `{ latitude: number, longitude: number }`
- **Response**: Check-out record with distance from masjid

### GET `/api/staff-checkin/today-status`
Get today's check-in status
- **Response**: Current status and today's record if exists

### GET `/api/staff-checkin/history`
Get check-in history
- **Query Params**: 
  - `startDate` (optional): Filter start date
  - `endDate` (optional): Filter end date
  - `staff_ic` (optional, admin only): Filter by staff IC
- **Response**: List of check-in records

## Database Schema

### staff_checkin Table
- `id`: Primary key
- `staff_ic`: Foreign key to users table
- `check_in_time`: Timestamp of check-in
- `check_out_time`: Timestamp of check-out
- `check_in_latitude`: Latitude at check-in
- `check_in_longitude`: Longitude at check-in
- `check_out_latitude`: Latitude at check-out
- `check_out_longitude`: Longitude at check-out
- `status`: Enum ('checked_in', 'checked_out')
- `distance_from_masjid`: Distance in meters from masjid
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

## Access Control

- **Staff (teachers and admins)**: Can check in/out and view their own history
- **Admins**: Can view all staff check-in records
- **Students**: Cannot access check-in functionality

## Navigation

The "Check In / Out" menu item appears in the sidebar for:
- Admin users
- Teacher users

It is accessible at: `/staff-checkin`

## Notes

1. **Location Permission**: Users must grant location permissions in their browser for the feature to work
2. **Geolocation Accuracy**: The system uses high-accuracy GPS when available
3. **Distance Calculation**: Uses Haversine formula for accurate distance calculation
4. **Timezone**: All timestamps are stored in server timezone

## Troubleshooting

### "Location access denied" error
- Ensure browser location permissions are enabled
- Check if the site is accessed over HTTPS (required for geolocation in most browsers)

### "You are too far from the masjid" error
- Verify masjid coordinates are correctly set in settings
- Check if you're actually within 500m of the masjid
- Try refreshing location

### "Masjid location not configured" error
- Admin needs to set masjid latitude and longitude in settings
- Check settings table in database

