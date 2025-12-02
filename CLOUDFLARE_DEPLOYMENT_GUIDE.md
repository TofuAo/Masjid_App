# Cloudflare Pages/Workers Deployment Guide

This guide explains how to properly configure your MyMasjidApp frontend when deploying to Cloudflare Pages or Workers.

## Problem

When deploying to Cloudflare, the frontend needs to know where your backend API is hosted. If the `VITE_API_BASE_URL` environment variable is not set, the app will try to connect to `localhost`, which won't work from Cloudflare.

## Solution

You need to set the `VITE_API_BASE_URL` environment variable in your Cloudflare deployment to point to your backend API server.

## Step-by-Step Instructions

### Option 1: Cloudflare Pages (Recommended)

1. **Go to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com/
   - Select your account
   - Go to **Pages** → Select your project

2. **Set Environment Variables**
   - Click on **Settings** → **Environment Variables**
   - Click **Add variable**
   - Add the following:
     - **Variable name:** `VITE_API_BASE_URL`
     - **Value:** `https://your-backend-domain.com/api`
       - Replace `your-backend-domain.com` with your actual backend server URL
       - Example: `https://api.mymasjid.com/api` or `https://backend.yourdomain.com/api`
     - **Environment:** Select **Production** (and **Preview** if needed)

3. **Redeploy**
   - After adding the environment variable, trigger a new deployment
   - Go to **Deployments** → Click **Retry deployment** on the latest build
   - Or push a new commit to trigger automatic deployment

### Option 2: Cloudflare Workers

If you're using Cloudflare Workers, you can set environment variables in `wrangler.toml`:

```toml
[env.production]
vars = { VITE_API_BASE_URL = "https://your-backend-domain.com/api" }
```

Or via the Cloudflare Dashboard:
1. Go to **Workers & Pages** → Select your worker
2. Go to **Settings** → **Variables**
3. Add `VITE_API_BASE_URL` with your backend URL

### Option 3: Build-Time Environment Variables

If you're building locally and then deploying the built files:

1. **Create a `.env.production` file** in your project root:
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

2. **Build with production environment:**
```bash
npm run build
```

3. **Deploy the `dist` folder** to Cloudflare

## Finding Your Backend URL

Your backend API URL depends on where you've deployed your backend:

- **If backend is on a VPS/server:** `https://your-server-ip-or-domain.com/api`
- **If backend is on a cloud provider:** `https://your-backend-domain.com/api`
- **If using a subdomain:** `https://api.yourdomain.com/api`

## Verification

After setting the environment variable and redeploying:

1. Open your Cloudflare-deployed app in a browser
2. Open Developer Console (F12)
3. Check the Network tab
4. API calls should now go to your backend URL (not `localhost`)
5. You should see successful API requests instead of connection errors

## Troubleshooting

### Still seeing `localhost:5175` errors?

- The build might have been done before setting the environment variable
- **Solution:** Redeploy after setting the environment variable

### Still seeing connection errors?

1. **Check CORS settings on your backend:**
   - Your backend must allow requests from your Cloudflare domain
   - Update `FRONTEND_URL` in `backend/.env` to include your Cloudflare domain
   - Example: `FRONTEND_URL=https://e-quran.syedmuhammadkhalidalyahya.workers.dev`

2. **Verify backend is accessible:**
   - Test your backend URL directly: `https://your-backend-domain.com/api/health`
   - Should return a success response

3. **Check environment variable is set:**
   - In Cloudflare Dashboard, verify `VITE_API_BASE_URL` is set correctly
   - Make sure it's set for the correct environment (Production/Preview)

### Backend not accessible from Cloudflare?

- Ensure your backend server is publicly accessible (not behind a firewall)
- Check that your backend allows HTTPS connections
- Verify SSL certificate is valid for your backend domain

## Example Configuration

**Frontend (Cloudflare):**
- URL: `https://e-quran.syedmuhammadkhalidalyahya.workers.dev`
- Environment Variable: `VITE_API_BASE_URL=https://your-backend-server.com/api`

**Backend (VPS/Server):**
- URL: `https://your-backend-server.com`
- CORS: `FRONTEND_URL=https://e-quran.syedmuhammadkhalidalyahya.workers.dev`

## Quick Fix Command

If you have access to your backend server, you can quickly test the connection:

```bash
# Test backend health
curl https://your-backend-server.com/api/health

# Test from Cloudflare domain (if backend allows it)
curl -H "Origin: https://e-quran.syedmuhammadkhalidalyahya.workers.dev" \
     https://your-backend-server.com/api/health
```

## Need Help?

If you're still experiencing issues:
1. Check browser console for specific error messages
2. Verify backend is running and accessible
3. Ensure CORS is properly configured on backend
4. Make sure environment variable is set and deployment is rebuilt

