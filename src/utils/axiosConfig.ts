import axios from 'axios';

axios.defaults.timeout = 10000;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'unknown endpoint';
    const method = error.config?.method?.toUpperCase() || 'GET';

    if (status === 401) {
      console.error(`SESSION EXPIRED: [${method}] ${url}`);
      localStorage.removeItem('token');
      if (!window.location.hash.includes('/login')) {
        window.location.href = window.location.origin + '/#/login';
      }
    } else if (status === 403) {
      console.error(`PERMISSION DENIED: [${method}] ${url}`);
    } else if (status === 404) {
      console.error(`NOT FOUND: [${method}] ${url}`);
    } else if (status === 409) {
      console.warn(`CONFLICT: [${method}] ${url} → ${error.response?.data?.message || 'Duplicate'}`);
    } else if (status >= 500) {
      console.error(`SERVER ERROR: [${method}] ${url} → ${status}`);
    } else if (!error.response) {
      console.error(`NETWORK ERROR: [${method}] ${url}`);
    }

    return Promise.reject(error);
  }
);

export default axios;