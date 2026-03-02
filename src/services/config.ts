// src/services/config.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://farm-fuzion-backend.onrender.com/api';

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

console.log('🌐 API Base URL:', API_BASE);
console.log('🔧 Environment:', isDevelopment ? 'development' : 'production');