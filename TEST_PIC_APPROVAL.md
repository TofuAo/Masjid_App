# PIC Approval System Test Guide

This document explains how to test the PIC (Person In Charge) approval workflow system.

## Overview

The PIC approval system ensures that actions performed by PIC users require admin approval before being executed. This test verifies the complete workflow:

1. **PIC User Creates Request** - When a PIC user performs an action (create/update/delete), it creates a pending approval request
2. **Admin Views Requests** - Admin can see all pending requests in the "Kelulusan PIC" page
3. **Admin Reviews Details** - Admin can view full details of each request including payload and metadata
4. **Admin Approves/Rejects** - Admin can approve or reject requests with optional notes
5. **Action Execution** - When approved, the action is executed using registered handlers
6. **Status Updates** - Request status updates to "approved" or "rejected"

## Prerequisites

1. **Backend must be running** (Docker containers or local server)
2. **Admin user account** - Default: IC `990101010101`, Password `admin123`
3. **PIC user account** - You need to create a PIC user or use an existing one
4. **Test data** - At least one student and class for attendance testing

## Running the Tests

### PowerShell (Windows)

```powershell
# Basic test (will skip PIC-specific tests if credentials not provided)
.\test-pic-approval.ps1

# Full test with PIC credentials
.\test-pic-approval.ps1 -PicIC "PIC001010101" -PicPassword "pic123"

# Custom base URL
.\test-pic-approval.ps1 -BaseUrl "http://localhost:5000/api" -PicIC "PIC001010101" -PicPassword "pic123"
```

### Node.js

```bash
# Install axios if not already installed (it's in dependencies)
npm install

# Run the test
node test-pic-approval.js

# Or with custom API URL
API_BASE_URL=http://localhost:5000/api node test-pic-approval.js
```

## Test Configuration

Update the test credentials in the script:

**PowerShell:** Edit the parameters or pass them as arguments:
```powershell
.\test-pic-approval.ps1 -AdminIC "990101010101" -AdminPassword "admin123" -PicIC "PIC001010101" -PicPassword "pic123"
```

**Node.js:** Edit `TEST_CONFIG` object in `test-pic-approval.js`:
```javascript
const TEST_CONFIG = {
  admin: {
    ic: '990101010101',
    password: 'admin123'
  },
  pic: {
    ic: 'PIC001010101', // Update with actual PIC user
    password: 'pic123'  // Update with actual password
  }
};
```

## What Gets Tested

### ✅ Test Steps

1. **Admin Login** - Verifies admin can log in
2. **PIC Login** - Verifies PIC user can log in
3. **Create PIC Request** - PIC user creates an attendance record (should create pending request)
4. **View Pending Requests** - Admin can see the pending request
5. **View Request Details** - Admin can view full request details
6. **Approve Request** - Admin approves the request (action should execute)
7. **Verify Status** - Confirms request status changed to "approved"
8. **Reject Flow** - Tests the rejection workflow

### Expected Results

**If everything works correctly:**
- ✓ All 8 tests should pass
- PIC requests are created when PIC users perform actions
- Admin can view and manage all requests
- Approving executes the action
- Rejecting marks the request as rejected without execution

**Common Issues:**

1. **PIC Login Fails**
   - **Cause:** PIC user doesn't exist or wrong credentials
   - **Solution:** Create a PIC user or update test credentials

2. **Request Executes Immediately**
   - **Cause:** PIC user might have admin privileges, or middleware not applied
   - **Solution:** Check PIC user role is exactly "pic", verify middleware is applied to routes

3. **Handler Not Found Error**
   - **Cause:** Action handler not registered for the action_key
   - **Solution:** Ensure service files (attendanceService.js, studentService.js, etc.) are imported to register handlers

4. **No Pending Requests Found**
   - **Cause:** No PIC requests have been created yet
   - **Solution:** Create a request as PIC user first, or check if requests exist with different status

## Manual Testing Steps

If automated tests don't work, you can test manually:

### 1. Create a PIC User (if needed)

```sql
-- Insert PIC user (update IC and password hash)
INSERT INTO users (ic, nama, email, password, role, status) 
VALUES ('PIC001010101', 'Test PIC User', 'pic@test.com', '$2a$12$...', 'pic', 'aktif');
```

### 2. Test PIC Request Creation

1. Log in as PIC user
2. Navigate to Attendance page
3. Create a new attendance record
4. **Expected:** Should see message "Permintaan kehadiran dihantar untuk kelulusan admin."
5. **Not Expected:** Record created immediately

### 3. Test Admin Approval

1. Log in as Admin
2. Navigate to "Kelulusan PIC" page
3. **Expected:** See the pending request created by PIC
4. Click on the request to view details
5. **Expected:** See full request details including payload
6. Click "Luluskan" (Approve)
7. **Expected:** Request status changes to "approved", action is executed

### 4. Verify Action Execution

1. After approval, check if the attendance record was created
2. **Expected:** Attendance record exists in the database
3. Check the request status in "Kelulusan PIC"
4. **Expected:** Status shows "Diluluskan" (Approved)

## Troubleshooting

### Check Backend Logs

```bash
# View backend logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

### Check Database

```sql
-- View pending PIC changes
SELECT * FROM pending_pic_changes ORDER BY created_at DESC;

-- Check if handlers are registered (check service files are imported)
-- Handlers are registered when service files are imported in routes
```

### Verify Middleware

Check that `requirePicApproval` middleware is applied to routes:
- `backend/routes/attendance.js`
- `backend/routes/students.js`
- `backend/routes/announcements.js`

### Verify Handlers

Check that handlers are registered:
- `backend/services/attendanceService.js` - Registers attendance handlers
- `backend/services/studentService.js` - Registers student handlers
- `backend/services/announcementService.js` - Registers announcement handlers

## Test Results Interpretation

### All Tests Pass ✓
- System is working correctly
- PIC approval workflow is functional
- All handlers are registered
- Middleware is properly applied

### Some Tests Fail ✗

**Admin/PIC Login Fails:**
- Check credentials
- Verify users exist in database
- Check backend is running

**Create Request Fails:**
- PIC user might have admin privileges
- Middleware might not be applied
- Check backend logs for errors

**View Requests Fails:**
- Check admin token is valid
- Verify route is accessible: `/api/pending-pic-changes`
- Check database table exists

**Approve/Reject Fails:**
- Handler might not be registered
- Check error message for specific issue
- Verify action_key matches registered handler

## Additional Notes

- The test creates actual database records (attendance)
- You may want to clean up test data after testing
- PIC users can only create requests, not execute actions directly
- Admin users bypass the approval system
- Handlers must be registered before approval can work

## Support

If tests fail, check:
1. Backend logs for errors
2. Database for pending_pic_changes table
3. User roles in database
4. Route middleware configuration
5. Handler registration in service files

