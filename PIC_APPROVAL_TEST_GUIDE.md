# PIC Approval System Test Guide

This guide will help you test the complete PIC approval flow for attendance operations.

## Prerequisites

1. **PIC User Account** - A user with role 'pic'
2. **Admin User Account** - A user with role 'admin'
3. **Test Data**:
   - At least one class exists
   - At least one student exists
   - Student is enrolled in the class

## Test 1: PIC Creates Single Attendance Record

### Steps:

1. **Login as PIC User**
   ```bash
   # Use your PIC credentials to log in
   ```

2. **Create Attendance Request**
   - Navigate to Attendance page
   - Fill in:
     - Student IC
     - Class ID
     - Date
     - Status (Hadir/Tidak Hadir/Cuti)
   - Submit the form

3. **Expected Result:**
   - ✅ Should receive message: "Permintaan kehadiran dihantar untuk kelulusan admin."
   - ✅ Status code: 202 (Accepted)
   - ✅ Response includes `pendingApproval: true` and `pendingId`

4. **Check Pending Approvals (as Admin)**
   - Login as admin
   - Navigate to "Kelulusan PIC" (PIC Approvals) page
   - Should see the pending request with:
     - Action: `attendance:create`
     - Summary with student IC and class info
     - Status: "Menunggu Kelulusan" (Pending)

5. **Approve the Request**
   - Click on the pending request
   - Click "Luluskan" (Approve) button
   - Optionally add notes
   - Confirm approval

6. **Verify Result:**
   - ✅ Request status changes to "Diluluskan" (Approved)
   - ✅ Attendance record should now exist in database
   - ✅ Check attendance list - the record should appear

7. **Reject Test (Optional)**
   - Create another attendance request as PIC
   - As admin, reject it
   - ✅ Verify attendance record was NOT created

---

## Test 2: PIC Updates Attendance Record

### Steps:

1. **Create Test Attendance (as Admin/Teacher)**
   - First create an attendance record (so we have something to update)
   - Note the attendance record ID

2. **Login as PIC User**

3. **Update Attendance Request**
   - Use PUT request to `/api/attendance/:id`
   - Change status to different value
   - Submit

4. **Expected Result:**
   - ✅ Message: "Permintaan kemaskini kehadiran dihantar untuk kelulusan admin."
   - ✅ Status code: 202

5. **Approve as Admin**
   - Navigate to PIC Approvals page
   - Find the update request
   - Approve it

6. **Verify Result:**
   - ✅ Attendance record status should be updated
   - ✅ Original status should be changed to new status

---

## Test 3: PIC Deletes Attendance Record

### Steps:

1. **Create Test Attendance (as Admin/Teacher)**
   - Create an attendance record to delete
   - Note the attendance record ID

2. **Login as PIC User**

3. **Delete Attendance Request**
   - Use DELETE request to `/api/attendance/:id`
   - Submit

4. **Expected Result:**
   - ✅ Message: "Permintaan padam kehadiran dihantar untuk kelulusan admin."
   - ✅ Status code: 202

5. **Approve as Admin**
   - Navigate to PIC Approvals page
   - Find the delete request
   - Approve it

6. **Verify Result:**
   - ✅ Attendance record should be deleted
   - ✅ Snapshot should be created in Recycle Bin (admin_action_snapshots table)

---

## Test 4: PIC Creates Bulk Attendance

### Steps:

1. **Login as PIC User**

2. **Create Bulk Attendance Request**
   - Use POST request to `/api/attendance/bulk`
   - Send:
     ```json
     {
       "class_id": 1,
       "tarikh": "2024-01-15",
       "attendance_data": [
         {"student_ic": "123456789012", "status": "Hadir"},
         {"student_ic": "123456789013", "status": "Tidak Hadir"}
       ]
     }
     ```

3. **Expected Result:**
   - ✅ Message: "Permintaan kehadiran bulk dihantar untuk kelulusan admin."
   - ✅ Status code: 202

4. **Approve as Admin**
   - Navigate to PIC Approvals page
   - Find the bulk create request
   - Verify metadata shows record count
   - Approve it

5. **Verify Result:**
   - ✅ All attendance records in the bulk request should be created
   - ✅ Check attendance list - all records should appear

---

## Test 5: PIC Creates Bulk Attendance with Proof

### Steps:

1. **Login as PIC User**

2. **Create Bulk Attendance with Proof Request**
   - Use POST request to `/api/attendance/bulk-with-proof`
   - Include FormData with:
     - `class_id`: 1
     - `tarikh`: "2024-01-15"
     - `attendance_data`: JSON array
     - `proof_image`: File upload

3. **Expected Result:**
   - ✅ Message: "Permintaan kehadiran bulk dengan bukti dihantar untuk kelulusan admin."
   - ✅ Status code: 202
   - ✅ File should be uploaded to `uploads/` directory

4. **Approve as Admin**
   - Navigate to PIC Approvals page
   - Find the bulk create with proof request
   - Verify metadata shows `has_proof: true`
   - Approve it

5. **Verify Result:**
   - ✅ All attendance records should be created
   - ✅ All records should have the proof_image path set
   - ✅ File should still exist in uploads directory

---

## Test 6: Admin/Teacher Bypass (No Approval Needed)

### Steps:

1. **Login as Admin or Teacher**

2. **Create/Update/Delete Attendance**
   - Perform any attendance operation

3. **Expected Result:**
   - ✅ Operation should execute immediately
   - ✅ No pending approval created
   - ✅ Status code: 200 or 201 (not 202)
   - ✅ Response does NOT include `pendingApproval: true`

4. **Verify**
   - ✅ Check PIC Approvals page - no new pending requests
   - ✅ Check attendance - changes should be applied immediately

---

## Database Verification Queries

### Check Pending PIC Changes:
```sql
SELECT * FROM pending_pic_changes 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### Check Approved Changes:
```sql
SELECT * FROM pending_pic_changes 
WHERE status = 'approved' 
ORDER BY approved_at DESC 
LIMIT 10;
```

### Check Attendance Records:
```sql
SELECT * FROM attendance 
ORDER BY created_at DESC 
LIMIT 20;
```

### Check Recycle Bin Snapshots (for deletions):
```sql
SELECT * FROM admin_action_snapshots 
WHERE entity_type = 'attendance' 
AND operation = 'delete' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Common Issues and Solutions

### Issue: Handler not found error
**Error:** `No handler registered for action attendance:bulk-create`
**Solution:** 
- Ensure `attendanceService.js` is imported in `attendance.js` routes
- Restart the backend server
- Check that handlers are registered (should happen on server startup)

### Issue: PIC requests are executing immediately
**Solution:**
- Verify user role is actually 'pic' in database
- Check middleware order in routes (requirePicApproval should be before controller)
- Check middleware is checking `req.user?.role !== 'pic'` correctly

### Issue: Bulk approval fails
**Solution:**
- Verify attendance_data is properly formatted JSON array
- Check that all student_ic values are valid
- Verify class_id exists
- Check database transaction logs

### Issue: File not found after approval (bulk-with-proof)
**Solution:**
- Verify file was uploaded before approval (check uploads directory)
- Check file path is correctly stored in pending change payload
- Verify handler uses the file path from payload

---

## Success Criteria

✅ All PIC requests require admin approval  
✅ Admin/Teacher requests execute immediately  
✅ Approvals execute handlers correctly  
✅ Rejections prevent operations  
✅ Bulk operations work with approval  
✅ File uploads work with bulk operations  
✅ Deletions create snapshots for Recycle Bin  
✅ All handlers are registered and functional  

