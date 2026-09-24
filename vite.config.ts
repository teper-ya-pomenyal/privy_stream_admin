import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Пути REST API Gateway (api/v1/openapi.yaml). В dev проксируем их на Gateway,
// чтобы не упираться в CORS и не хардкодить адрес узла в бандле.
const API_PREFIXES = ['/login', '/register', '/refresh', '/logout', '/catalog', '/stream'];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gateway = env.GATEWAY_URL || 'http://localhost:8080';

  return {
    base: '/admin/',
    plugins: [react()],
    server: {
      port: 5174,
      proxy: Object.fromEntries(API_PREFIXES.map((p) => [p, { target: gateway, changeOrigin: true }])),
    },
    preview: {
      port: 5174,
      proxy: Object.fromEntries(API_PREFIXES.map((p) => [p, { target: gateway, changeOrigin: true }])),
    },
  };
});
