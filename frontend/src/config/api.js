const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000',
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://mypro-kwda.onrender.com',
  },
};

const currentEnv = process.env.NODE_ENV || 'development';
export const API_BASE_URL = API_CONFIG[currentEnv].baseURL;

export default API_CONFIG; 