const rawApiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export const API_BASE_URL =
  rawApiBaseUrl === '/'
    ? ''
    : rawApiBaseUrl.endsWith('/')
      ? rawApiBaseUrl.slice(0, -1)
      : rawApiBaseUrl;
