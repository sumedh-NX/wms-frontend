/**
 * axiosConfig.ts
 * Global Axios configuration with:
 * - Automatic JWT token injection
 * - Role-aware error handling (403 detection)
 * - Session expiry handling (401 detection)
 * - Network error visibility
 */

import axios from 'axios';

// ===============================================================================
// REQUEST INTERCEPTOR: Auto-inject JWT token on every request
// ===============================================================================
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('🚨 REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// ===============================================================================
// RESPONSE INTERCEPTOR: Catch and categorize errors visibly
// ===============================================================================
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'unknown endpoint';
    const method = error.config?.method?.toUpperCase() || 'GET';

    // 401 Unauthorized - Token expired or invalid
    if (status === 401) {
      console.error(
        `🔒 SESSION EXPIRED: [${method}] ${url}\n` +
        `   → Token is invalid or expired. Redirecting to login...`
      );
      
      // Clear stale token
      localStorage.removeItem('token');
      
      // Redirect to login (uses HashRouter-friendly path)
      if (!window.location.hash.includes('/login')) {
        window.location.href = window.location.origin + '/#/login';
      }
    }

    // 403 Forbidden - Wrong role / permission denied
    else if (status === 403) {
      console.error(
        `🚨 PERMISSION DENIED: [${method}] ${url}\n` +
        `   → Current user role cannot access this endpoint.\n` +
        `   → Check if this endpoint should be called from this page.`
      );
    }

    // 404 Not Found
    else if (status === 404) {
      console.error(
        `❓ NOT FOUND: [${method}] ${url}\n` +
        `   → The requested resource does not exist.`
      );
    }

    // 409 Conflict (e.g., duplicate scans)
    else if (status === 409) {
      console.warn(
        `⚠️ CONFLICT: [${method}] ${url}\n` +
        `   → ${error.response?.data?.message || 'Duplicate or conflicting data'}`
      );
    }

    // 500+ Server Errors
    else if (status >= 500) {
      console.error(
        `💥 SERVER ERROR: [${method}] ${url}\n` +
        `   → Backend crashed or is unreachable.\n` +
        `   → Status: ${status}`
      );
    }

    // Network errors (no response from server)
    else if (!error.response) {
      console.error(
        `📡 NETWORK ERROR: [${method}] ${url}\n` +
        `   → Cannot reach the server. Check internet or backend status.`
      );
    }

    return Promise.reject(error);
  }
);

export default axios;