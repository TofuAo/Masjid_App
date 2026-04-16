# Vercel (Frontend) + Backend Deployment

The frontend is built with Vite and can be deployed to Vercel. The backend is a separate Node/Express app and must be deployed elsewhere (e.g. Render, Railway, Fly.io).

## 1. Deploy the backend

- Deploy the `backend` folder to Render, Railway, Fly.io, or another Node host.
- Note your live backend URL, e.g. `https://my-masjid-api.onrender.com`.

## 2. Environment variables on Vercel

In **Vercel** → your project → **Settings** → **Environment Variables**:

| Name               | Value                          | Notes                    |
|--------------------|--------------------------------|--------------------------|
| `VITE_API_BASE_URL`| `https://your-backend.onrender.com` | Your deployed backend URL (no `/api`). Required for production. |

Redeploy the frontend after adding or changing this variable so the new value is baked into the build.

## 3. CORS on the backend

The backend allows:

- Default: `http://localhost:*`, `https://masjid-app-sage.vercel.app`, and any `*.vercel.app` origin.
- Optional: set `FRONTEND_URL` (or comma-separated list) in the backend env, e.g.:
  - `FRONTEND_URL=https://masjid-app-sage.vercel.app`
  - `FRONTEND_URL=https://masjid-app-sage.vercel.app,https://my-custom-domain.com`

No extra CORS config is needed for the main Vercel app or preview URLs.

## 4. Local development

- Root `.env`: `VITE_API_BASE_URL=http://localhost:5000` (backend port).
- Run backend on port 5000 and frontend with `npm run dev`. The app will use `http://localhost:5000/api` for API calls.

## Summary

- **Frontend (Vercel):** Set `VITE_API_BASE_URL` to the live backend URL.
- **Backend:** Deploy to a Node host and set `FRONTEND_URL` if you use a custom domain; Vercel domains are already allowed.
- **CORS:** Backend is configured to accept requests from localhost and Vercel (including previews).
