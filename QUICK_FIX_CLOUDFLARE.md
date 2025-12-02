# 🚨 Quick Fix: Cloudflare Connection Error

## The Problem
Your app at `e-quran.syedmuhammadkhalidalyahya.workers.dev` is trying to connect to `localhost:5175`, which won't work from Cloudflare.

## The Solution (5 Minutes)

### 1. Find Your Backend URL
**Question:** Where is your backend API server running?
- If on a VPS: `https://your-server.com` or `https://your-ip-address`
- If on cloud: Check your cloud provider dashboard
- If local only: You need to deploy the backend first

### 2. Set Environment Variable in Cloudflare

**Steps:**
1. Go to: https://dash.cloudflare.com/
2. Click **Workers & Pages** → Your project (`e-quran`)
3. Click **Settings** tab
4. Scroll to **Environment Variables**
5. Click **Add variable**
6. Enter:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://YOUR-BACKEND-URL/api`
   - Environment: **Production**
7. Click **Save**

### 3. Redeploy

**Option A: Retry Latest Deployment**
- Go to **Deployments** tab
- Click **⋯** (three dots) on latest deployment
- Click **Retry deployment**

**Option B: Push New Commit**
- Make any small change (or just commit the updated code)
- Push to trigger auto-deploy

### 4. Wait & Test
- Wait 2-5 minutes for rebuild
- Refresh your Cloudflare site
- Check browser console - should see your backend URL (not localhost)
- Try logging in

## Example Values

If your backend is at:
- `https://api.mymasjid.com` → Set `VITE_API_BASE_URL` = `https://api.mymasjid.com/api`
- `https://123.45.67.89` → Set `VITE_API_BASE_URL` = `https://123.45.67.89/api`
- `https://myapp.railway.app` → Set `VITE_API_BASE_URL` = `https://myapp.railway.app/api`

## Don't Have Backend Deployed Yet?

**Option 1: Deploy Backend First**
1. Deploy backend to VPS/cloud
2. Get the URL
3. Set `VITE_API_BASE_URL` to that URL

**Option 2: Use Tunnel (Testing Only)**
```bash
# Install ngrok: https://ngrok.com/
ngrok http 5000
# Use the ngrok URL in VITE_API_BASE_URL
```

## Still Need Help?

**Tell me:**
1. Where is your backend running? (Local/VPS/Cloud?)
2. What's the backend URL? (if you have it)
3. Can you access backend health endpoint? (Try: `https://your-backend/api/health`)

I'll help you configure it correctly!

