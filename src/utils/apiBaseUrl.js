const LOCAL_FALLBACK = 'http://localhost:5000/api';

const isLocalhost = (hostname) => {
  if (!hostname) return true;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname.startsWith('192.168.') ||
         hostname === '[::1]';
};

const isCloudflareDomain = (hostname) => {
  if (!hostname) return false;
  return hostname.includes('.workers.dev') || 
         hostname.includes('.pages.dev') ||
         hostname.includes('cloudflare');
};

export const resolveApiBaseUrl = () => {
  // Check environment variable first (highest priority)
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    const url = envUrl.trim().replace(/\/$/, '');
    // Ensure it doesn't end with /api/api
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    // Always use localhost:5000 for localhost connections
    if (isLocalhost(hostname)) {
      return LOCAL_FALLBACK;
    }

    // For Cloudflare deployments, require environment variable
    // This prevents fallback to localhost which won't work
    if (isCloudflareDomain(hostname)) {
      const errorMsg = 
        '❌ CONFIGURATION ERROR: VITE_API_BASE_URL environment variable is not set!\n\n' +
        'Your Cloudflare-deployed app needs to know where your backend API is located.\n\n' +
        'SOLUTION:\n' +
        '1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables\n' +
        '2. Add: VITE_API_BASE_URL = https://your-backend-server.com/api\n' +
        '3. Redeploy your site\n\n' +
        'See CLOUDFLARE_FIX_IMMEDIATE.md for detailed instructions.';
      
      console.error(errorMsg);
      // Return a placeholder that will fail gracefully
      // The error message will guide the user to fix the configuration
      return 'https://api-backend-not-configured.com/api';
    }

    // For production, use same host with /api
    const base = `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
    return `${base}/api`;
  }

  return LOCAL_FALLBACK;
};

export default resolveApiBaseUrl;

