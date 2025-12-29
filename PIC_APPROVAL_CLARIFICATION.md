# PIC Approval System - Clarification

## System Flow

### PIC Users (Person In Charge)
1. **PIC performs CRUD operation** → Request is intercepted by `requirePicApproval` middleware
2. **Request goes to "Kelulusan PIC"** → Stored in `pending_pic_changes` table
3. **Admin reviews** → Admin can approve or reject in PIC Approvals page
4. **On approval** → Handler executes the operation (NO snapshot created - this is a PIC action)
5. **On rejection** → Operation is NOT executed

**Important:** PIC actions do NOT create snapshots in tong sampah (Recycle Bin)

### Admin/Teacher Users
1. **Admin/Teacher performs CRUD operation** → Request bypasses approval middleware
2. **Controller executes directly** → Operation happens immediately
3. **Snapshot created** → Stored in `admin_action_snapshots` table (tong sampah/Recycle Bin)
4. **Available in Recycle Bin** → Admin can undo actions

**Important:** Only direct admin/teacher actions create snapshots (tong sampah)

## Key Points

✅ **Kelulusan PIC** (`pending_pic_changes`) = PIC approval queue (waiting for admin approval)  
✅ **Tong Sampah** (`admin_action_snapshots`) = Recycle Bin (only for admin actions)  
✅ PIC actions → Go to Kelulusan PIC → Admin approves → Execute (no snapshot)  
✅ Admin actions → Execute directly → Create snapshot (tong sampah)  

## Implementation Details

### Middleware Flow
- `requirePicApproval` middleware checks if `req.user?.role === 'pic'`
- If PIC: Creates pending approval record, returns 202 (no controller execution)
- If Admin/Teacher: Calls `next()` (continues to controller)

### Snapshot Creation
- **Controllers:** Only create snapshots for `role === 'admin' || role === 'teacher'`
- **PIC Approval Handlers:** Do NOT create snapshots (PIC actions, not admin actions)
- **Tong Sampah:** Only contains snapshots from direct admin/teacher actions

### Why No Snapshots for PIC Actions?
- PIC actions require approval (they go to Kelulusan PIC)
- When approved, it's still considered a PIC-initiated action
- Tong sampah (Recycle Bin) is only for direct admin actions
- If admin wants to undo a PIC-approved action, they can reject it in Kelulusan PIC before approval, or use other methods after approval

