# Emergency Shutdown & Maintenance Mode Guide

**Last Updated:** December 15, 2025  
**Version:** 1.0.0  
**Status:** ✅ Deployed & Operational

---

## 🚨 Overview

MyMasjidApp now has a comprehensive **Emergency Shutdown** and **Maintenance Mode** system that allows administrators to control system access during emergencies, scheduled maintenance, or when critical issues arise.

---

## 🎯 Features

### 1. **Emergency Shutdown** 🚨
- **Complete system lockdown** - only admins can access
- Immediate activation
- Used for critical security issues, data breaches, or system failures
- All non-admin users are blocked

### 2. **Maintenance Mode** ⚠️
- **Read-only access** for regular users
- Full admin access maintained
- Used for scheduled maintenance, updates, or non-critical repairs
- Users can view data but cannot make changes

### 3. **Read-Only Mode** ℹ️
- **No write operations** allowed for anyone
- System-wide read-only state
- Used for database migrations, backups, or data integrity checks
- Everyone (including admins) limited to read operations only

### 4. **Scheduled Maintenance** 📅
- Schedule future maintenance periods
- Automatic activation/deactivation
- Users notified of scheduled downtime

---

## 📊 Maintenance Mode Types

| Mode | Access Level | Use Case | User Impact |
|------|-------------|----------|-------------|
| **None** | Normal | System running normally | No restrictions |
| **Emergency** | Admin only | Critical issues, security breaches | Complete lockdown |
| **Maintenance** | Read-only (users), Full (admins) | Scheduled updates, repairs | Cannot modify data |
| **Read-Only** | Read-only (all) | Data migrations, backups | No write operations |

---

## 🔧 How to Use

### For Administrators:

#### Option 1: Using Admin Panel (Recommended)

1. **Access Maintenance Control:**
   ```
   Navigate to: Admin Dashboard → System Settings → Maintenance Control
   OR directly: /admin/maintenance-control
   ```

2. **View Current Status:**
   - See if system is in maintenance mode
   - View reason and who activated it
   - Check scheduled end time (if any)

3. **Activate Maintenance Mode:**
   - Select mode type (Maintenance or Read-Only)
   - Enter reason (required)
   - Optionally set automatic end time
   - Click "Aktifkan Maintenance Mode"

4. **Emergency Shutdown:**
   - Click red "🚨 EMERGENCY SHUTDOWN" button
   - Enter emergency reason
   - Confirm action
   - System immediately locks down

5. **Deactivate Maintenance:**
   - Click "Matikan Maintenance Mode"
   - System returns to normal

6. **View History:**
   - See past maintenance activations
   - Track who activated and when
   - Review reasons for each activation

#### Option 2: Using API (Advanced)

**1. Check Status (Public):**
```bash
curl http://localhost:5000/api/maintenance/status
```

**2. Activate Maintenance Mode (Admin only):**
```bash
curl -X POST http://localhost:5000/api/maintenance/admin/activate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modeType": "maintenance",
    "reason": "Scheduled system update",
    "scheduledEnd": "2025-12-15T23:00:00"
  }'
```

**3. Emergency Shutdown (Admin only):**
```bash
curl -X POST http://localhost:5000/api/maintenance/admin/emergency \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Security breach detected"
  }'
```

**4. Deactivate (Admin only):**
```bash
curl -X POST http://localhost:5000/api/maintenance/admin/deactivate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Maintenance completed"
  }'
```

**5. View History (Admin only):**
```bash
curl http://localhost:5000/api/maintenance/admin/history?limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 User Experience

### What Users See:

#### Normal Operation:
- No banner
- Full system access
- All features available

#### Maintenance Mode:
- **Yellow banner** at top of page
- Message: "⚠️ MAINTENANCE MODE - System is in maintenance mode. Some features may be unavailable."
- Can view all data
- Cannot create, update, or delete anything
- Forms disabled or show warning messages

#### Emergency Shutdown:
- **Red banner** at top of page
- Message: "🚨 EMERGENCY MAINTENANCE - System is currently unavailable due to emergency maintenance. Please try again later."
- Cannot access system (503 error)
- Login page shows maintenance message

#### Read-Only Mode:
- **Blue banner** at top of page
- Message: "ℹ️ READ-ONLY MODE - System is in read-only mode. You can view data but cannot make changes."
- All write operations blocked
- Forms disabled

---

## 🔐 Security Features

### Access Control:
- Only **admins** can activate/deactivate maintenance mode
- Admin access maintained during all maintenance modes
- Regular users cannot bypass maintenance restrictions
- All actions logged with admin IC and timestamp

### Audit Trail:
- Every activation/deactivation logged
- Reason required for all maintenance actions
- Full history maintained in database
- Cannot be deleted or modified by admins

### Protection:
- Middleware checks maintenance mode on **every request**
- API endpoints protected at application layer
- Database integrity maintained
- No data loss during maintenance

---

## 📋 Emergency Response Procedures

### 🚨 **Critical Security Breach:**

1. **Immediate Action:**
   ```
   Admin Panel → Emergency Shutdown
   Reason: "Security breach detected - investigating"
   ```

2. **Investigate:**
   - Check security logs
   - Identify breach vector
   - Assess data exposure
   - Document findings

3. **Remediate:**
   - Fix security vulnerability
   - Update passwords/keys if needed
   - Apply security patches
   - Test fixes

4. **Recovery:**
   - Deactivate maintenance mode
   - Monitor system closely
   - Notify users if required
   - Update security procedures

### ⚠️ **Database Issues:**

1. **Read-Only Mode:**
   ```
   Admin Panel → Activate Maintenance
   Mode: Read-Only
   Reason: "Database maintenance in progress"
   ```

2. **Perform Maintenance:**
   - Run database repairs
   - Apply migrations
   - Optimize tables
   - Verify data integrity

3. **Test:**
   - Test database operations
   - Verify data accuracy
   - Check performance

4. **Resume:**
   - Deactivate maintenance mode
   - Monitor for issues

### 🔧 **Scheduled Updates:**

1. **Plan:**
   - Schedule maintenance window
   - Notify users in advance
   - Prepare update procedures
   - Have rollback plan

2. **Activate:**
   ```
   Admin Panel → Activate Maintenance
   Mode: Maintenance
   Reason: "Scheduled system update - new features deployment"
   Scheduled End: [Date/Time]
   ```

3. **Execute:**
   - Deploy updates
   - Run tests
   - Verify functionality
   - Check logs

4. **Complete:**
   - Deactivate maintenance mode
   - Notify users of new features
   - Monitor system

---

## 🧪 Testing

### Test Scenarios:

**1. Emergency Shutdown:**
```bash
# As admin
1. Activate emergency shutdown
2. Try to access system as regular user → Should see 503 error
3. Access system as admin → Should work with warning banner
4. Deactivate emergency shutdown
5. Verify normal access restored
```

**2. Maintenance Mode:**
```bash
# As admin
1. Activate maintenance mode
2. As regular user, try to:
   - View data → Should work
   - Create new record → Should fail
   - Update record → Should fail
   - Delete record → Should fail
3. As admin, verify full access
4. Deactivate maintenance mode
5. Verify write operations restored
```

**3. Scheduled Maintenance:**
```bash
# As admin
1. Schedule maintenance for 2 hours from now
2. Wait for scheduled time
3. Verify auto-activation
4. Wait for scheduled end time
5. Verify auto-deactivation
```

**4. Read-Only Mode:**
```bash
# As admin
1. Activate read-only mode
2. Try write operations as admin → Should fail
3. Try read operations → Should work
4. Deactivate read-only mode
5. Verify write operations restored
```

---

## 📊 Monitoring

### What to Monitor:

1. **Maintenance Status:**
   - Check `/api/maintenance/status` regularly
   - Monitor response headers: `X-Maintenance-Active`, `X-Maintenance-Type`

2. **User Impact:**
   - Track blocked requests (503 errors)
   - Monitor user complaints
   - Check support tickets

3. **System Health:**
   - Monitor backend logs
   - Check database performance
   - Verify API response times

4. **Maintenance History:**
   - Review frequency of activations
   - Analyze reasons for emergency shutdowns
   - Identify patterns

### Logs to Check:

```bash
# Backend logs
docker-compose logs backend | grep -i maintenance

# Check maintenance status
curl http://localhost:5000/api/maintenance/status

# View maintenance history
curl http://localhost:5000/api/maintenance/admin/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚙️ Configuration

### Environment Variables:

No additional environment variables required. Maintenance mode uses existing database connection.

### Database Tables:

**`maintenance_mode`** - Stores maintenance status and history
```sql
CREATE TABLE maintenance_mode (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  mode_type VARCHAR(20) DEFAULT 'none',
  reason TEXT,
  scheduled_start TIMESTAMP NULL,
  scheduled_end TIMESTAMP NULL,
  activated_by VARCHAR(50),
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### API Endpoints:

#### Public Endpoints:
- `GET /api/maintenance/status` - Check maintenance status
- `GET /api/maintenance/types` - Get available maintenance types

#### Admin Endpoints:
- `POST /api/maintenance/admin/activate` - Activate maintenance mode
- `POST /api/maintenance/admin/deactivate` - Deactivate maintenance mode
- `POST /api/maintenance/admin/emergency` - Emergency shutdown
- `POST /api/maintenance/admin/schedule` - Schedule maintenance
- `GET /api/maintenance/admin/history` - View history

---

## 🛠️ Troubleshooting

### Problem: Users can still access during emergency shutdown

**Solution:**
1. Check if user is admin (admins always have access)
2. Verify middleware is active:
   ```bash
   docker-compose logs backend | grep -i "maintenance mode activated"
   ```
3. Check maintenance status:
   ```bash
   curl http://localhost:5000/api/maintenance/status
   ```
4. Restart backend if needed:
   ```bash
   docker-compose restart backend
   ```

### Problem: Cannot deactivate maintenance mode

**Solution:**
1. Check if you're logged in as admin
2. Verify authentication token is valid
3. Try via API:
   ```bash
   curl -X POST http://localhost:5000/api/maintenance/admin/deactivate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Manual deactivation"}'
   ```
4. Last resort - directly update database:
   ```sql
   UPDATE maintenance_mode 
   SET is_active = FALSE, deactivated_at = NOW() 
   WHERE is_active = TRUE;
   ```

### Problem: Maintenance mode not showing on frontend

**Solution:**
1. Check if `MaintenanceModeBanner` component is imported in App.jsx
2. Verify frontend can reach API:
   ```bash
   curl http://localhost:5000/api/maintenance/status
   ```
3. Check browser console for errors
4. Clear browser cache
5. Rebuild frontend:
   ```bash
   npm run build
   docker-compose build frontend
   docker-compose up -d frontend
   ```

### Problem: Scheduled maintenance didn't activate

**Solution:**
1. Check if backend is running
2. Verify scheduled time in database:
   ```sql
   SELECT * FROM maintenance_mode 
   WHERE scheduled_start IS NOT NULL 
   ORDER BY id DESC LIMIT 5;
   ```
3. Check backend logs for errors
4. Manually activate if needed

---

## 📝 Best Practices

### DO:
- ✅ Always provide clear reasons for maintenance
- ✅ Notify users in advance of scheduled maintenance
- ✅ Test maintenance mode in development first
- ✅ Set scheduled end times for planned maintenance
- ✅ Monitor system during maintenance
- ✅ Keep maintenance periods short
- ✅ Document emergency procedures
- ✅ Review maintenance history regularly

### DON'T:
- ❌ Don't use emergency shutdown for routine maintenance
- ❌ Don't forget to deactivate after maintenance
- ❌ Don't activate without a clear reason
- ❌ Don't leave system in maintenance mode longer than needed
- ❌ Don't activate during peak usage without planning
- ❌ Don't forget to notify users
- ❌ Don't use maintenance mode as a substitute for proper error handling

---

## 📞 Support

### For Issues:
1. Check this documentation
2. Review troubleshooting section
3. Check backend logs: `docker-compose logs backend`
4. Contact system administrator

### Emergency Contact:
- **Critical Issues:** Contact lead administrator immediately
- **After Hours:** Use emergency shutdown if necessary, investigate next day

---

## 🔄 Updates

### Version History:
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 15, 2025 | Initial release |

### Future Enhancements:
- [ ] SMS notifications for emergency shutdowns
- [ ] Email notifications for scheduled maintenance
- [ ] Mobile app support for admin controls
- [ ] Integration with monitoring systems
- [ ] Automatic maintenance mode on critical errors

---

## ✅ Deployment Checklist

Before using in production:

- [x] Database table created (`maintenance_mode`)
- [x] Backend API endpoints tested
- [x] Admin panel functionality verified
- [x] User experience tested (all modes)
- [x] Emergency procedures documented
- [x] Team trained on usage
- [x] Monitoring configured
- [x] Test scenarios executed

---

**🎉 Emergency Shutdown System is now live and protecting your MyMasjidApp!**

Remember: This is a powerful feature. Use responsibly and always have a plan before activating maintenance mode.

---

**For technical details, see:**
- Backend: `backend/utils/maintenanceMode.js`
- Middleware: `backend/middleware/maintenanceMode.js`
- Controller: `backend/controllers/maintenanceController.js`
- Frontend Banner: `src/components/MaintenanceModeBanner.jsx`
- Admin Panel: `src/pages/MaintenanceControl.jsx`
