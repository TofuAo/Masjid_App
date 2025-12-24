# Quick PIC Approval Test

## Quick Start

### PowerShell (Windows)
```powershell
# Test with existing PIC user
.\test-pic-approval.ps1 -PicIC "YOUR_PIC_IC" -PicPassword "YOUR_PIC_PASSWORD"
```

### Node.js
```bash
# Edit test-pic-approval.js to set PIC credentials, then:
node test-pic-approval.js
```

## What It Tests

1. ✓ Admin can log in
2. ✓ PIC user can log in  
3. ✓ PIC creates a request (attendance)
4. ✓ Admin sees pending requests
5. ✓ Admin views request details
6. ✓ Admin approves request
7. ✓ Request status updates correctly
8. ✓ Rejection flow works

## Expected Output

```
========================================
   PIC Approval Workflow Test
========================================

→ Step 1: Logging in as Admin...
✓ Admin logged in: Admin Name

→ Step 2: Logging in as PIC user...
✓ PIC logged in: PIC Name

→ Step 3: PIC user creating attendance request...
✓ PIC request created successfully
ℹ Pending ID: 123
ℹ Message: Permintaan kehadiran dihantar untuk kelulusan admin.

→ Step 4: Admin viewing pending PIC requests...
✓ Found 1 pending request(s)

→ Step 5: Admin viewing details for request 123...
✓ Request details retrieved

→ Step 6: Admin approving request 123...
✓ Request approved successfully

→ Step 7: Verifying request 123 status is approved...
✓ Request status is approved as expected

→ Step 8: Testing rejection flow...
✓ Request rejected successfully

========================================
   Test Results Summary
========================================
Admin Login:        ✓
PIC Login:          ✓
Create Request:     ✓
View Requests:      ✓
View Details:       ✓
Approve Request:    ✓
Verify Status:      ✓
Reject Flow:        ✓
========================================

Passed: 8/8 tests
✓ All tests passed! PIC approval system is working correctly.
```

## Troubleshooting

**If PIC login fails:**
- Create a PIC user first
- Or update test script with existing PIC credentials

**If request executes immediately:**
- PIC user might have admin role
- Check user role in database: `SELECT ic, role FROM users WHERE ic = 'PIC_IC'`

**If handler not found:**
- Check backend logs
- Verify service files are imported in routes
- Check action_key matches registered handler

