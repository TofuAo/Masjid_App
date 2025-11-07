const LOCAL_FALLBACK = 'http://localhost:5000/api';

const isLocalhost = (hostname) => {
  if (!hostname) return true;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
};

export const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    if (isLocalhost(hostname)) {
      return LOCAL_FALLBACK;
    }

    const base = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    return `${base}/api`;
  }

  return LOCAL_FALLBACK;
};

export default resolveApiBaseUrl;

