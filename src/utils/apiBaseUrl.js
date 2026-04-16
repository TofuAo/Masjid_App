const LOCAL_ORIGIN = 'http://localhost:5000';
const LOCAL_FALLBACK = `${LOCAL_ORIGIN}/api`;

const isLocalhost = (hostname) => {
  if (!hostname) return true;
  return hostname === 'localhost' ||
         hostname === '127.0.0.1' ||
         hostname.startsWith('192.168.') ||
         hostname === '[::1]';
};

/** Backend origin (no /api) for building image/asset URLs. Use VITE_API_BASE_URL on Vercel. */
export const getApiOrigin = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    const url = envUrl.trim().replace(/\/$/, '').replace(/\/api\/?$/, '');
    return url;
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (isLocalhost(hostname)) return LOCAL_ORIGIN;
    return `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
  }
  return LOCAL_ORIGIN;
};

/** Base URL including /api for axios. Set VITE_API_BASE_URL in Vercel to your deployed backend URL. */
export const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    const url = envUrl.trim().replace(/\/$/, '');
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (isLocalhost(hostname)) return LOCAL_FALLBACK;
    const base = `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
    return `${base}/api`;
  }

  return LOCAL_FALLBACK;
};

export default resolveApiBaseUrl;

