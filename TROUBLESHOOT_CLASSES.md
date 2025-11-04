# Troubleshooting: Classes Not Loading in Student Form

If you see "Ralat: Failed to fetch classes" when adding a new student, follow these steps:

## Step 1: Check Backend Server is Running

1. Open terminal in the `backend` folder
2. Run: `npm run dev`
3. You should see: `Server running on port 5001` (or 5000 if configured)
4. If not running, start it

## Step 2: Check Frontend Can Reach Backend

1. Open browser console (F12)
2. Go to Network tab
3. Try adding a new student
4. Look for request to `/api/classes`
5. Check if:
   - Request returns 200 (OK) - API is working
   - Request returns 401 - Authentication issue
   - Request returns 500 - Server error
   - Request fails - Connection issue

## Step 3: Check Database Has Classes

1. Open your database tool (phpMyAdmin, MySQL Workbench, etc.)
2. Connect to `masjid_app` database
3. Run query: `SELECT * FROM classes;`
4. If no classes exist:
   - Add a class through the Kelas (Classes) page in the app
   - Or run this SQL:
   ```sql
   INSERT INTO classes (nama_kelas, level, status, guru_ic, kapasiti) 
   VALUES ('Test Class', 'Asas', 'aktif', 'YOUR_TEACHER_IC', 20);
   ```

## Step 4: Check Authentication Token

1. Open browser console (F12)
2. Go to Application tab > Local Storage
3. Look for `authToken`
4. If missing:
   - Log out and log back in
   - Token should be set after login

## Step 5: Check API Base URL

1. Frontend expects: `http://localhost:5000/api` or `http://localhost:5001/api`
2. Backend runs on: Port 5001 by default (or check `backend/server.js`)
3. If mismatch:
   - Update `src/services/api.js` line 5, or
   - Create `.env` file with: `VITE_API_BASE_URL=http://localhost:5001/api`

## Step 6: Check Console Logs

With the new logging, you should see in browser console:
- `Fetching classes...`
- `Auth token exists: true/false`
- `Initial response: ...`
- `Extracted classes list: ...`

This will help identify where the issue occurs.

## Common Issues

### Issue: "Access token required" (401)
**Solution**: Token expired or invalid. Log out and log back in.

### Issue: "Connection refused" or Network Error
**Solution**: Backend server not running. Start it with `cd backend && npm run dev`

### Issue: Empty array returned
**Solution**: No classes in database. Add classes through the app or SQL.

### Issue: CORS error
**Solution**: Backend CORS not configured. Check `backend/server.js` CORS settings.

